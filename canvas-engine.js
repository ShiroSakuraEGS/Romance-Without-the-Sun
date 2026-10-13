/**
 * 魔法符文全螢幕畫布與複雜度分析引擎 (Magic Rune Canvas & Complexity Engine)
 * 
 * 功能：
 * 1. 全螢幕 Retina 高解析度畫布渲染
 * 2. 魔法發光筆刷與平滑貝茲曲線插值
 * 3. 伴隨筆觸噴灑的魔法星塵粒子系統 (Particle Trail)
 * 4. 幾何空間複雜度實時計算 (筆劃長度、空間覆蓋率、分布密度、繪製動量)
 * 5. 符文消散清空特效與自動展示模式 (Demo Sacred Geometry)
 */

class RuneCanvasEngine {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext("2d");

    // 繪畫狀態
    this.isDrawing = false;
    this.lastPoint = null;
    this.strokes = [];       // 所有已完成的筆劃歷史
    this.currentStroke = []; // 當前正在繪製的筆劃點位

    // 魔法粒子群
    this.particles = [];

    // 當前筆刷配色主題 (金珀、秘銀、翡翠、深淵)
    this.colorThemes = {
      gold: {
        glow: "rgba(245, 215, 127, 0.65)",
        core: "#ffffff",
        particle: ["#f5d77f", "#ffeaa7", "#e6c670", "#ffffff"]
      },
      mithril: {
        glow: "rgba(100, 210, 255, 0.65)",
        core: "#ffffff",
        particle: ["#64d2ff", "#a0e6ff", "#00a8ff", "#ffffff"]
      },
      emerald: {
        glow: "rgba(80, 227, 164, 0.65)",
        core: "#ffffff",
        particle: ["#50e3a4", "#a8ffdb", "#2ed573", "#ffffff"]
      },
      arcane: {
        glow: "rgba(191, 122, 240, 0.65)",
        core: "#ffffff",
        particle: ["#bf7af0", "#dfb2f7", "#9b59b6", "#ffffff"]
      }
    };
    this.activeTheme = "gold";

    // 複雜度數值與動態平滑 (0.0 ~ 1.0)
    this.currentComplexity = 0.0;
    this.targetComplexity = 0.0;
    this.drawingMomentum = 0.0; // 繪畫瞬間動能加成

    // 統計指標
    this.stats = {
      totalLength: 0,
      strokeCount: 0,
      coverageRatio: 0,
      minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity
    };

    // 事件回呼
    this.onComplexityUpdate = null;

    // 初始化視窗自適應與事件監聽
    this._initCanvasSize();
    this._bindEvents();

    // 啟動主繪製迴圈 (60 FPS)
    this._startLoop();
  }

  /**
   * 初始化與螢幕解析度自適應
   */
  _initCanvasSize() {
    this.dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(this.dpr, this.dpr);

    window.addEventListener("resize", () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width * this.dpr;
      this.canvas.height = this.height * this.dpr;
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.ctx.scale(this.dpr, this.dpr);
      this._redrawAllStrokes();
    });
  }

  /**
   * 切換筆刷色彩主題
   */
  setTheme(themeKey) {
    if (this.colorThemes[themeKey]) {
      this.activeTheme = themeKey;
    }
  }

  /**
   * 綁定滑鼠與觸控繪畫事件
   */
  _bindEvents() {
    // 滑鼠事件
    this.canvas.addEventListener("mousedown", (e) => this._onPointerDown(e.clientX, e.clientY));
    window.addEventListener("mousemove", (e) => this._onPointerMove(e.clientX, e.clientY));
    window.addEventListener("mouseup", () => this._onPointerUp());

    // 觸控觸控板事件 (支援行動裝置與觸控螢幕)
    this.canvas.addEventListener("touchstart", (e) => {
      if (e.touches.length > 0) {
        this._onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
      if (e.touches.length > 0 && this.isDrawing) {
        this._onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener("touchend", () => this._onPointerUp());
  }

  _onPointerDown(x, y) {
    this.isDrawing = true;
    this.lastPoint = { x, y };
    this.currentStroke = [{ x, y }];
    this.drawingMomentum = Math.min(1.0, this.drawingMomentum + 0.15);

    // 點擊處爆發微量星塵
    this._spawnParticles(x, y, 12, 2.5);
  }

  _onPointerMove(x, y) {
    if (!this.isDrawing) return;

    const pt = { x, y };
    this.currentStroke.push(pt);

    // 計算移動距離
    const dist = Math.hypot(x - this.lastPoint.x, y - this.lastPoint.y);
    this.stats.totalLength += dist;

    // 更新包圍盒
    this.stats.minX = Math.min(this.stats.minX, x);
    this.stats.maxX = Math.max(this.stats.maxX, x);
    this.stats.minY = Math.min(this.stats.minY, y);
    this.stats.maxY = Math.max(this.stats.maxY, y);

    // 繪畫動量加成 (速度越快、動能越高)
    this.drawingMomentum = Math.min(1.0, this.drawingMomentum + dist * 0.003);

    // 噴灑魔法星塵粒子
    this._spawnParticles(x, y, Math.min(6, Math.max(2, Math.floor(dist / 8))), 1.5);

    this.lastPoint = pt;

    // 立即重新計算複雜度
    this._calculateComplexity();
  }

  _onPointerUp() {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    if (this.currentStroke.length > 1) {
      this.strokes.push({
        points: [...this.currentStroke],
        theme: this.activeTheme
      });
      this.stats.strokeCount++;
    }
    this.currentStroke = [];
    this.lastPoint = null;

    this._calculateComplexity();
  }

  /**
   * 生成魔法星塵粒子
   */
  _spawnParticles(x, y, count, speedMultiplier = 1) {
    const theme = this.colorThemes[this.activeTheme];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 2.5 + 0.8) * speedMultiplier;
      const palette = theme.particle;
      const color = palette[Math.floor(Math.random() * palette.length)];

      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.4, // 微弱向上浮力
        size: Math.random() * 3.5 + 1.2,
        color: color,
        alpha: 1.0,
        decay: Math.random() * 0.025 + 0.015
      });
    }
  }

  /**
   * 圖案空間與幾何複雜度核心演算法
   */
  _calculateComplexity() {
    if (this.stats.strokeCount === 0 && this.currentStroke.length < 2) {
      this.targetComplexity = 0.0;
      return;
    }

    // 指標 1: 筆劃長度評分 (0 ~ 3000px 對應 0 ~ 0.4)
    const lengthScore = Math.min(0.4, (this.stats.totalLength / 3200) * 0.4);

    // 指標 2: 筆劃數量評分 (0 ~ 12 劃對應 0 ~ 0.25)
    const totalStrokes = this.stats.strokeCount + (this.isDrawing ? 1 : 0);
    const strokeScore = Math.min(0.25, (totalStrokes / 12) * 0.25);

    // 指標 3: 空間分布廣度評分 (包圍盒面積比率，0 ~ 0.25)
    let coverageScore = 0;
    if (this.stats.maxX > this.stats.minX && this.stats.maxY > this.stats.minY) {
      const bboxWidth = this.stats.maxX - this.stats.minX;
      const bboxHeight = this.stats.maxY - this.stats.minY;
      const bboxArea = bboxWidth * bboxHeight;
      const screenArea = this.width * this.height;
      coverageScore = Math.min(0.25, (bboxArea / (screenArea * 0.45)) * 0.25);
    }

    // 指標 4: 當前繪畫動能加成 (0 ~ 0.1)
    const momentumScore = this.drawingMomentum * 0.1;

    // 綜合累計分數 (最高 1.0)
    let rawScore = lengthScore + strokeScore + coverageScore + momentumScore;
    this.targetComplexity = Math.max(0.0, Math.min(1.0, rawScore));
  }

  /**
   * 清空所有畫布內容 (帶有魔法消散動畫)
   */
  clearCanvas() {
    // 將所有筆劃點位轉化為爆發的星塵粒子
    for (const stroke of this.strokes) {
      for (let i = 0; i < stroke.points.length; i += 3) {
        const pt = stroke.points[i];
        this._spawnParticles(pt.x, pt.y, 2, 2.0);
      }
    }

    this.strokes = [];
    this.currentStroke = [];
    this.stats = {
      totalLength: 0,
      strokeCount: 0,
      coverageRatio: 0,
      minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity
    };
    this.targetComplexity = 0.0;
    this.drawingMomentum = 0.0;
  }

  /**
   * 自動繪製中世紀魔法幾何陣展示 (Auto Sacred Rune Demo)
   */
  runDemoAnimation(onComplete) {
    this.clearCanvas();
    const cx = this.width / 2;
    const cy = this.height / 2;
    const radius = Math.min(this.width, this.height) * 0.28;

    // 產生五芒星與雙同心圓路徑序列
    const pointsList = [];

    // 外圓
    const circlePoints = [];
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.1) {
      circlePoints.push({ x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius });
    }
    pointsList.push({ pts: circlePoints, theme: "gold" });

    // 內圓
    const innerRadius = radius * 0.65;
    const innerCircle = [];
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.12) {
      innerCircle.push({ x: cx + Math.cos(-a) * innerRadius, y: cy + Math.sin(-a) * innerRadius });
    }
    pointsList.push({ pts: innerCircle, theme: "mithril" });

    // 五角芒星
    const starPoints = [];
    for (let i = 0; i <= 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      starPoints.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
    }
    pointsList.push({ pts: starPoints, theme: "arcane" });

    let strokeIdx = 0;
    let ptIdx = 0;

    const stepDemo = () => {
      if (strokeIdx >= pointsList.length) {
        if (onComplete) onComplete();
        return;
      }

      const currentPath = pointsList[strokeIdx];
      this.activeTheme = currentPath.theme;

      if (ptIdx === 0) {
        this._onPointerDown(currentPath.pts[0].x, currentPath.pts[0].y);
      }

      ptIdx++;
      if (ptIdx < currentPath.pts.length) {
        const nextPt = currentPath.pts[ptIdx];
        this._onPointerMove(nextPt.x, nextPt.y);
        requestAnimationFrame(stepDemo);
      } else {
        this._onPointerUp();
        strokeIdx++;
        ptIdx = 0;
        setTimeout(stepDemo, 120);
      }
    };

    stepDemo();
  }

  /**
   * 繪製單個筆劃 (帶有平滑貝茲曲線與雙層發光)
   */
  _drawStroke(points, themeKey) {
    if (points.length < 2) return;

    const theme = this.colorThemes[themeKey] || this.colorThemes.gold;
    const ctx = this.ctx;

    // 第 1 遍：外層柔和發光光暈
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const xc = (points[i].x + points[i - 1].x) / 2;
      const yc = (points[i].y + points[i - 1].y) / 2;
      ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
    }
    ctx.strokeStyle = theme.glow;
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = 24;
    ctx.stroke();
    ctx.restore();

    // 第 2 遍：核心亮金/亮白符文筆觸
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const xc = (points[i].x + points[i - 1].x) / 2;
      const yc = (points[i].y + points[i - 1].y) / 2;
      ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
    }
    ctx.strokeStyle = theme.core;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();
  }

  /**
   * 主渲染迴圈
   */
  _startLoop() {
    const loop = () => {
      // 清空背景畫布
      this.ctx.clearRect(0, 0, this.width, this.height);

      // 繪製歷史已完成筆劃
      for (const stroke of this.strokes) {
        this._drawStroke(stroke.points, stroke.theme);
      }

      // 繪製當前正在畫的筆劃
      if (this.currentStroke.length > 1) {
        this._drawStroke(this.currentStroke, this.activeTheme);
      }

      // 更新並繪製魔法星塵粒子
      this._updateAndDrawParticles();

      // 平滑衰減繪畫動能
      this.drawingMomentum *= 0.985;

      // 複雜度線性平滑插值 (Lerp)，營造呼吸與漸進感
      const lerpFactor = this.isDrawing ? 0.08 : 0.03;
      this.currentComplexity += (this.targetComplexity - this.currentComplexity) * lerpFactor;

      if (this.onComplexityUpdate) {
        this.onComplexityUpdate(this.currentComplexity);
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  /**
   * 粒子更新與渲染
   */
  _updateAndDrawParticles() {
    const ctx = this.ctx;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _redrawAllStrokes() {
    // 視窗 resize 後重繪
  }
}
