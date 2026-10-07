import {
  CalculatorMode,
  AngleUnit,
  KeyModifier,
  UITheme,
  CalculationHistoryItem,
  VariableStore,
  CalculatorSettings,
  BaseNMode
} from '../types/calculator';
import { Evaluator } from '../math/evaluator';
import { Complex } from '../math/complex';
import { Fraction } from '../math/fraction';
import { Surd } from '../math/surd';
import {
  FRAC_OPEN, FRAC_SEP, FRAC_CLOSE, enclosingOpen, matchingClose, separatorOf
} from '../math/templates';

/** The operand a fraction key grabs as its numerator: a number, Ans, a variable or pi. */
const NUMERATOR = /(?:(?:\d+\.?\d*|\.\d+)(?:ᴇ-?\d+)?|PreAns|Ans|[A-FXYM]|π)$/;

/** Things the cursor and DEL treat as a single unit, like a key on the real calculator. */
const TOKEN_BEFORE = /(?:PreAns|Ans|Infinity|[a-z]+\(|nPr|nCr|mod|ᴇ)$/;
const TOKEN_AFTER = /^(?:PreAns|Ans|Infinity|[a-z]+\(|nPr|nCr|mod|ᴇ)/;

/** Keys that continue from the last answer when pressed straight after "=". */
const CONTINUES_FROM_ANS = /^\s*(?:[+\-×÷*/^!%]|ᴇ|nPr|nCr|mod)/;

type Listener = () => void;

class CalculatorStore {
  public expression: string = '';
  public cursorPos: number = 0;
  public resultExact: string = '';
  public resultDecimal: string = '';
  public activeResultFormat: 'EXACT' | 'DECIMAL' | 'MIXED' = 'EXACT';

  /** True right after "=": the next digit starts a new entry, the next operator continues from Ans. */
  public justEvaluated: boolean = false;
  /** Which saved calculation up/down arrows are showing (-1 = none). */
  public historyIndex: number = -1;
  /** The hyp key was pressed; the next sin/cos/tan becomes sinh/cosh/tanh. */
  public hypPending: boolean = false;

  public mode: CalculatorMode = 'COMP';
  public modifier: KeyModifier = 'NORMAL';
  public baseNMode: BaseNMode = 'DEC';

  public variables: VariableStore = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
    F: 0,
    X: 0,
    Y: 0,
    M: 0,
    Ans: 0,
    PreAns: 0
  };

  public settings: CalculatorSettings = {
    angleUnit: 'DEG',
    displayFormat: 'NORM1',
    fixDigits: 2,
    fractionDisplay: 'NATURAL',
    soundEnabled: true,
    hapticsEnabled: true,
    theme: 'calces-dark', // default to CalcES Dark per user screenshot, toggleable to casio-classic
    implicitMultiplication: true,
    autoParentheses: true
  };

  public history: CalculationHistoryItem[] = [];

  // Mode specific data
  public matrices: Record<string, number[][]> = {
    MatA: [[0, 0], [0, 0]],
    MatB: [[0, 0], [0, 0]],
    MatC: [[0, 0], [0, 0]],
    MatD: [[0, 0], [0, 0]]
  };

  public vectors: Record<string, number[]> = {
    VctA: [0, 0, 0],
    VctB: [0, 0, 0],
    VctC: [0, 0, 0],
    VctD: [0, 0, 0]
  };

  public statDataX: number[] = [];
  public statDataY: number[] = [];

  public tableConfig = {
    fExpr: 'X^2 - 4',
    gExpr: '2*X',
    start: -3,
    end: 3,
    step: 1,
    rows: [] as { x: number; fx: number; gx: number }[]
  };

  private listeners: Listener[] = [];

  constructor() {
    this.loadFromStorage();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
    this.saveToStorage();
  }

  setTheme(theme: UITheme): void {
    this.settings.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    this.notify();
  }

  setAngleUnit(unit: AngleUnit): void {
    this.settings.angleUnit = unit;
    if (this.justEvaluated && this.expression.trim().length > 0) {
      this.evaluateExpression(false);
    }
    this.notify();
  }

  /** Apply NORM/FIX/SCI/ENG from SETUP and redraw the current answer. */
  setDisplayFormat(format: CalculatorSettings['displayFormat'], digits: number): void {
    this.settings.displayFormat = format;
    this.settings.fixDigits = digits;
    if (this.justEvaluated && this.expression.trim().length > 0) {
      this.evaluateExpression(false);
    }
    this.notify();
  }

  setMode(mode: CalculatorMode): void {
    this.mode = mode;
    this.modifier = 'NORMAL';
    this.notify();
  }

  setModifier(mod: KeyModifier): void {
    this.modifier = this.modifier === mod ? 'NORMAL' : mod;
    this.notify();
  }

  /**
   * Type something into the expression.
   * Straight after "=", an operator carries on from Ans (Ans+...) and anything else starts a fresh entry.
   */
  insertText(text: string, opts: { startFresh?: boolean } = {}): void {
    if (this.justEvaluated) {
      if (!opts.startFresh && CONTINUES_FROM_ANS.test(text)) {
        this.expression = 'Ans';
        this.cursorPos = 3;
      } else {
        this.expression = '';
        this.cursorPos = 0;
      }
      this.justEvaluated = false;
    }
    const before = this.expression.slice(0, this.cursorPos);
    const after = this.expression.slice(this.cursorPos);
    this.expression = before + text + after;
    this.cursorPos += text.length;
    this.modifier = 'NORMAL';
    this.hypPending = false;
    this.historyIndex = -1;
    this.clearResult();
    this.notify();
  }

  /**
   * Fraction key: draws a stacked fraction. A number just typed becomes the numerator and the
   * cursor drops into the denominator; otherwise the cursor starts in the empty numerator.
   */
  insertFraction(): void {
    if (this.justEvaluated) this.insertText('');
    const head = this.expression.slice(0, this.cursorPos);
    let num = '';
    const m = NUMERATOR.exec(head);
    if (m) num = m[0];
    const start = this.cursorPos - num.length;
    this.expression =
      this.expression.slice(0, start) + FRAC_OPEN + num + FRAC_SEP + FRAC_CLOSE + this.expression.slice(this.cursorPos);
    this.cursorPos = start + 1 + (num ? num.length + 1 : 0);
    this.modifier = 'NORMAL';
    this.hypPending = false;
    this.historyIndex = -1;
    this.clearResult();
    this.notify();
  }

  /** DEL next to a fraction marker steps into / dissolves the fraction instead of leaving half of it. */
  private deleteAtFractionMarker(): boolean {
    const e = this.expression;
    const p = this.cursorPos;
    const c = e[p - 1];

    if (c === FRAC_CLOSE) {
      this.cursorPos--; // step into the end of the denominator
      return true;
    }
    if (c === FRAC_SEP) {
      const open = enclosingOpen(e, p - 1);
      const close = matchingClose(e, open);
      const num = e.slice(open + 1, p - 1);
      if (e.slice(p, close) === '') {
        // empty denominator: dissolve back to the plain numerator
        this.expression = e.slice(0, open) + num + e.slice(close + 1);
        this.cursorPos = open + num.length;
      } else {
        this.cursorPos--;
      }
      return true;
    }
    if (c === FRAC_OPEN) {
      const close = matchingClose(e, p - 1);
      const sep = separatorOf(e, p - 1);
      const num = e.slice(p, sep);
      const den = e.slice(sep + 1, close);
      if (num === '') {
        // empty numerator: keep whatever is in the denominator
        this.expression = e.slice(0, p - 1) + den + e.slice(close + 1);
        this.cursorPos = p - 1;
      } else {
        this.cursorPos--;
      }
      return true;
    }
    return false;
  }

  deleteBack(): void {
    this.leaveResultForEditing();
    if (this.cursorPos > 0 && this.deleteAtFractionMarker()) {
      this.clearResult();
    } else if (this.cursorPos > 0) {
      const head = this.expression.slice(0, this.cursorPos);
      const len = TOKEN_BEFORE.exec(head)?.[0].length ?? 1;
      this.expression = head.slice(0, head.length - len) + this.expression.slice(this.cursorPos);
      this.cursorPos -= len;
      this.clearResult();
    }
    this.modifier = 'NORMAL';
    this.notify();
  }

  clearAll(): void {
    this.expression = '';
    this.cursorPos = 0;
    this.clearResult();
    this.justEvaluated = false;
    this.historyIndex = -1;
    this.hypPending = false;
    this.modifier = 'NORMAL';
    this.notify();
  }

  moveCursorLeft(): void {
    this.leaveResultForEditing();
    if (this.cursorPos > 0) {
      const head = this.expression.slice(0, this.cursorPos);
      this.cursorPos -= TOKEN_BEFORE.exec(head)?.[0].length ?? 1;
    }
    this.notify();
  }

  moveCursorRight(): void {
    this.leaveResultForEditing();
    if (this.cursorPos < this.expression.length) {
      const tail = this.expression.slice(this.cursorPos);
      this.cursorPos += TOKEN_AFTER.exec(tail)?.[0].length ?? 1;
    }
    this.notify();
  }

  /** Up arrow walks back through earlier calculations, like the replay memory on the real calculator. */
  historyUp(): void {
    if (this.history.length === 0) return;
    this.historyIndex = Math.min(this.historyIndex + 1, this.history.length - 1);
    this.loadHistoryEntry();
  }

  historyDown(): void {
    if (this.history.length === 0 || this.historyIndex < 0) return;
    this.historyIndex--;
    if (this.historyIndex < 0) {
      this.expression = '';
      this.cursorPos = 0;
      this.clearResult();
      this.justEvaluated = false;
      this.notify();
    } else {
      this.loadHistoryEntry();
    }
  }

  private loadHistoryEntry(): void {
    this.expression = this.history[this.historyIndex].expressionRaw;
    this.cursorPos = this.expression.length;
    this.clearResult();
    this.justEvaluated = false;
    this.notify();
  }

  /** Pressing left/right/DEL on an answer drops back into editing the expression that made it. */
  private leaveResultForEditing(): void {
    if (this.justEvaluated) {
      this.justEvaluated = false;
      this.clearResult();
    }
  }

  private clearResult(): void {
    this.resultExact = '';
    this.resultDecimal = '';
    this.activeResultFormat = 'EXACT';
  }

  /** hyp key: next sin/cos/tan press becomes the hyperbolic version. */
  toggleHyp(): void {
    this.hypPending = !this.hypPending;
    this.modifier = 'NORMAL';
    this.notify();
  }

  /** Insert a trig function, honouring a pending hyp key and SHIFT for the inverse. */
  insertTrig(base: 'sin' | 'cos' | 'tan', inverse: boolean): void {
    const prefix = inverse ? 'a' : '';
    const suffix = this.hypPending ? 'h' : '';
    this.insertText(`${prefix}${base}${suffix}(`);
  }

  /** ENG key: show the current answer in engineering notation (exponent a multiple of 3). */
  toEngineering(): void {
    if (!this.justEvaluated || !Number.isFinite(this.variables.Ans)) return;
    const text = Evaluator.toEngineering(this.variables.Ans);
    this.resultExact = text;
    this.resultDecimal = text;
    this.activeResultFormat = 'EXACT';
    this.notify();
  }

  toggleResultFormat(): void {
    if (!this.resultExact && !this.resultDecimal) return;

    if (this.activeResultFormat === 'EXACT') {
      this.activeResultFormat = 'DECIMAL';
    } else if (this.activeResultFormat === 'DECIMAL') {
      // Check if mixed fraction is available
      try {
        const num = parseFloat(this.resultDecimal);
        if (Number.isFinite(num)) {
          const frac = Fraction.fromNumber(num);
          if (frac.den > 1n && Fraction.absBigInt(frac.num) > frac.den) {
            this.activeResultFormat = 'MIXED';
          } else {
            this.activeResultFormat = 'EXACT';
          }
        } else {
          this.activeResultFormat = 'EXACT';
        }
      } catch {
        this.activeResultFormat = 'EXACT';
      }
    } else {
      this.activeResultFormat = 'EXACT';
    }
    this.notify();
  }

  getActiveResult(): string {
    if (this.activeResultFormat === 'DECIMAL') {
      return this.resultDecimal;
    }
    if (this.activeResultFormat === 'MIXED') {
      try {
        const num = parseFloat(this.resultDecimal);
        const frac = Fraction.fromNumber(num);
        return frac.toMixedString();
      } catch {
        return this.resultDecimal;
      }
    }
    return this.resultExact || this.resultDecimal;
  }

  evaluateExpression(saveHistory: boolean = true): void {
    if (!this.expression.trim()) return;

    Evaluator.setDisplay(this.settings.displayFormat, this.settings.fixDigits);

    try {
      const res = Evaluator.evaluate(this.expression, this.variables, this.settings.angleUnit);
      this.resultExact = res.exact;
      this.resultDecimal = res.decimal;

      if (saveHistory && typeof res.numericValue === 'number' && Number.isFinite(res.numericValue)) {
        this.variables.PreAns = this.variables.Ans;
        this.variables.Ans = res.numericValue;
      }

      if (saveHistory) {
        this.history.unshift({
          id: Date.now().toString(),
          timestamp: Date.now(),
          expressionDisplay: this.expression,
          expressionRaw: this.expression,
          resultExact: this.resultExact,
          resultDecimal: this.resultDecimal,
          mode: this.mode
        });
        if (this.history.length > 50) this.history.pop();
      }
      this.activeResultFormat = 'EXACT';
    } catch (e: unknown) {
      const err = e as Error;
      const msg = err.message || 'Syntax ERROR';
      this.resultExact = msg;
      this.resultDecimal = msg;
    }

    this.justEvaluated = true;
    this.historyIndex = -1;
    this.hypPending = false;
    this.modifier = 'NORMAL';
    this.notify();
  }

  primeFactorizeResult(): void {
    try {
      const num = this.justEvaluated ? this.variables.Ans : parseFloat(this.expression);
      if (Number.isFinite(num) && Number.isInteger(num) && num > 1) {
        this.resultExact = Surd.formatPrimeFactors(num);
        this.activeResultFormat = 'EXACT';
        this.notify();
      }
    } catch {
      // Ignored
    }
  }

  /**
   * The number M+, M- and STO act on: the answer on screen, or the expression typed so far
   * (evaluated first, like the real calculator). Uses the full-precision value, not display text.
   */
  currentValue(): number {
    if (!this.justEvaluated && this.expression.trim()) this.evaluateExpression(true);
    return this.justEvaluated && Number.isFinite(this.variables.Ans) ? this.variables.Ans : 0;
  }

  storeVariable(varName: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'X' | 'Y' | 'M'): void {
    this.variables[varName] = this.currentValue();
    this.notify();
  }

  addToMemory(): void {
    this.variables.M += this.currentValue();
    this.notify();
  }

  subtractFromMemory(): void {
    this.variables.M -= this.currentValue();
    this.notify();
  }

  clearVariables(): void {
    this.variables.A = 0;
    this.variables.B = 0;
    this.variables.C = 0;
    this.variables.D = 0;
    this.variables.E = 0;
    this.variables.F = 0;
    this.variables.X = 0;
    this.variables.Y = 0;
    this.variables.M = 0;
    this.notify();
  }

  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem('casio_calces_settings', JSON.stringify(this.settings));
      localStorage.setItem('casio_calces_vars', JSON.stringify(this.variables));
      localStorage.setItem('casio_calces_history', JSON.stringify(this.history.slice(0, 30)));
      // The real calculator keeps what is on screen when switched off and on again
      localStorage.setItem('casio_calces_screen', JSON.stringify({
        expression: this.expression,
        cursorPos: this.cursorPos,
        resultExact: this.resultExact,
        resultDecimal: this.resultDecimal,
        justEvaluated: this.justEvaluated,
        mode: this.mode
      }));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const savedSettings = localStorage.getItem('casio_calces_settings');
      if (savedSettings) Object.assign(this.settings, JSON.parse(savedSettings));

      const savedVars = localStorage.getItem('casio_calces_vars');
      if (savedVars) Object.assign(this.variables, JSON.parse(savedVars));

      const savedHist = localStorage.getItem('casio_calces_history');
      if (savedHist) this.history = JSON.parse(savedHist);

      const savedScreen = localStorage.getItem('casio_calces_screen');
      if (savedScreen) {
        const sc = JSON.parse(savedScreen);
        this.expression = String(sc.expression ?? '');
        this.cursorPos = Math.min(Number(sc.cursorPos) || 0, this.expression.length);
        this.resultExact = String(sc.resultExact ?? '');
        this.resultDecimal = String(sc.resultDecimal ?? '');
        this.justEvaluated = !!sc.justEvaluated;
        if (sc.mode) this.mode = sc.mode;
      }
    } catch {
      // Storage failed
    }
  }
}

export const store = new CalculatorStore();
