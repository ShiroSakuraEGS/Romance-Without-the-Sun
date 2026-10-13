/**
 * 《無日浪漫》Web Audio API 零延遲雙軌同步循環引擎 (Web Audio Sync Engine)
 * 
 * 核心機制：
 * 1. 採用瀏覽器硬體級 Web Audio API (AudioContext) 作為主要引擎，將伴奏與主唱解碼為 AudioBuffer。
 * 2. 伴奏與主唱共享同一微秒級硬體時脈 (audioContext.currentTime)，兩軌於同一音訊採樣點同時啟動，達成「絕對 0ms 延遲」同步。
 * 3. 音量調節直接於 DSP 著色器線程 (GainNode.setTargetAtTime) 進行硬體平滑插值，不佔用主執行緒，零卡頓、零爆音。
 * 4. 具備 HTML5 Audio 並行回退機制，確保在任何環境下皆能流暢運作。
 */

class MultiTrackSyncEngine {
  constructor() {
    this.isLoaded = false;
    this.isPlaying = false;
    this.mode = null; // 'webaudio' | 'html5'

    // 音軌檔案配置清單
    this.trackConfigs = [
      {
        id: "instrumental",
        name: "無日浪漫 (Without Lead Vocal) 伴奏背景音",
        src: "assets/無日浪漫 (Without Lead Vocal).mp3",
        isMaster: true,
        defaultGain: 0.85
      },
      {
        id: "lead_vocals",
        name: "無日浪漫 (Lead Vocal) 主唱人聲",
        src: "assets/無日浪漫 (Lead Vocal).mp3",
        isLead: true,
        defaultGain: 0.0
      }
    ];

    // Web Audio API 狀態
    this.audioCtx = null;
    this.audioBuffers = {};
    this.sourceNodes = {};
    this.gainNodes = {};
    this.startTime = 0;
    this.pauseOffset = 0;
    this.duration = 226.92; // 精準總時長 (秒)

    // HTML5 Audio 回退狀態
    this.audioElements = {};
    this.masterTrack = null;
    this.leadVocalTrack = null;

    // 音量狀態
    this.leadVocalVolume = 0.0;
    this.targetLeadVocalVolume = 0.0;

    // 定時器與事件回呼
    this.progressTimer = null;
    this.volumeRampFrameId = null;
    this.onProgressUpdate = null; // 當前播放進度 (currentTime / duration)
    this.onLeadVolumeChange = null; // 當前主唱實際音量回報
  }

  /**
   * 初始化並載入音訊（優先使用 Web Audio API，若失敗則回退至 HTML5 Audio）
   */
  async init() {
    if (this.isLoaded) return;

    // 建立 AudioContext
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      try {
        this.audioCtx = new AudioContextClass();
      } catch (e) {
        console.warn("無法建立 AudioContext，將使用 HTML5 Audio 模式:", e);
      }
    }

    // 嘗試透過 Web Audio API 載入並解碼雙軌音訊
    let webAudioSuccess = false;
    if (this.audioCtx) {
      try {
        const fetchPromises = this.trackConfigs.map(async (cfg) => {
          const resp = await fetch(encodeURI(cfg.src));
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const arrayBuf = await resp.arrayBuffer();
          const audioBuf = await this.audioCtx.decodeAudioData(arrayBuf);
          this.audioBuffers[cfg.id] = audioBuf;
        });

        await Promise.all(fetchPromises);

        // 建立音量 GainNode
        this.gainNodes.instrumental = this.audioCtx.createGain();
        this.gainNodes.instrumental.gain.value = 0.85;
        this.gainNodes.instrumental.connect(this.audioCtx.destination);

        this.gainNodes.lead_vocals = this.audioCtx.createGain();
        this.gainNodes.lead_vocals.gain.value = 0.0;
        this.gainNodes.lead_vocals.connect(this.audioCtx.destination);

        if (this.audioBuffers.instrumental) {
          this.duration = this.audioBuffers.instrumental.duration;
        }

        this.mode = "webaudio";
        webAudioSuccess = true;
      } catch (err) {
        console.warn("Web Audio API 音訊解碼或網路載入回退:", err);
      }
    }

    // 若 Web Audio API 載入未成功，啟用 HTML5 Audio 雙軌備援
    if (!webAudioSuccess) {
      this.mode = "html5";
      const loadPromises = this.trackConfigs.map((cfg) => {
        return new Promise((resolve) => {
          const audio = new Audio();
          audio.src = encodeURI(cfg.src);
          audio.preload = "auto";
          audio.loop = false;

          if (cfg.isLead) {
            audio.volume = 0.0;
            this.leadVocalTrack = audio;
          } else {
            audio.volume = cfg.defaultGain || 0.85;
            this.masterTrack = audio;
          }

          this.audioElements[cfg.id] = audio;

          audio.addEventListener("canplaythrough", () => resolve(), { once: true });
          audio.addEventListener("loadeddata", () => resolve(), { once: true });
          audio.addEventListener("error", (e) => {
            console.warn(`HTML5 音軌載入警告: ${cfg.src}`, e);
            resolve();
          }, { once: true });

          audio.load();
        });
      });

      await Promise.all(loadPromises);

      if (this.masterTrack) {
        this.masterTrack.addEventListener("ended", () => this._restartAllTracks());
        this.masterTrack.addEventListener("timeupdate", () => {
          if (this.onProgressUpdate && this.masterTrack.duration) {
            const ratio = this.masterTrack.currentTime / this.masterTrack.duration;
            this.onProgressUpdate(ratio, this.masterTrack.currentTime, this.masterTrack.duration);
          }
        });
      }

      this._startHtml5VolumeRampLoop();
    }

    this.isLoaded = true;
  }

  /**
   * 同步播放雙軌（絕對零延遲啟動）
   */
  async play() {
    if (!this.isLoaded) await this.init();

    if (this.mode === "webaudio") {
      if (this.audioCtx.state === "suspended") {
        await this.audioCtx.resume();
      }

      // 停止先前可能存在的播放節點
      this._stopWebAudioSources();

      // 建立雙軌 BufferSource 節點
      const instSource = this.audioCtx.createBufferSource();
      instSource.buffer = this.audioBuffers.instrumental;
      instSource.loop = true;
      instSource.connect(this.gainNodes.instrumental);

      const vocalSource = this.audioCtx.createBufferSource();
      vocalSource.buffer = this.audioBuffers.lead_vocals;
      vocalSource.loop = true;
      vocalSource.connect(this.gainNodes.lead_vocals);

      this.sourceNodes.instrumental = instSource;
      this.sourceNodes.lead_vocals = vocalSource;

      // 取得硬體音訊精準起點
      const now = this.audioCtx.currentTime;
      this.startTime = now - this.pauseOffset;

      // 雙軌於同一微秒起點同時播放 (零延遲)
      instSource.start(0, this.pauseOffset);
      vocalSource.start(0, this.pauseOffset);

      this.isPlaying = true;
      this._startProgressTracker();
    } else {
      // HTML5 Audio 備援播放模式：並行一次性觸發
      if (this.masterTrack && this.leadVocalTrack) {
        this.masterTrack.currentTime = this.pauseOffset;
        this.leadVocalTrack.currentTime = this.pauseOffset;

        try {
          await Promise.all([
            this.masterTrack.play(),
            this.leadVocalTrack.play()
          ]);
        } catch (e) {
          console.warn("HTML5 音軌播放提示:", e);
        }
      }
      this.isPlaying = true;
    }
  }

  /**
   * 暫停播放
   */
  pause() {
    if (this.mode === "webaudio") {
      if (this.isPlaying && this.audioCtx) {
        this.pauseOffset = (this.audioCtx.currentTime - this.startTime) % this.duration;
        this._stopWebAudioSources();
      }
      this._stopProgressTracker();
    } else {
      if (this.masterTrack) {
        this.pauseOffset = this.masterTrack.currentTime;
      }
      Object.values(this.audioElements).forEach((audio) => audio.pause());
    }
    this.isPlaying = false;
  }

  /**
   * 切換播放 / 暫停
   */
  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * 停止 Web Audio Source 節點
   */
  _stopWebAudioSources() {
    if (this.sourceNodes.instrumental) {
      try { this.sourceNodes.instrumental.stop(); } catch (e) {}
      this.sourceNodes.instrumental.disconnect();
      this.sourceNodes.instrumental = null;
    }
    if (this.sourceNodes.lead_vocals) {
      try { this.sourceNodes.lead_vocals.stop(); } catch (e) {}
      this.sourceNodes.lead_vocals.disconnect();
      this.sourceNodes.lead_vocals = null;
    }
  }

  /**
   * 循環或重新對齊起點
   */
  _restartAllTracks() {
    this.pauseOffset = 0;
    if (this.isPlaying) {
      this.play();
    }
  }

  /**
   * 設定主唱目標音量 (0.0 ~ 1.0)
   * @param {number} targetVolume - 目標音量
   * @param {boolean} force - 是否強制覆蓋（如點擊重置）
   */
  setLeadVocalVolume(targetVolume, force = false) {
    const clamped = Math.max(0.0, Math.min(1.0, targetVolume));
    if (force) {
      this.targetLeadVocalVolume = clamped;
      this.leadVocalVolume = clamped;
    } else {
      // 保持高水位，不隨打字停頓縮小
      this.targetLeadVocalVolume = Math.max(this.targetLeadVocalVolume, clamped);
    }

    if (this.mode === "webaudio" && this.gainNodes.lead_vocals && this.audioCtx) {
      // 在音訊 DSP 執行緒以超平滑時間常數漸變（0.06s），零 CPU 負載
      if (force) {
        this.gainNodes.lead_vocals.gain.setValueAtTime(this.targetLeadVocalVolume, this.audioCtx.currentTime);
      } else {
        this.gainNodes.lead_vocals.gain.setTargetAtTime(this.targetLeadVocalVolume, this.audioCtx.currentTime, 0.06);
      }
      this.leadVocalVolume = this.targetLeadVocalVolume;

      if (this.onLeadVolumeChange) {
        this.onLeadVolumeChange(this.leadVocalVolume);
      }
    }
  }

  /**
   * 重置主唱歌聲回歸靜音 (0.0)
   */
  resetLeadVocalVolume() {
    this.setLeadVocalVolume(0.0, true);
    if (this.leadVocalTrack) {
      this.leadVocalTrack.volume = 0.0;
    }
    if (this.onLeadVolumeChange) {
      this.onLeadVolumeChange(0.0);
    }
  }

  /**
   * 啟動播放進度監聽計時器 (Web Audio 模式)
   */
  _startProgressTracker() {
    this._stopProgressTracker();
    this.progressTimer = setInterval(() => {
      if (this.isPlaying && this.audioCtx) {
        const cur = (this.audioCtx.currentTime - this.startTime) % this.duration;
        if (this.onProgressUpdate) {
          this.onProgressUpdate(cur / this.duration, cur, this.duration);
        }
      }
    }, 150);
  }

  /**
   * 停止進度計時器
   */
  _stopProgressTracker() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  /**
   * HTML5 Audio 模式音量平滑插值迴圈
   */
  _startHtml5VolumeRampLoop() {
    if (this.volumeRampFrameId) return;
    const ramp = () => {
      if (this.mode === "html5" && this.leadVocalTrack) {
        const diff = this.targetLeadVocalVolume - this.leadVocalVolume;
        if (Math.abs(diff) > 0.001) {
          this.leadVocalVolume += diff * 0.05;
          this.leadVocalTrack.volume = Math.max(0.0, Math.min(1.0, this.leadVocalVolume));

          if (this.onLeadVolumeChange) {
            this.onLeadVolumeChange(this.leadVocalVolume);
          }
        }
      }
      this.volumeRampFrameId = requestAnimationFrame(ramp);
    };
    this.volumeRampFrameId = requestAnimationFrame(ramp);
  }
}

// 導出全局單例
window.multiTrackAudio = new MultiTrackSyncEngine();



