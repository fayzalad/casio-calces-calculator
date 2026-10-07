import { store } from '../state/store';
import { FRAC_OPEN, FRAC_SEP, FRAC_CLOSE } from '../math/templates';

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
        <span class="flag ${store.hypPending ? 'active' : ''}">hyp</span>
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

    if (expr.length === 0) {
      this.exprContainer.innerHTML = `<span class="cursor"></span>`;
      return;
    }

    this.exprContainer.innerHTML = this.drawExpression(expr, store.cursorPos);

    // Auto-scroll to keep the end in view
    this.exprContainer.scrollLeft = this.exprContainer.scrollWidth;
  }

  /**
   * Draws the expression, turning ⟨num¦den⟩ markers into stacked fractions.
   * The cursor is placed at index `pos` of the raw string, wherever it sits (even inside a fraction).
   */
  private drawExpression(expr: string, pos: number): string {
    const CURSOR = '\u0000';
    const marked = expr.slice(0, pos) + CURSOR + expr.slice(pos);
    let i = 0;

    const text = (chunk: string) =>
      this.escape(chunk)
        .replace(/\*/g, '×')
        .replace(/\//g, '÷')
        .replace(/\^2/g, '²')
        .replace(/\^3/g, '³')
        .replace(/ᴇ(-?\d*)/g, '×10<sup class="exp">$1</sup>');

    // Reads characters until one of `stops` (not consumed) and returns the HTML for them.
    const sequence = (stops: string): { html: string; empty: boolean } => {
      let html = '';
      let run = '';
      let empty = true;
      const flush = () => {
        if (run) html += `<span class="expr-text">${text(run)}</span>`;
        run = '';
      };
      while (i < marked.length && !stops.includes(marked[i])) {
        const ch = marked[i];
        if (ch === CURSOR) {
          flush();
          html += '<span class="cursor"></span>';
          i++;
        } else if (ch === FRAC_OPEN) {
          flush();
          i++;
          const num = sequence(FRAC_SEP + FRAC_CLOSE);
          if (marked[i] === FRAC_SEP) i++;
          const den = sequence(FRAC_CLOSE);
          if (marked[i] === FRAC_CLOSE) i++;
          const box = '<span class="tbox"></span>';
          html +=
            '<span class="tfrac">' +
            `<span class="tnum">${num.empty ? num.html + box : num.html}</span>` +
            `<span class="tden">${den.empty ? den.html + box : den.html}</span>` +
            '</span>';
          empty = false;
        } else {
          run += ch;
          empty = false;
          i++;
        }
      }
      flush();
      return { html, empty };
    };

    // A stray close marker (shouldn't happen) is skipped rather than looping forever
    let out = '';
    while (i < marked.length) {
      out += sequence('').html;
      if (i < marked.length) i++;
    }
    return out;
  }

  private renderResult(): void {
    const activeResult = store.getActiveResult();
    if (!activeResult) {
      this.resultContainer.innerHTML = '';
      return;
    }

    // Format fractions vertically if applicable
    if (activeResult.includes('/') && !/ERROR/.test(activeResult)) {
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

    // 1.5 × 10^-3 shows the exponent raised, like the real display
    this.resultContainer.innerHTML = this.escape(activeResult).replace(
      /× 10\^(-?\d+)/,
      '×10<sup class="exp">$1</sup>'
    );
  }

  private escape(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
