/**
 * High-performance 2D Canvas Function Grapher
 */

export class GraphPlotter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private f: ((x: number) => number) | null = null;

  public xMin: number = -10;
  public xMax: number = 10;
  public yMin: number = -10;
  public yMax: number = 10;

  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');
    this.ctx = context;

    this.setupEvents();
  }

  setFunction(fn: (x: number) => number): void {
    this.f = fn;
    this.render();
  }

  resize(width: number, height: number): void {
    void width; void height;
    this.render();
  }

  private setupEvents(): void {
    // Mouse events
    this.canvas.addEventListener('mousedown', e => {
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
    });

    window.addEventListener('mousemove', e => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;

      const rect = this.canvas.getBoundingClientRect();
      const xRange = this.xMax - this.xMin;
      const yRange = this.yMax - this.yMin;

      const deltaX = (dx / rect.width) * xRange;
      const deltaY = (dy / rect.height) * yRange;

      this.xMin -= deltaX;
      this.xMax -= deltaX;
      this.yMin += deltaY;
      this.yMax += deltaY;

      this.render();
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Zoom on wheel
    this.canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 0.85 : 1.15;
      this.zoom(zoomFactor);
    });

    // Touch events for mobile pinch-to-zoom and drag
    let initialTouchDist = 0;
    this.canvas.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.dragStartX = e.touches[0].clientX;
        this.dragStartY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        initialTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    });

    this.canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      if (e.touches.length === 1 && this.isDragging) {
        const dx = e.touches[0].clientX - this.dragStartX;
        const dy = e.touches[0].clientY - this.dragStartY;
        this.dragStartX = e.touches[0].clientX;
        this.dragStartY = e.touches[0].clientY;

        const rect = this.canvas.getBoundingClientRect();
        const xRange = this.xMax - this.xMin;
        const yRange = this.yMax - this.yMin;

        this.xMin -= (dx / rect.width) * xRange;
        this.xMax -= (dx / rect.width) * xRange;
        this.yMin += (dy / rect.height) * yRange;
        this.yMax += (dy / rect.height) * yRange;

        this.render();
      } else if (e.touches.length === 2) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (initialTouchDist > 0) {
          const factor = initialTouchDist / currentDist;
          this.zoom(Math.min(1.1, Math.max(0.9, factor)));
          initialTouchDist = currentDist;
        }
      }
    });

    this.canvas.addEventListener('touchend', () => {
      this.isDragging = false;
      initialTouchDist = 0;
    });
  }

  zoom(factor: number): void {
    const xCenter = (this.xMin + this.xMax) / 2;
    const yCenter = (this.yMin + this.yMax) / 2;
    const xHalf = ((this.xMax - this.xMin) * factor) / 2;
    const yHalf = ((this.yMax - this.yMin) * factor) / 2;

    this.xMin = xCenter - xHalf;
    this.xMax = xCenter + xHalf;
    this.yMin = yCenter - yHalf;
    this.yMax = yCenter + yHalf;

    this.render();
  }

  resetView(): void {
    this.xMin = -10;
    this.xMax = 10;
    this.yMin = -10;
    this.yMax = 10;
    this.render();
  }

  /** Match the canvas bitmap to its on-screen size (it is hidden, and so 0×0, until the panel opens). */
  private fit(): { width: number; height: number } {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width: rect.width, height: rect.height };
  }

  private colors() {
    const light = document.documentElement.getAttribute('data-theme') === 'casio-classic';
    return light
      ? { grid: '#d5d9d0', axis: '#2563eb', curve: '#15803d', text: '#4b5563' }
      : { grid: '#2d333b', axis: '#58a6ff', curve: '#3fb950', text: '#9ca3af' };
  }

  /** A 1/2/5 × 10ⁿ step giving roughly eight grid lines across the range. */
  private niceStep(range: number): number {
    const raw = range / 8;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / pow;
    return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * pow;
  }

  render(): void {
    const { width, height } = this.fit();
    if (width < 2 || height < 2) return;
    const col = this.colors();
    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);

    const toScreenX = (x: number) => ((x - this.xMin) / (this.xMax - this.xMin)) * width;
    const toScreenY = (y: number) => height - ((y - this.yMin) / (this.yMax - this.yMin)) * height;
    const label = (v: number) => String(Number(v.toPrecision(6)));

    ctx.font = '10px sans-serif';
    ctx.fillStyle = col.text;
    ctx.strokeStyle = col.grid;
    ctx.lineWidth = 1;

    const xStep = this.niceStep(this.xMax - this.xMin);
    const yStep = this.niceStep(this.yMax - this.yMin);
    const originX = Math.min(Math.max(toScreenX(0), 0), width);
    const originY = Math.min(Math.max(toScreenY(0), 0), height);

    for (let x = Math.ceil(this.xMin / xStep) * xStep; x <= this.xMax; x += xStep) {
      const sx = toScreenX(x);
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, height); ctx.stroke();
      if (Math.abs(x) > xStep / 2) ctx.fillText(label(x), sx + 2, Math.min(originY + 11, height - 2));
    }
    for (let y = Math.ceil(this.yMin / yStep) * yStep; y <= this.yMax; y += yStep) {
      const sy = toScreenY(y);
      ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(width, sy); ctx.stroke();
      if (Math.abs(y) > yStep / 2) ctx.fillText(label(y), Math.min(originX + 3, width - 30), sy - 2);
    }

    ctx.strokeStyle = col.axis;
    ctx.lineWidth = 2;
    if (toScreenY(0) >= 0 && toScreenY(0) <= height) {
      ctx.beginPath(); ctx.moveTo(0, toScreenY(0)); ctx.lineTo(width, toScreenY(0)); ctx.stroke();
    }
    if (toScreenX(0) >= 0 && toScreenX(0) <= width) {
      ctx.beginPath(); ctx.moveTo(toScreenX(0), 0); ctx.lineTo(toScreenX(0), height); ctx.stroke();
    }

    if (!this.f) return;
    ctx.strokeStyle = col.curve;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    let started = false;
    let prevY = 0;
    const steps = Math.ceil(width * 2);
    for (let i = 0; i <= steps; i++) {
      const sx = (i / steps) * width;
      const x = this.xMin + (i / steps) * (this.xMax - this.xMin);
      let sy = NaN;
      try {
        const y = this.f(x);
        if (Number.isFinite(y)) sy = toScreenY(y);
      } catch {
        // outside the domain (ln of a negative, ÷0...): leave a gap
      }
      if (!Number.isFinite(sy) || Math.abs(sy) > height * 50) { started = false; continue; }
      // a huge jump between neighbours is an asymptote (tan x), not a line to draw
      if (started && Math.abs(sy - prevY) > height * 1.5) started = false;
      if (!started) { ctx.moveTo(sx, sy); started = true; } else ctx.lineTo(sx, sy);
      prevY = sy;
    }
    ctx.stroke();
  }
}
