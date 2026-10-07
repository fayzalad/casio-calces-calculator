import { AngleUnit, DisplayFormat, VariableStore } from '../types/calculator';
import { Surd } from './surd';
import { Fraction } from './fraction';
import { Complex } from './complex';
import { Calculus } from './calculus';
import { templatesToInfix } from './templates';

export interface EvaluationResult {
  exact: string;
  decimal: string;
  numericValue: number | Complex;
}

type Value = number | Complex;

type Token =
  | { t: 'num'; v: Value }
  | { t: 'id'; name: string }
  | { t: 'fn'; name: string }
  | { t: 'op'; name: string }
  | { t: 'lp' }
  | { t: 'rp' }
  | { t: 'comma' };

/** Number of arguments each function pops from the value stack. */
const FUNCTIONS: Record<string, number> = {
  sin: 1, cos: 1, tan: 1, asin: 1, acos: 1, atan: 1,
  sinh: 1, cosh: 1, tanh: 1, asinh: 1, acosh: 1, atanh: 1,
  cot: 1, sec: 1, csc: 1, acot: 1,
  ln: 1, log: 1, logab: 2, exp: 1, sqrt: 1, cbrt: 1, abs: 1,
  floor: 1, ceil: 1, round: 1, int: 1, frac: 1, sign: 1,
  gcd: 2, lcm: 2, pol: 2, rec: 2, root: 2, ranint: 2
};

/** Operators: precedence and associativity (higher binds tighter). */
const INFIX: Record<string, { prec: number; right?: boolean }> = {
  '+': { prec: 1 },
  '-': { prec: 1 },
  '*': { prec: 2 },
  '/': { prec: 2 },
  mod: { prec: 2 },
  // Implicit multiplication (2π, 2(3), 3sin(x)) binds tighter than ÷, like the real fx-991ES
  imul: { prec: 3 },
  nPr: { prec: 3 },
  nCr: { prec: 3 },
  '^': { prec: 5, right: true }
};
const NEG_PREC = 4; // -2^2 = -4, but -2*3 = (-2)*3
const POSTFIX = new Set(['!', '%', '°']);

const CALCULUS = ['integrate', 'diff', 'sum', 'prod', 'limit'];

export class Evaluator {
  private static displayFormat: DisplayFormat = 'NORM1';
  private static displayDigits = 2;

  /** Tell the number formatter which display mode the user picked in SETUP (NORM/FIX/SCI/ENG). */
  static setDisplay(format: DisplayFormat, digits: number): void {
    Evaluator.displayFormat = format;
    Evaluator.displayDigits = digits;
  }

  /**
   * Evaluates a mathematical expression string
   */
  static evaluate(
    expr: string,
    variables: VariableStore,
    angleUnit: AngleUnit = 'DEG'
  ): EvaluationResult {
    const { value, approx } = Evaluator.evalValue(expr, variables, angleUnit);

    if (value instanceof Complex) {
      const s = value.toRectangularString();
      return { exact: s, decimal: s, numericValue: value };
    }

    // The real calculator holds 15 digits internally, which hides float noise like 0.30000000000000004
    let num = Number(value);
    if (Number.isNaN(num)) throw new Error('Math ERROR');
    if (!Number.isFinite(num)) {
      return { exact: num > 0 ? '∞' : '-∞', decimal: num > 0 ? '∞' : '-∞', numericValue: num };
    }
    num = Number(num.toPrecision(15));

    const decimal = Evaluator.formatNumber(num);

    // Like the physical calculator: typing a decimal point (or using calculus) gives a decimal answer
    const wantsDecimal = approx || /\d\.|\.\d/.test(expr);
    if (wantsDecimal) {
      return { exact: decimal, decimal, numericValue: num };
    }

    let exact: string | null = Surd.tryRecognizeExact(num);
    if (exact === null) {
      try {
        const frac = Fraction.fromNumber(num);
        if (frac.den <= 10000n && frac.den > 1n) exact = frac.toString();
      } catch {
        // not a clean fraction
      }
    }
    return { exact: exact ?? decimal, decimal, numericValue: num };
  }

  /** Format a number the way the chosen display mode (NORM1/NORM2/FIX/SCI/ENG) would. */
  static formatNumber(val: number, maxDigits: number = 10): string {
    if (val === 0) return '0';
    const fmt = Evaluator.displayFormat;
    const n = Evaluator.displayDigits;
    const abs = Math.abs(val);

    const sci = (digits: number) => {
      const [m, e] = val.toExponential(digits).split('e');
      const mant = fmt === 'SCI' ? m : String(parseFloat(m));
      return `${mant} × 10^${parseInt(e, 10)}`;
    };

    if (fmt === 'FIX') return val.toFixed(n);
    if (fmt === 'SCI') return sci(Math.max(0, n === 0 ? 9 : n - 1));
    if (fmt === 'ENG' || fmt === 'ENG_SI') return Evaluator.toEngineering(val, maxDigits);

    // NORM1: sci outside 10^-2 .. 10^10;  NORM2: outside 10^-9 .. 10^10
    const low = fmt === 'NORM2' ? 1e-9 : 1e-2;
    if (abs >= 1e10 || abs < low) return sci(maxDigits - 1 - 0);
    const str = val.toPrecision(maxDigits);
    return str.includes('.') || str.includes('e') ? String(parseFloat(str)) : str;
  }

  /** Engineering notation: exponent is always a multiple of 3 (the ENG key). */
  static toEngineering(val: number, maxDigits: number = 10): string {
    if (val === 0) return '0';
    const exp = Math.floor(Math.log10(Math.abs(val)) / 3) * 3;
    const mant = Number((val / Math.pow(10, exp)).toPrecision(maxDigits));
    return exp === 0 ? String(mant) : `${mant} × 10^${exp}`;
  }

  // ---------------------------------------------------------------------------
  // Pipeline: normalise → calculus pre-pass → tokenize → shunting-yard → evaluate
  // ---------------------------------------------------------------------------

  private static evalValue(
    expr: string,
    vars: VariableStore,
    angle: AngleUnit
  ): { value: Value; approx: boolean } {
    let approx = false;
    let s = templatesToInfix(expr)
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, '@')
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/√/g, 'sqrt')
      .replace(/\s+/g, '');

    // Calculus: integrate(f,a,b), diff(f,a), sum(f,a,b), prod(f,a,b), limit(f,a)
    for (let guard = 0; guard < 50; guard++) {
      const call = Evaluator.findCalculusCall(s);
      if (!call) break;
      approx = true;
      const val = Evaluator.runCalculus(call.name, call.args, vars, angle);
      s = s.slice(0, call.start) + `(${Evaluator.numToLiteral(val)})` + s.slice(call.end);
    }

    const tokens = Evaluator.tokenize(s, vars);
    const postfix = Evaluator.toPostfix(tokens);
    const value = Evaluator.evaluatePostfix(postfix, angle);
    return { value, approx };
  }

  private static numToLiteral(n: number): string {
    if (!Number.isFinite(n)) throw new Error('Math ERROR');
    return String(n).replace('e', 'ᴇ');
  }

  private static findCalculusCall(
    s: string
  ): { name: string; args: string[]; start: number; end: number } | null {
    let best: { name: string; idx: number } | null = null;
    for (const name of CALCULUS) {
      const idx = s.indexOf(name + '(');
      if (idx !== -1 && (best === null || idx < best.idx)) best = { name, idx };
    }
    if (!best) return null;

    const open = best.idx + best.name.length;
    let depth = 0;
    let argStart = open + 1;
    const args: string[] = [];
    for (let i = open; i < s.length; i++) {
      const ch = s[i];
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) {
          args.push(s.slice(argStart, i));
          return { name: best.name, args, start: best.idx, end: i + 1 };
        }
      } else if (ch === ',' && depth === 1) {
        args.push(s.slice(argStart, i));
        argStart = i + 1;
      }
    }
    // Missing closing paren: auto-close like the real calculator does
    args.push(s.slice(argStart));
    return { name: best.name, args, start: best.idx, end: s.length };
  }

  private static runCalculus(
    name: string,
    args: string[],
    vars: VariableStore,
    angle: AngleUnit
  ): number {
    const num = (e: string): number => {
      const r = Evaluator.evalValue(e, vars, angle).value;
      return typeof r === 'number' ? r : r.re;
    };
    const f = (x: number): number => {
      const r = Evaluator.evalValue(args[0], { ...vars, X: x }, angle).value;
      return typeof r === 'number' ? r : r.re;
    };
    if (args.length < 2) throw new Error('Syntax ERROR');

    switch (name) {
      case 'integrate':
        if (args.length < 3) throw new Error('Syntax ERROR');
        return Calculus.integrate(f, num(args[1]), num(args[2]));
      case 'diff':
        return Calculus.derivative(f, num(args[1]));
      case 'sum':
        if (args.length < 3) throw new Error('Syntax ERROR');
        return Calculus.summation(f, num(args[1]), num(args[2]));
      case 'prod':
        if (args.length < 3) throw new Error('Syntax ERROR');
        return Calculus.product(f, num(args[1]), num(args[2]));
      default:
        return Calculus.limit(f, num(args[1]));
    }
  }

  private static tokenize(s: string, vars: VariableStore): Token[] {
    const raw: Token[] = [];
    let i = 0;

    while (i < s.length) {
      const ch = s[i];

      // Numbers, including the EXP key's ᴇ  (5ᴇ3 means 5×10³ and binds like one number)
      if (/\d/.test(ch) || (ch === '.' && /\d/.test(s[i + 1] ?? ''))) {
        let numStr = '';
        while (i < s.length && /[\d.]/.test(s[i])) numStr += s[i++];
        if (numStr.split('.').length > 2) throw new Error('Syntax ERROR');
        let value = parseFloat(numStr);
        if (s[i] === 'ᴇ') {
          i++;
          let expStr = '';
          if (s[i] === '-' || s[i] === '+') expStr += s[i++];
          while (i < s.length && /\d/.test(s[i])) expStr += s[i++];
          if (!/\d/.test(expStr)) throw new Error('Syntax ERROR');
          value = value * Math.pow(10, parseInt(expStr, 10));
        }
        raw.push({ t: 'num', v: value });
        continue;
      }

      // ᴇ with no mantissa in front of it means 1ᴇ…
      if (ch === '@') {
        raw.push({ t: 'num', v: Math.PI });
        i++;
        continue;
      }

      if (ch === 'ᴇ') {
        s = s.slice(0, i) + '1' + s.slice(i);
        continue;
      }

      if (/[a-zA-Z_]/.test(ch)) {
        let ident = '';
        while (i < s.length && /[a-zA-Z_]/.test(s[i])) ident += s[i++];
        Evaluator.pushIdentifier(raw, ident, vars);
        continue;
      }

      if (ch === '(') raw.push({ t: 'lp' });
      else if (ch === ')') raw.push({ t: 'rp' });
      else if (ch === ',') raw.push({ t: 'comma' });
      else if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^') {
        raw.push({ t: 'op', name: ch });
      } else if (ch === '!' || ch === '%' || ch === '°') {
        raw.push({ t: 'op', name: ch });
      } else if (ch === '=' || ch === ':' || ch === ' ') {
        // CALC-style separators are ignored in plain evaluation
      } else {
        throw new Error('Syntax ERROR');
      }
      i++;
    }

    return Evaluator.insertImplicit(raw);
  }

  /**
   * Splits identifiers like "pi", "sin", "Ans", "AB" into functions, constants and variables.
   * Anything that isn't recognised is split letter-by-letter into variables (so "AB" = A×B).
   */
  private static pushIdentifier(out: Token[], ident: string, vars: VariableStore): void {
    const lower = ident.toLowerCase();
    if (ident === 'PreAns') return void out.push({ t: 'num', v: vars.PreAns });
    if (ident === 'Ans') return void out.push({ t: 'num', v: vars.Ans });
    if (ident === 'Infinity') return void out.push({ t: 'num', v: Infinity });
    if (lower === 'pi') return void out.push({ t: 'num', v: Math.PI });
    if (ident === 'e') return void out.push({ t: 'num', v: Math.E });
    if (ident === 'i') return void out.push({ t: 'num', v: new Complex(0, 1) });
    if (ident === 'mod' || ident === 'nPr' || ident === 'nCr') {
      return void out.push({ t: 'op', name: ident });
    }
    if (ident in FUNCTIONS || lower in FUNCTIONS) {
      return void out.push({ t: 'fn', name: ident in FUNCTIONS ? ident : lower });
    }
    if (ident.length === 1) {
      const key = ident.toUpperCase() as keyof VariableStore;
      if ('ABCDEFXYM'.includes(key)) return void out.push({ t: 'num', v: vars[key] });
    }
    if (ident.length > 1) {
      // Not a single known word: scan it for known words (sinx -> sin, x;  AmodB -> A, mod, B)
      const words = [...Object.keys(FUNCTIONS), 'PreAns', 'Ans', 'mod', 'nPr', 'nCr', 'Infinity']
        .sort((a, b) => b.length - a.length);
      let pos = 0;
      while (pos < ident.length) {
        const word = words.find(w => ident.startsWith(w, pos));
        const len = word ? word.length : 1;
        Evaluator.pushIdentifier(out, ident.slice(pos, pos + len), vars);
        pos += len;
      }
      return;
    }
    throw new Error('Syntax ERROR');
  }

  /** Insert × between touching values: 2π, 2(3), (2)(3), 3sin(x), AB, 2Ans */
  private static insertImplicit(tokens: Token[]): Token[] {
    const out: Token[] = [];
    for (const tok of tokens) {
      const prev = out[out.length - 1];
      const prevEndsValue =
        prev !== undefined &&
        (prev.t === 'num' || prev.t === 'rp' || (prev.t === 'op' && POSTFIX.has(prev.name)));
      const startsValue = tok.t === 'num' || tok.t === 'lp' || tok.t === 'fn';
      if (prevEndsValue && startsValue) out.push({ t: 'op', name: 'imul' });
      out.push(tok);
    }
    return out;
  }

  private static toPostfix(tokens: Token[]): Token[] {
    const output: Token[] = [];
    const stack: Token[] = [];
    let expectOperand = true; // true at start, after '(' , after ',' and after an infix operator

    const top = () => stack[stack.length - 1];
    const prec = (t: Token): number =>
      t.t === 'op' ? (t.name === 'neg' ? NEG_PREC : INFIX[t.name]?.prec ?? 0) : 0;

    for (const tok of tokens) {
      switch (tok.t) {
        case 'num':
          output.push(tok);
          expectOperand = false;
          break;
        case 'fn':
          stack.push(tok);
          expectOperand = true;
          break;
        case 'lp':
          stack.push(tok);
          expectOperand = true;
          break;
        case 'comma':
          while (stack.length && top().t !== 'lp') output.push(stack.pop()!);
          expectOperand = true;
          break;
        case 'rp':
          while (stack.length && top().t !== 'lp') output.push(stack.pop()!);
          if (!stack.length) throw new Error('Syntax ERROR');
          stack.pop();
          if (stack.length && top().t === 'fn') output.push(stack.pop()!);
          expectOperand = false;
          break;
        case 'op': {
          const name = tok.name;
          if (POSTFIX.has(name)) {
            if (expectOperand) throw new Error('Syntax ERROR');
            output.push(tok); // postfix applies to the value just produced
            break;
          }
          if (expectOperand) {
            // prefix sign
            if (name === '-') stack.push({ t: 'op', name: 'neg' });
            else if (name !== '+') throw new Error('Syntax ERROR');
            break;
          }
          const info = INFIX[name];
          while (stack.length && top().t === 'op') {
            const p = prec(top());
            if (p > info.prec || (p === info.prec && !info.right)) output.push(stack.pop()!);
            else break;
          }
          stack.push(tok);
          expectOperand = true;
          break;
        }
      }
    }

    if (expectOperand && tokens.length > 0) throw new Error('Syntax ERROR');

    // Unclosed parentheses are closed automatically, as on the real calculator
    while (stack.length) {
      const t = stack.pop()!;
      if (t.t !== 'lp') output.push(t);
    }
    return output;
  }

  // ---------------------------------------------------------------------------
  // Angle helpers
  // ---------------------------------------------------------------------------

  private static toRad(angle: number, unit: AngleUnit): number {
    switch (unit) {
      case 'DEG': return (angle * Math.PI) / 180;
      case 'RAD': return angle;
      case 'GRA': return (angle * Math.PI) / 200;
    }
  }

  private static fromRad(rad: number, unit: AngleUnit): number {
    switch (unit) {
      case 'DEG': return (rad * 180) / Math.PI;
      case 'RAD': return rad;
      case 'GRA': return (rad * 200) / Math.PI;
    }
  }

  /**
   * sin/cos/tan with exact answers at quarter turns, so sin(180°) is 0 and tan(90°) is a
   * Math ERROR, instead of 1.22e-16 and 1.6e16.
   */
  private static trig(fn: 'sin' | 'cos' | 'tan', angle: number, unit: AngleUnit): number {
    const rad = Evaluator.toRad(angle, unit);
    const quarters = rad / (Math.PI / 2);
    const k = Math.round(quarters);
    if (k !== 0 && Math.abs(quarters - k) < 1e-9) {
      const m = ((k % 4) + 4) % 4;
      if (fn === 'sin') return [0, 1, 0, -1][m];
      if (fn === 'cos') return [1, 0, -1, 0][m];
      if (m % 2 === 1) throw new Error('Math ERROR');
      return 0;
    }
    return fn === 'sin' ? Math.sin(rad) : fn === 'cos' ? Math.cos(rad) : Math.tan(rad);
  }

  // ---------------------------------------------------------------------------
  // Evaluation
  // ---------------------------------------------------------------------------

  private static toComplex(v: Value): Complex {
    return v instanceof Complex ? v : new Complex(v, 0);
  }

  private static evaluatePostfix(postfix: Token[], angle: AngleUnit): Value {
    const stack: Value[] = [];

    const pop = (): Value => {
      const v = stack.pop();
      if (v === undefined) throw new Error('Syntax ERROR');
      return v;
    };
    const popNum = (): number => {
      const v = pop();
      return typeof v === 'number' ? v : v.re;
    };
    const integer = (n: number): number => {
      if (!Number.isInteger(n)) throw new Error('Math ERROR');
      return n;
    };

    for (const tok of postfix) {
      if (tok.t === 'num') {
        stack.push(tok.v);
        continue;
      }
      if (tok.t === 'fn') {
        Evaluator.applyFunction(tok.name, stack, pop, popNum, integer, angle);
        continue;
      }
      if (tok.t !== 'op') throw new Error('Syntax ERROR');

      const name = tok.name;
      switch (name) {
        case 'neg': {
          const a = pop();
          stack.push(a instanceof Complex ? new Complex(-a.re, -a.im) : -a);
          break;
        }
        case '+': case '-': case '*': case 'imul': case '/': {
          const b = pop();
          const a = pop();
          if (a instanceof Complex || b instanceof Complex) {
            const ca = Evaluator.toComplex(a);
            const cb = Evaluator.toComplex(b);
            stack.push(
              name === '+' ? ca.add(cb) : name === '-' ? ca.sub(cb) : name === '/' ? ca.div(cb) : ca.mul(cb)
            );
          } else if (name === '+') stack.push(a + b);
          else if (name === '-') stack.push(a - b);
          else if (name === '/') {
            if (b === 0) throw new Error('Math ERROR');
            stack.push(a / b);
          } else stack.push(a * b);
          break;
        }
        case '^': {
          const b = pop();
          const a = pop();
          if (a instanceof Complex || b instanceof Complex) {
            stack.push(Evaluator.toComplex(a).pow(b instanceof Complex ? b.re : b));
          } else if (a < 0 && !Number.isInteger(b)) {
            stack.push(new Complex(a, 0).pow(b));
          } else if (a === 0 && b <= 0) {
            throw new Error('Math ERROR');
          } else {
            stack.push(Math.pow(a, b));
          }
          break;
        }
        case 'mod': {
          const b = popNum();
          const a = popNum();
          if (b === 0) throw new Error('Math ERROR');
          stack.push(a - b * Math.floor(a / b)); // result takes the divisor's sign, like ÷R remainder for positives
          break;
        }
        case '!': {
          const a = integer(popNum());
          if (a < 0 || a > 170) throw new Error('Math ERROR');
          let f = 1;
          for (let i = 2; i <= a; i++) f *= i;
          stack.push(f);
          break;
        }
        case '%':
          stack.push(popNum() / 100);
          break;
        case '°':
          // x° converts to whatever angle unit is active
          stack.push(Evaluator.fromRad((popNum() * Math.PI) / 180, angle));
          break;
        case 'nPr': case 'nCr': {
          const r = integer(popNum());
          const n = integer(popNum());
          if (n < 0 || r < 0 || r > n) throw new Error('Math ERROR');
          let res = 1;
          if (name === 'nPr') {
            for (let i = 0; i < r; i++) res *= n - i;
          } else {
            const k = Math.min(r, n - r);
            for (let i = 1; i <= k; i++) res = (res * (n - k + i)) / i;
            res = Math.round(res);
          }
          stack.push(res);
          break;
        }
        default:
          throw new Error('Syntax ERROR');
      }
    }

    if (stack.length !== 1) throw new Error('Syntax ERROR');
    return stack[0];
  }

  private static applyFunction(
    name: string,
    stack: Value[],
    pop: () => Value,
    popNum: () => number,
    integer: (n: number) => number,
    angle: AngleUnit
  ): void {
    const need = (n: number) => {
      if (stack.length < n) throw new Error('Syntax ERROR');
    };
    const domain = (ok: boolean) => {
      if (!ok) throw new Error('Math ERROR');
    };

    switch (name) {
      case 'sin': case 'cos': case 'tan':
        return void stack.push(Evaluator.trig(name, popNum(), angle));
      case 'cot': {
        const t = Evaluator.trig('tan', popNum(), angle);
        domain(t !== 0);
        return void stack.push(1 / t);
      }
      case 'sec': {
        const c = Evaluator.trig('cos', popNum(), angle);
        domain(c !== 0);
        return void stack.push(1 / c);
      }
      case 'csc': {
        const s = Evaluator.trig('sin', popNum(), angle);
        domain(s !== 0);
        return void stack.push(1 / s);
      }
      case 'asin': { const a = popNum(); domain(a >= -1 && a <= 1); return void stack.push(Evaluator.fromRad(Math.asin(a), angle)); }
      case 'acos': { const a = popNum(); domain(a >= -1 && a <= 1); return void stack.push(Evaluator.fromRad(Math.acos(a), angle)); }
      case 'atan': return void stack.push(Evaluator.fromRad(Math.atan(popNum()), angle));
      case 'acot': { const a = popNum(); return void stack.push(Evaluator.fromRad(a === 0 ? Math.PI / 2 : Math.atan(1 / a), angle)); }
      case 'sinh': return void stack.push(Math.sinh(popNum()));
      case 'cosh': return void stack.push(Math.cosh(popNum()));
      case 'tanh': return void stack.push(Math.tanh(popNum()));
      case 'asinh': return void stack.push(Math.asinh(popNum()));
      case 'acosh': { const a = popNum(); domain(a >= 1); return void stack.push(Math.acosh(a)); }
      case 'atanh': { const a = popNum(); domain(a > -1 && a < 1); return void stack.push(Math.atanh(a)); }
      case 'ln': { const a = popNum(); domain(a > 0); return void stack.push(Math.log(a)); }
      case 'log': {
        const a = popNum();
        domain(a > 0);
        const r = Math.log10(a);
        // log(1000) must be exactly 3, not 2.9999999999999996
        return void stack.push(Math.abs(r - Math.round(r)) < 1e-12 ? Math.round(r) : r);
      }
      case 'logab': {
        need(2);
        const x = popNum();
        const base = popNum();
        domain(x > 0 && base > 0 && base !== 1);
        const r = Math.log(x) / Math.log(base);
        return void stack.push(Math.abs(r - Math.round(r)) < 1e-12 ? Math.round(r) : r);
      }
      case 'exp': return void stack.push(Math.exp(popNum()));
      case 'sqrt': {
        const a = popNum();
        return void stack.push(a < 0 ? new Complex(0, Math.sqrt(-a)) : Math.sqrt(a));
      }
      case 'cbrt': return void stack.push(Math.cbrt(popNum()));
      case 'root': {
        need(2);
        const x = popNum();
        const n = popNum();
        domain(n !== 0 && (x >= 0 || (Number.isInteger(n) && n % 2 !== 0)));
        return void stack.push(x < 0 ? -Math.pow(-x, 1 / n) : Math.pow(x, 1 / n));
      }
      case 'abs': {
        const a = pop();
        return void stack.push(a instanceof Complex ? a.abs() : Math.abs(a));
      }
      case 'floor': return void stack.push(Math.floor(popNum()));
      case 'ceil': return void stack.push(Math.ceil(popNum()));
      case 'round': return void stack.push(Math.round(popNum()));
      case 'int': return void stack.push(Math.trunc(popNum()));
      case 'frac': { const a = popNum(); return void stack.push(a - Math.trunc(a)); }
      case 'sign': return void stack.push(Math.sign(popNum()));
      case 'gcd': {
        need(2);
        const b = Math.abs(integer(popNum()));
        const a = Math.abs(integer(popNum()));
        return void stack.push(Surd.gcd(a, b));
      }
      case 'lcm': {
        need(2);
        const b = Math.abs(integer(popNum()));
        const a = Math.abs(integer(popNum()));
        return void stack.push(a === 0 || b === 0 ? 0 : (a * b) / Surd.gcd(a, b));
      }
      case 'pol': {
        need(2);
        const y = popNum();
        const x = popNum();
        return void stack.push(Math.hypot(x, y));
      }
      case 'rec': {
        need(2);
        const theta = popNum();
        const r = popNum();
        return void stack.push(r * Evaluator.trig('cos', theta, angle));
      }
      case 'ranint': {
        need(2);
        const hi = Math.floor(popNum());
        const lo = Math.ceil(popNum());
        domain(hi >= lo);
        return void stack.push(lo + Math.floor(Math.random() * (hi - lo + 1)));
      }
      default:
        throw new Error('Syntax ERROR');
    }
  }
}
