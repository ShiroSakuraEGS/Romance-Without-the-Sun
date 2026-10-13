/**
 * 《無日浪漫》沉浸式打字工作站 - 主控制器 (App Controller)
 * 負責處理黑客詩人式鍵盤輸入轉譯、文字流渲染、多軌音訊同步與主唱歌聲動態調控
 */

// 《無日浪漫》完整散文文本
const NOCTURNE_ROMANCE_TEXT = `有一種浪漫叫做無日浪漫，沒有烈日的熱情，但有傍晚溫柔的微風，那是一種獨屬於夜的浪漫。

當然有人會直接把夜晚歸類到孤獨一方，想起傍晚及深夜，透過窗外燈光的影射，有人會坐在窗台旁邊，獨自一人平淡而又一臉憂愁的望着周遭毫無光照的生活場所，寂寥得很，像是空虛一般，沒有生氣。

但這也是我的日常，可能因為我不喜歡烈日當空把自己曬得像在熱鍋上的螞蟻，心情煩躁得在街上只想狂奔至下一處室內場所，像是為了生存，我要不停活動累得雙腳發麻，因此我討厭熱，從而也討厭陽光，討厭太陽。而直到後來我立志躲進夜晚當中，坐在窗台旁邊拿着罐裝飲料，把所有燈關起來，任由涼風吹進房間，自己也把視線投放於夜晚時我才意識到，自己真正迎來了我的日常。

曾經有到訪過家裏的朋友說過：「一個人不就很孤獨，不就很空虛，很寂寞。」但我卻意外的回答他說：「這很浪漫呀！有種日光日白沒有的浪漫。燈飾在夜晚才不會被太陽搶走焦點，晚上的人們也展現出上班或上學以外的生命力。這些都是無日浪漫的證明呢！」

我在想那個朋友會這樣說會不會是因為他有女朋友，那年的聖誕夜我就跟在他們兩個後面一起去看着街上的聖誕裝飾，說實在的，他們早上也未必能夠這麼溫馨的牽着手逛街，這也是讓我崇拜夜晚鬧市的原因之一，儘管我身無旁人，有些人身邊也有他們的另一半，我也並不會認為自己必須要擁有另一個人在旁邊才配擁有浪漫。若然有電影以第三視覺拍攝着我獨自走再街上的畫面，一呼一吸所產生的霧氣，抬頭依然對每一年燈飾嘖嘖稱奇的我，又何嘗不是以一種脫離年紀的純真模樣對社會某種純粹的創造力及美貌為之而動容，甚至沉淪。要是早上的話，恐怕又因為那太陽光的反射，我連抬頭看建築物都不敢。

無日浪漫，可以說是一種脫離常規的浪漫嗎？又或者說不見得光的浪漫？某一次在那位女生的家中醒來我也在想這件事，我很感謝那位女生讓我留在她的家中，但其實我們由始至終都不是情侶，也只是因為生理需求剛好彼此滿足到而聚在一起。直到現在我也在當水煙吧中調配水煙味道的水煙師，而她是之前店內的侍應生，相遇就在這一個早上並不會營業的店舖中發生，我也不曾指望過我們一定要成為情侶，也只會好奇我們的關係會有多麼的複雜而又說不清，道不明，像是夜幕中那似乎看不清的人與人之間的距離。

我不知道我有什麼吸引着她，我或許只能知道我為什麼找的是她，像是路燈照射在自己身上露出倒影一樣，總感覺她跟我很像，只不過一個是男，一個是女，甚至太過相似而對此感到恐懼，會不會是某種會代替自己的影子怪物一樣，每晚跟她纏綿，我都總能清晰的意識到自己內心的某個黑暗面，不過到頭來哪有人會真的喜歡自己的黑暗面，可能最多只是接受這個東西存在，而又不會痴狂的愛上這一面。可能就像自己不喜歡被光照得一清二楚一樣，我們就喜歡這種曖昧的聯繫與隔膜，所以我們的浪漫也需要「無日」來維持。

那位朋友其實也很清楚我身上發生的這些事情了，他似懂非懂的看着我的神態，他不知道看出了什麼，但是他說與他在白天遇到的人都很不一樣，他說不出不一樣的原因，也說不出到底是什麼經歷看起來與白天的人們毫不相似，可能也就是這種模糊的東西才是夜晚的精髓，我們不需要跟白天一樣方方面面都相對確實，在曖昧、模糊、自我陶醉當中尋求一個與日間與別不同的觀景席位，正如我並不習慣在白天的觀景台上幫人拍照一樣，或許更適合我的是窗台旁邊似乎搖搖欲墜卻又有着高樓玻璃保護着，與深夜都市貌似融為一體的窗台席位，由此可嘆無日的浪漫。`;

document.addEventListener("DOMContentLoaded", () => {
  // DOM 元素快取
  const welcomeOverlay = document.getElementById("welcome-overlay");
  const startBtn = document.getElementById("start-btn");
  const bgVideo = document.getElementById("bg-video");

  // 打字視窗元素
  const typerStage = document.getElementById("typer-stage");
  const typerCard = document.getElementById("typer-card");
  const textViewport = document.getElementById("text-viewport");
  const typedContent = document.getElementById("typed-content");
  const typerGuide = document.getElementById("typer-guide");
  const hiddenCatcher = document.getElementById("hidden-type-catcher");
  const charCountElem = document.getElementById("char-count");

  // 狀態列與主唱指示儀
  const vocalsCard = document.getElementById("vocals-card");
  const vocalsPercentText = document.getElementById("vocals-percent");
  const waveBars = document.querySelectorAll(".wave-bar");

  // 底部控制項與新增按鈕
  const playPauseBtn = document.getElementById("btn-play-pause");
  const toggleTyperBtn = document.getElementById("btn-toggle-typer");
  const exportPdfBtn = document.getElementById("btn-export-pdf");
  const autoTypeBtn = document.getElementById("btn-auto-type");
  const resetBtn = document.getElementById("btn-reset");
  const fullscreenBtn = document.getElementById("btn-fullscreen");
  const progressFill = document.getElementById("progress-fill");
  const progressTime = document.getElementById("progress-time");

  // 提示通知元素
  const toastElem = document.getElementById("toast-notification");

  // 打字與視窗狀態
  let currentTextIndex = 0;
  const fullTextLength = NOCTURNE_ROMANCE_TEXT.length;
  let isTypingActive = false;
  let lastTypeTime = 0;
  let autoTypeInterval = null;

  // PDF 下載與視窗收起狀態標誌
  let isPdfDownloaded = false;
  let isTyperCollapsed = false;

  // 主唱音量飽和字數門檻
  // 累積輸入約 140 字時達到主唱 100% 飽和音量，期間平滑漸進綻放
  const VOCAL_SATURATION_CHARS = 140;

  /**
   * 顯示頂部浮動提示通知 (Toast)
   */
  function showToast(messageHtml, duration = 3800) {
    if (!toastElem) return;
    toastElem.innerHTML = messageHtml;
    toastElem.classList.remove("hidden");

    if (toastElem._timer) clearTimeout(toastElem._timer);
    toastElem._timer = setTimeout(() => {
      toastElem.classList.add("hidden");
    }, duration);
  }

  /**
   * 封裝並下載《無日浪漫》手稿 PDF (作者：白櫻蒼成 · 嚴格雙頁典藏手稿，高解析度且杜絕偏移與空白頁)
   */
  async function exportPdfDocument() {
    const wrapper = document.getElementById("pdf-export-wrapper");
    if (!wrapper) return;

    showToast(`<span>📜</span> 正在為您封裝《無日浪漫》典藏手稿 PDF（作者：白櫻蒼成）...`, 3500);

    const pdfFilename = "無日浪漫 - 白櫻蒼成.pdf";

    // 暫存原先樣式，並切換至絕對座標原點 (置於負 z-index 背後，避免使用者視覺閃爍)
    const prevStyle = {
      position: wrapper.style.position,
      top: wrapper.style.top,
      left: wrapper.style.left,
      zIndex: wrapper.style.zIndex,
      opacity: wrapper.style.opacity,
      visibility: wrapper.style.visibility,
      display: wrapper.style.display
    };

    try {
      // 確保 Web Fonts 字型（如 Noto Serif TC）已全數載入，避免字型 fallback 走樣
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      wrapper.style.position = "fixed";
      wrapper.style.top = "0px";
      wrapper.style.left = "0px";
      wrapper.style.zIndex = "-99999";
      wrapper.style.opacity = "1";
      wrapper.style.visibility = "visible";
      wrapper.style.display = "block";

      // 檢查是否可使用 jsPDF 與 html2canvas 進行單頁無損壓模
      const hasJsPdf = typeof window.jspdf !== "undefined" || typeof window.jsPDF !== "undefined";
      const hasHtml2Canvas = typeof window.html2canvas !== "undefined";

      if (hasJsPdf && hasHtml2Canvas) {
        const JsPdfClass = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : window.jsPDF;
        const pdf = new JsPdfClass({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
          compress: true
        });

        const pages = wrapper.querySelectorAll(".pdf-page");
        for (let i = 0; i < pages.length; i++) {
          if (i > 0) {
            pdf.addPage();
          }

          // 對每一頁進行獨立 2x Retina 高清採樣
          const canvas = await window.html2canvas(pages[i], {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            width: 794,
            height: 1123,
            x: 0,
            y: 0,
            scrollX: 0,
            scrollY: 0,
            windowWidth: 794,
            windowHeight: 1123,
            onclone: (clonedDoc, clonedElem) => {
              // 在克隆環境中將 body 邊界與捲軸完全歸零，徹底杜絕水平與垂直偏移
              clonedDoc.body.style.margin = "0";
              clonedDoc.body.style.padding = "0";
              clonedDoc.body.style.overflow = "visible";

              const clonedWrapper = clonedDoc.getElementById("pdf-export-wrapper");
              if (clonedWrapper) {
                clonedWrapper.style.position = "static";
                clonedWrapper.style.top = "0px";
                clonedWrapper.style.left = "0px";
                clonedWrapper.style.margin = "0";
                clonedWrapper.style.padding = "0";
                clonedWrapper.style.transform = "none";
              }

              // 隔離渲染：在克隆樹中只顯示當前渲染頁面，避免兄弟頁面累積縱向坐標差
              const allPages = clonedDoc.querySelectorAll(".pdf-page");
              allPages.forEach((p, idx) => {
                if (idx !== i) {
                  p.style.display = "none";
                } else {
                  p.style.display = "flex";
                  p.style.margin = "0";
                }
              });
            }
          });

          const imgData = canvas.toDataURL("image/jpeg", 0.96);
          // A4 滿版尺寸 (210mm x 297mm)
          pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
        }

        pdf.save(pdfFilename);
        showToast(`<span>✨</span> 《無日浪漫》典藏手稿 PDF 已成功下載！作者：白櫻蒼成`, 4000);
      } else if (typeof html2pdf !== "undefined") {
        // html2pdf 自動回退機制
        const content = document.getElementById("pdf-export-content");
        const opt = {
          margin: 0,
          filename: pdfFilename,
          image: { type: "jpeg", quality: 0.96 },
          html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: 0, x: 0, y: 0, width: 794, windowWidth: 794 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["avoid-all", "css"] }
        };
        await html2pdf().set(opt).from(content).save();
        showToast(`<span>✨</span> 《無日浪漫》典藏手稿 PDF 已成功下載！作者：白櫻蒼成`, 4000);
      } else {
        fallbackDownloadTxt(pdfFilename);
      }
    } catch (err) {
      console.error("PDF 匯出異常:", err);
      fallbackDownloadTxt(pdfFilename);
    } finally {
      // 恢復原本離屏狀態
      wrapper.style.position = prevStyle.position || "fixed";
      wrapper.style.top = prevStyle.top || "0px";
      wrapper.style.left = prevStyle.left || "-9999px";
      wrapper.style.zIndex = prevStyle.zIndex || "-99999";
      wrapper.style.opacity = prevStyle.opacity || "0";
      wrapper.style.visibility = prevStyle.visibility || "hidden";
      wrapper.style.display = prevStyle.display || "block";
    }
  }

  /**
   * 備援純文本下載機制
   */
  function fallbackDownloadTxt(filename) {
    const textBlob = new Blob([`《無日浪漫》\n作者：白櫻蒼成\n\n` + NOCTURNE_ROMANCE_TEXT], { type: "text/plain;charset=utf-8" });
    const dlLink = document.createElement("a");
    dlLink.href = URL.createObjectURL(textBlob);
    dlLink.download = filename.replace(".pdf", ".txt");
    dlLink.click();
    URL.revokeObjectURL(dlLink.href);
    showToast(`<span>📄</span> 已為您下載《無日浪漫》手稿文本！作者：白櫻蒼成`, 3500);
  }

  /**
   * 收起打字視窗至畫面底部，讓觀眾專注沉浸於背景動畫與音樂
   */
  function collapseTyperInterface() {
    if (!typerStage) return;
    typerStage.classList.add("collapsed");
    isTyperCollapsed = true;
    if (toggleTyperBtn) {
      toggleTyperBtn.innerHTML = `<span>📜</span> 展開手稿`;
      toggleTyperBtn.title = "展開打字手稿視窗";
    }
    showToast(`<span>🌌</span> 打字視窗已收起，請靜心沉浸於畫面與歌聲之中`, 4200);
  }

  /**
   * 展開打字視窗
   */
  function expandTyperInterface() {
    if (!typerStage) return;
    typerStage.classList.remove("collapsed");
    isTyperCollapsed = false;
    if (toggleTyperBtn) {
      toggleTyperBtn.innerHTML = `<span>🔽</span> 收起手稿`;
      toggleTyperBtn.title = "收起打字手稿視窗";
    }
    hiddenCatcher.focus();
  }

  /**
   * 切換打字視窗收起 / 展開
   */
  function toggleTyperInterface() {
    if (isTyperCollapsed) {
      expandTyperInterface();
    } else {
      collapseTyperInterface();
    }
  }

  /**
   * 格式化時間 (分:秒)
   */
  function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  /**
   * 敲擊鍵盤，向前推進文字
   * @param {number} stride - 前進字元數
   */
  function advanceText(stride = 2) {
    if (currentTextIndex >= fullTextLength) return;

    if (currentTextIndex === 0) {
      typerGuide.classList.add("hidden");
    }

    const nextIndex = Math.min(fullTextLength, currentTextIndex + stride);
    const appendedText = NOCTURNE_ROMANCE_TEXT.slice(currentTextIndex, nextIndex);
    currentTextIndex = nextIndex;

    // 將換行符號轉為段落標籤，以增量方式追加至 DOM (避免全文重解析，達成 60 FPS 極致流暢)
    const formattedAppend = appendedText.replace(/\n\n/g, "<br><br>").replace(/\n/g, "<br>");
    typedContent.insertAdjacentHTML("beforeend", formattedAppend);

    // 自動平滑滾動到底部
    textViewport.scrollTop = textViewport.scrollHeight;

    // 更新字數顯示
    charCountElem.textContent = `${currentTextIndex} / ${fullTextLength} 字`;

    // 記錄最後打字時間
    lastTypeTime = Date.now();
    isTypingActive = true;
    typerCard.classList.add("typing-active");

    // 計算並更新主唱音量（隨文字字數多寡變大）
    updateVocalVolume();

    // 當整篇散文謄寫完畢時：自動觸發 PDF 下載並收起介面
    if (currentTextIndex >= fullTextLength && !isPdfDownloaded) {
      isPdfDownloaded = true;

      // 停止自動漫遊計時器
      if (autoTypeInterval) {
        clearInterval(autoTypeInterval);
        autoTypeInterval = null;
        autoTypeBtn.innerHTML = `<span>✨</span> 自動漫遊`;
      }

      // 1. 自動觸發 PDF 檔案下載 (作者：白櫻蒼成)
      exportPdfDocument();

      // 2. 稍作停留後自動將打字視窗收起至界面底部，讓觀眾專注看畫面與聽音樂
      setTimeout(() => {
        collapseTyperInterface();
      }, 1600);
    }
  }

  /**
   * 退回文字 (Backspace)
   */
  function retreatText(stride = 2) {
    if (currentTextIndex <= 0) return;
    currentTextIndex = Math.max(0, currentTextIndex - stride);

    const sub = NOCTURNE_ROMANCE_TEXT.slice(0, currentTextIndex);
    typedContent.innerHTML = sub.replace(/\n\n/g, "<br><br>").replace(/\n/g, "<br>");

    charCountElem.textContent = `${currentTextIndex} / ${fullTextLength} 字`;
    lastTypeTime = Date.now();

    // 依據指示「不用變小」，退格時歌聲音量不回落
    updateVocalVolume();

    if (currentTextIndex === 0) {
      typerGuide.classList.remove("hidden");
    }
  }

  /**
   * 根據文字累積量計算主唱目標音量 (人耳響度增益感知曲線)
   * 依據使用者指示：
   * 1. 伴奏為無日浪漫 (Without Lead Vocal).mp3 正常循環
   * 2. 變大聲的是無日浪漫 (Lead Vocal).mp3，隨文字字數多寡漸漸變大
   * 3. 並且「不用變小」，維持歌聲陪伴不縮小
   * 4. 採用感知非線性曲線，打字一開始即有明確人聲疊加 (0.32+)，隨後逐步飽和至 1.0
   */
  function updateVocalVolume() {
    if (currentTextIndex <= 0) {
      window.multiTrackAudio.setLeadVocalVolume(0.0);
      return;
    }

    // 線性打字進度 (0.0 ~ 1.0)
    const linearRatio = Math.min(1.0, currentTextIndex / VOCAL_SATURATION_CHARS);

    // 人耳感知響度映射 (保證鍵盤敲擊瞬間即可清晰聽見主唱層疊加)
    const perceptualVolume = 0.32 + 0.68 * Math.pow(linearRatio, 0.65);

    // 送交多軌音訊引擎（維持單調遞增高水位，不隨打字停頓縮小）
    window.multiTrackAudio.setLeadVocalVolume(perceptualVolume);
  }

  // 監聽音訊引擎主唱音量實時回報，更新 UI 指示儀 (GPU 硬體著色器加速)
  window.multiTrackAudio.onLeadVolumeChange = (vol) => {
    const percent = Math.round(vol * 100);
    vocalsPercentText.textContent = `${percent}%`;

    if (percent > 6) {
      vocalsCard.classList.add("awake");
    } else {
      vocalsCard.classList.remove("awake");
    }

    // 波形跳動動畫模擬 (使用 scaleY 避免觸發 DOM 幾何重排)
    const scale = (percent / 100);
    waveBars.forEach((bar, idx) => {
      const wave = Math.sin(Date.now() * 0.008 + idx * 0.8) * 0.5 + 0.5;
      const val = Math.max(0.2, Math.min(1.2, 0.2 + 1.0 * scale * wave));
      bar.style.transform = `scaleY(${val.toFixed(3)})`;
    });
  };

  // 監聽主時脈播放進度更新
  window.multiTrackAudio.onProgressUpdate = (ratio, cur, dur) => {
    progressFill.style.width = `${ratio * 100}%`;
    progressTime.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;
  };

  // 定時檢測打字活躍狀態 (僅用於視窗光標呼吸特效，不衰減音量)
  setInterval(() => {
    if (Date.now() - lastTypeTime > 800) {
      typerCard.classList.remove("typing-active");
    }
  }, 200);

  // 鍵盤輸入事件監聽 (全域捕捉)
  window.addEventListener("keydown", (e) => {
    // 忽略特定系統功能鍵
    if (["Control", "Alt", "Meta", "Shift", "CapsLock", "Tab", "Escape", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"].includes(e.key)) {
      return;
    }

    // 若打字視窗目前處於收起狀態，敲擊鍵盤時自動展開
    if (isTyperCollapsed) {
      expandTyperInterface();
    }

    if (e.key === "Backspace") {
      e.preventDefault();
      retreatText(2);
      return;
    }

    // 任敲一鍵，輸出 1~3 個字
    e.preventDefault();
    const stride = e.code === "Space" ? 3 : 2;
    advanceText(stride);
  });

  // 觸控與點擊推進變數 (Tap-to-Type 行動端心流支援)
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let isTouching = false;

  // 監聽打字卡片觸控開始
  typerCard.addEventListener("touchstart", (e) => {
    if (e.touches.length > 0) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      isTouching = true;
    }
  }, { passive: true });

  // 監聽打字卡片觸控結束（區分輕觸 Tap 與捲動滑動 Scroll）
  typerCard.addEventListener("touchend", (e) => {
    if (!isTouching) return;
    isTouching = false;

    const duration = Date.now() - touchStartTime;

    // 若有 changedTouches，計算位移
    if (e.changedTouches && e.changedTouches.length > 0) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const moveDistance = Math.hypot(endX - touchStartX, endY - touchStartY);

      // 位移小於 14px 且時間小於 350ms，視為輕觸 Tap 推進文字
      if (moveDistance < 14 && duration < 350) {
        if (isTyperCollapsed) {
          expandTyperInterface();
        }

        // 觸控微震動 (若裝置支援)
        if (navigator.vibrate) {
          try { navigator.vibrate(10); } catch (err) {}
        }

        advanceText(2);
      }
    }
  }, { passive: true });

  // 支援手機軟體虛擬鍵盤與中文注音/拼音輸入法
  if (hiddenCatcher) {
    hiddenCatcher.addEventListener("input", (e) => {
      if (e.inputType === "deleteContentBackward") {
        retreatText(2);
      } else {
        advanceText(2);
      }
      hiddenCatcher.value = "";
    });

    hiddenCatcher.addEventListener("compositionend", () => {
      advanceText(2);
      hiddenCatcher.value = "";
    });
  }

  // 點擊打字視窗時，確保獲取焦點
  typerCard.addEventListener("click", () => {
    if (isTyperCollapsed) {
      expandTyperInterface();
    }
    hiddenCatcher.focus();
  });

  // 初次解鎖按鈕：點擊「進入無日浪漫」
  startBtn.addEventListener("click", async () => {
    startBtn.disabled = true;
    startBtn.textContent = "音軌載入同步中...";

    // 啟動多軌音訊引擎
    await window.multiTrackAudio.play();

    // 播放背景影片
    if (bgVideo) {
      bgVideo.play().catch((e) => console.warn("影片自動播放提示:", e));
    }

    // 淡出引導遮罩
    welcomeOverlay.classList.add("hidden");
    hiddenCatcher.focus();
  });

  // 底部按鈕：播放 / 暫停
  playPauseBtn.addEventListener("click", () => {
    window.multiTrackAudio.togglePlay();
    if (window.multiTrackAudio.isPlaying) {
      playPauseBtn.innerHTML = `<span>⏸</span> 暫停`;
      if (bgVideo) bgVideo.play().catch(() => {});
    } else {
      playPauseBtn.innerHTML = `<span>▶</span> 播放`;
      if (bgVideo) bgVideo.pause();
    }
  });

  // 底部按鈕：收起 / 展開打字視窗
  if (toggleTyperBtn) {
    toggleTyperBtn.addEventListener("click", () => {
      toggleTyperInterface();
    });
  }

  // 底部按鈕：手動下載 PDF 手稿
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener("click", () => {
      exportPdfDocument();
    });
  }

  // 底部按鈕：自動演奏 (Auto-Type 演示)
  autoTypeBtn.addEventListener("click", () => {
    if (autoTypeInterval) {
      clearInterval(autoTypeInterval);
      autoTypeInterval = null;
      autoTypeBtn.innerHTML = `<span>✨</span> 自動漫遊`;
    } else {
      // 若視窗收起，自動展開
      if (isTyperCollapsed) {
        expandTyperInterface();
      }
      autoTypeBtn.innerHTML = `<span>⏹</span> 停止漫遊`;
      autoTypeInterval = setInterval(() => {
        advanceText(2);
        if (currentTextIndex >= fullTextLength) {
          clearInterval(autoTypeInterval);
          autoTypeInterval = null;
          autoTypeBtn.innerHTML = `<span>✨</span> 自動漫遊`;
        }
      }, 140);
    }
  });

  // 底部按鈕：重置文字
  resetBtn.addEventListener("click", () => {
    if (autoTypeInterval) {
      clearInterval(autoTypeInterval);
      autoTypeInterval = null;
      autoTypeBtn.innerHTML = `<span>✨</span> 自動漫遊`;
    }
    currentTextIndex = 0;
    typedContent.innerHTML = "";
    typerGuide.classList.remove("hidden");
    charCountElem.textContent = `0 / ${fullTextLength} 字`;
    isPdfDownloaded = false;

    // 展開視窗
    expandTyperInterface();

    // 重置主唱歌聲回歸靜音
    window.multiTrackAudio.resetLeadVocalVolume();

    showToast(`<span>🔄</span> 已重置散文與歌聲狀態`, 2500);
  });

  // 底部按鈕：全螢幕切換
  fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("無法切換全螢幕:", err);
      });
      fullscreenBtn.innerHTML = `<span>🔲</span> 退出全螢幕`;
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        fullscreenBtn.innerHTML = `<span>⛶</span> 全螢幕`;
      }
    }
  });

  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      fullscreenBtn.innerHTML = `<span>⛶</span> 全螢幕`;
    }
  });
});
