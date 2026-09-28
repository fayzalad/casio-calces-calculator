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
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(dpr, dpr);
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

  render(): void {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);

    // Coordinate conversions
    const toScreenX = (x: number) => ((x - this.xMin) / (this.xMax - this.xMin)) * width;
    const toScreenY = (y: number) => height - ((y - this.yMin) / (this.yMax - this.yMin)) * height;

    // Draw Grid Lines
    ctx.strokeStyle = '#2d333b';
    ctx.lineWidth = 1;

    const xRange = this.xMax - this.xMin;
    const xStep = Math.pow(10, Math.floor(Math.log10(xRange))) / 2;

    const startX = Math.floor(this.xMin / xStep) * xStep;
    for (let x = startX; x <= this.xMax; x += xStep) {
      const sx = toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();
    }

    const yRange = this.yMax - this.yMin;
    const yStep = Math.pow(10, Math.floor(Math.log10(yRange))) / 2;

    const startY = Math.floor(this.yMin / yStep) * yStep;
    for (let y = startY; y <= this.yMax; y += yStep) {
      const sy = toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();
    }

    // Draw Axes
    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 2;

    const originX = toScreenX(0);
    const originY = toScreenY(0);

    // X Axis
    if (originY >= 0 && originY <= height) {
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(width, originY);
      ctx.stroke();
    }

    // Y Axis
    if (originX >= 0 && originX <= width) {
      ctx.beginPath();
      ctx.moveTo(originX, 0);
      ctx.lineTo(originX, height);
      ctx.stroke();
    }

    // Draw Function Curve
    if (this.f) {
      ctx.strokeStyle = '#3fb950';
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      let started = false;
      const steps = width * 2;
      for (let i = 0; i <= steps; i++) {
        const sx = (i / steps) * width;
        const x = this.xMin + (i / steps) * (this.xMax - this.xMin);

        try {
          const y = this.f(x);
          if (Number.isFinite(y)) {
            const sy = toScreenY(y);
            if (!started) {
              ctx.moveTo(sx, sy);
              started = true;
            } else {
              ctx.lineTo(sx, sy);
            }
          } else {
            started = false;
          }
        } catch {
          started = false;
        }
      }

      ctx.stroke();
    }
  }
}
