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

type Listener = () => void;

class CalculatorStore {
  public expression: string = '';
  public cursorPos: number = 0;
  public resultExact: string = '';
  public resultDecimal: string = '';
  public activeResultFormat: 'EXACT' | 'DECIMAL' | 'MIXED' = 'EXACT';

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
    if (this.expression.trim().length > 0) {
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

  insertText(text: string): void {
    const before = this.expression.slice(0, this.cursorPos);
    const after = this.expression.slice(this.cursorPos);
    this.expression = before + text + after;
    this.cursorPos += text.length;
    this.modifier = 'NORMAL';
    this.notify();
  }

  deleteBack(): void {
    if (this.cursorPos > 0) {
      const before = this.expression.slice(0, this.cursorPos - 1);
      const after = this.expression.slice(this.cursorPos);
      this.expression = before + after;
      this.cursorPos--;
      this.notify();
    }
  }

  clearAll(): void {
    this.expression = '';
    this.cursorPos = 0;
    this.resultExact = '';
    this.resultDecimal = '';
    this.modifier = 'NORMAL';
    this.notify();
  }

  moveCursorLeft(): void {
    if (this.cursorPos > 0) {
      this.cursorPos--;
      this.notify();
    }
  }

  moveCursorRight(): void {
    if (this.cursorPos < this.expression.length) {
      this.cursorPos++;
      this.notify();
    }
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

    try {
      const res = Evaluator.evaluate(this.expression, this.variables, this.settings.angleUnit);
      this.resultExact = res.exact;
      this.resultDecimal = res.decimal;

      // Update Ans & PreAns
      if (typeof res.numericValue === 'number' && Number.isFinite(res.numericValue)) {
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
      this.resultExact = err.message || 'Syntax ERROR';
      this.resultDecimal = err.message || 'Syntax ERROR';
    }

    this.modifier = 'NORMAL';
    this.notify();
  }

  primeFactorizeResult(): void {
    try {
      const num = parseFloat(this.resultDecimal || this.expression);
      if (Number.isFinite(num) && Number.isInteger(num) && num > 1) {
        this.resultExact = Surd.formatPrimeFactors(num);
        this.activeResultFormat = 'EXACT';
        this.notify();
      }
    } catch {
      // Ignored
    }
  }

  storeVariable(varName: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'X' | 'Y' | 'M'): void {
    const val = parseFloat(this.resultDecimal || this.expression) || 0;
    this.variables[varName] = val;
    this.notify();
  }

  addToMemory(): void {
    const val = parseFloat(this.resultDecimal || this.expression) || 0;
    this.variables.M += val;
    this.notify();
  }

  subtractFromMemory(): void {
    const val = parseFloat(this.resultDecimal || this.expression) || 0;
    this.variables.M -= val;
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
    } catch {
      // Storage failed
    }
  }
}

export const store = new CalculatorStore();
