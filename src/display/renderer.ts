import { store } from '../state/store';

export class DisplayRenderer {
  private statusContainer: HTMLElement;
  private exprContainer: HTMLElement;
  private resultContainer: HTMLElement;

  constructor(
    statusContainer: HTMLElement,
    exprContainer: HTMLElement,
    resultContainer: HTMLElement
  ) {
    this.statusContainer = statusContainer;
    this.exprContainer = exprContainer;
    this.resultContainer = resultContainer;

    store.subscribe(() => this.render());
    this.render();
  }

  render(): void {
    this.renderStatus();
    this.renderExpression();
    this.renderResult();
  }

  private renderStatus(): void {
    const isShift = store.modifier === 'SHIFT';
    const isAlpha = store.modifier === 'ALPHA';
    const hasMemory = store.variables.M !== 0;
    const angle = store.settings.angleUnit;
    const mode = store.mode;
    const hasHistory = store.history.length > 0;

    this.statusContainer.innerHTML = `
      <div class="lcd-flags">
        <span class="flag ${isShift ? 'active' : ''}">S</span>
        <span class="flag ${isAlpha ? 'active' : ''}">A</span>
        <span class="flag ${hasMemory ? 'active' : ''}">M</span>
        <span class="flag ${mode === 'CMPLX' ? 'active' : ''}">CMPLX</span>
        <span class="flag ${mode === 'STAT' ? 'active' : ''}">STAT</span>
        <span class="flag ${mode === 'MATRIX' ? 'active' : ''}">MAT</span>
        <span class="flag ${mode === 'VECTOR' ? 'active' : ''}">VCT</span>
        <span class="flag ${mode === 'BASE_N' ? 'active' : ''}">${store.baseNMode}</span>
        <span class="flag ${angle === 'DEG' ? 'active' : ''}">D</span>
        <span class="flag ${angle === 'RAD' ? 'active' : ''}">R</span>
        <span class="flag ${angle === 'GRA' ? 'active' : ''}">G</span>
        <span class="flag active">Math</span>
        <span class="flag ${hasHistory ? 'active' : ''}">▼▲</span>
      </div>
    `;
  }

  private renderExpression(): void {
    const expr = store.expression;
    const pos = store.cursorPos;

    if (expr.length === 0) {
      this.exprContainer.innerHTML = `<span class="cursor"></span>`;
      return;
    }

    // Format special characters for textbook display
    const formatted = expr
      .replace(/\*/g, '×')
      .replace(/\//g, '÷')
      .replace(/\^2/g, '²')
      .replace(/\^3/g, '³');

    const beforeCursor = formatted.slice(0, pos);
    const afterCursor = formatted.slice(pos);

    this.exprContainer.innerHTML = `
      <span class="expr-text">${beforeCursor}</span><span class="cursor"></span><span class="expr-text">${afterCursor}</span>
    `;

    // Auto-scroll to keep cursor visible
    this.exprContainer.scrollLeft = this.exprContainer.scrollWidth;
  }

  private renderResult(): void {
    const activeResult = store.getActiveResult();
    if (!activeResult) {
      this.resultContainer.innerHTML = '';
      return;
    }

    // Format fractions vertically if applicable
    if (activeResult.includes('/') && !activeResult.includes('⌟')) {
      const parts = activeResult.split('/');
      if (parts.length === 2) {
        this.resultContainer.innerHTML = `
          <div class="fraction-display">
            <span class="num">${parts[0]}</span>
            <span class="bar"></span>
            <span class="den">${parts[1]}</span>
          </div>
        `;
        return;
      }
    }

    this.resultContainer.textContent = activeResult;
  }
}
