import { AngleUnit, VariableStore } from '../types/calculator';
import { Fraction } from './fraction';
import { Surd } from './surd';
import { Complex } from './complex';
import { Calculus } from './calculus';

export interface EvaluationResult {
  exact: string;
  decimal: string;
  numericValue: number | Complex;
}

export class Evaluator {
  /**
   * Evaluates a mathematical expression string
   */
  static evaluate(
    expr: string,
    variables: VariableStore,
    angleUnit: AngleUnit = 'DEG'
  ): EvaluationResult {
    let sanitized = Evaluator.sanitize(expr, variables);
    const tokens = Evaluator.tokenize(sanitized);
    const postfix = Evaluator.shuntingYard(tokens);
    const result = Evaluator.evaluatePostfix(postfix, variables, angleUnit);

    let exact = '';
    let decimal = '';

    if (result instanceof Complex) {
      exact = result.toRectangularString();
      decimal = result.toRectangularString();
      return { exact, decimal, numericValue: result };
    }

    const num = Number(result);
    if (!Number.isFinite(num)) {
      if (Number.isNaN(num)) throw new Error('Math ERROR');
      return { exact: num > 0 ? '∞' : '-∞', decimal: num > 0 ? '∞' : '-∞', numericValue: num };
    }

    // Try recognizing exact fraction or surd/pi
    const exactSurd = Surd.tryRecognizeExact(num);
    if (exactSurd !== null) {
      exact = exactSurd;
    } else {
      try {
        const frac = Fraction.fromNumber(num);
        if (frac.den <= 10000n && frac.den > 1n) {
          exact = frac.toString();
        } else {
          exact = Evaluator.formatNumber(num);
        }
      } catch {
        exact = Evaluator.formatNumber(num);
      }
    }

    decimal = Evaluator.formatNumber(num);

    return { exact, decimal, numericValue: num };
  }

  static formatNumber(val: number, maxDigits: number = 10): string {
    if (Math.abs(val) === 0) return '0';
    if (Math.abs(val) >= 1e10 || (Math.abs(val) < 1e-3 && Math.abs(val) > 0)) {
      return val.toExponential(maxDigits - 4).replace('e+', ' × 10^').replace('e-', ' × 10^-');
    }
    const str = val.toPrecision(maxDigits);
    return str.includes('.') ? parseFloat(str).toString() : str;
  }

  private static sanitize(expr: string, vars: VariableStore): string {
    let s = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, `${Math.PI}`)
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/\s+/g, '');

    // Variable substitutions
    const varNames = ['PreAns', 'Ans', 'A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'M'] as const;
    for (const v of varNames) {
      const val = vars[v];
      const regex = new RegExp(`\\b${v}\\b`, 'g');
      s = s.replace(regex, `(${val})`);
    }

    // Insert implicit multiplication: e.g. 2(3) -> 2*(3), (2)(3) -> (2)*(3), 2sin -> 2*sin
    s = s.replace(/(\d)(\()/g, '$1*$2');
    s = s.replace(/(\))(\d)/g, '$1*$2');
    s = s.replace(/(\))(\()/g, '$1*$2');
    s = s.replace(/(\d)([a-zA-Z])/g, '$1*$2');

    return s;
  }

  private static tokenize(expr: string): string[] {
    const tokens: string[] = [];
    let i = 0;

    while (i < expr.length) {
      const char = expr[i];

      if (/\d/.test(char) || (char === '.' && /\d/.test(expr[i + 1] || ''))) {
        let numStr = '';
        while (i < expr.length && (/[\d.]/.test(expr[i]) || (expr[i] === 'e' && /[\d+-]/.test(expr[i + 1] || '')))) {
          numStr += expr[i];
          if (expr[i] === 'e' && /[\d+-]/.test(expr[i + 1] || '')) {
            i++;
            numStr += expr[i];
          }
          i++;
        }
        tokens.push(numStr);
        continue;
      }

      if (/[a-zA-Z_]/.test(char)) {
        let ident = '';
        while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
          ident += expr[i];
          i++;
        }
        tokens.push(ident);
        continue;
      }

      if ('+-*/^!%(),'.includes(char)) {
        // Distinguish unary minus from binary minus
        if (char === '-') {
          const prev = tokens[tokens.length - 1];
          if (tokens.length === 0 || '+-*/^('.includes(prev)) {
            tokens.push('neg');
            i++;
            continue;
          }
        }
        tokens.push(char);
        i++;
        continue;
      }

      i++;
    }

    return tokens;
  }

  private static precedence(op: string): number {
    switch (op) {
      case 'neg': return 5;
      case '!': case '%': return 4;
      case '^': return 3;
      case '*': case '/': return 2;
      case '+': case '-': return 1;
      default: return 0;
    }
  }

  private static isRightAssociative(op: string): boolean {
    return op === '^' || op === 'neg';
  }

  private static shuntingYard(tokens: string[]): string[] {
    const output: string[] = [];
    const stack: string[] = [];

    const isFunction = (t: string) =>
      ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'cot', 'sec', 'csc',
       'ln', 'log', 'sqrt', 'cbrt', 'abs', 'floor', 'ceil', 'round', 'gcd', 'lcm', 'mod',
       'nPr', 'nCr', 'pol', 'rec', 'diff', 'integrate', 'sum', 'prod'].includes(t);

    for (const token of tokens) {
      if (!isNaN(Number(token))) {
        output.push(token);
      } else if (isFunction(token)) {
        stack.push(token);
      } else if (token === ',') {
        while (stack.length > 0 && stack[stack.length - 1] !== '(') {
          output.push(stack.pop()!);
        }
      } else if ('+-*/^!%neg'.includes(token)) {
        while (
          stack.length > 0 &&
          stack[stack.length - 1] !== '(' &&
          (Evaluator.precedence(stack[stack.length - 1]) > Evaluator.precedence(token) ||
            (Evaluator.precedence(stack[stack.length - 1]) === Evaluator.precedence(token) &&
              !Evaluator.isRightAssociative(token)))
        ) {
          output.push(stack.pop()!);
        }
        stack.push(token);
      } else if (token === '(') {
        stack.push(token);
      } else if (token === ')') {
        while (stack.length > 0 && stack[stack.length - 1] !== '(') {
          output.push(stack.pop()!);
        }
        stack.pop(); // pop '('
        if (stack.length > 0 && isFunction(stack[stack.length - 1])) {
          output.push(stack.pop()!);
        }
      }
    }

    while (stack.length > 0) {
      output.push(stack.pop()!);
    }

    return output;
  }

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

  private static evaluatePostfix(
    postfix: string[],
    vars: VariableStore,
    angleUnit: AngleUnit
  ): number | Complex {
    const stack: (number | Complex)[] = [];

    const popNum = (): number => {
      const v = stack.pop();
      if (v === undefined) throw new Error('Syntax ERROR');
      return typeof v === 'number' ? v : v.re;
    };

    for (const token of postfix) {
      if (!isNaN(Number(token))) {
        stack.push(Number(token));
        continue;
      }

      switch (token) {
        case '+': {
          const b = stack.pop()!;
          const a = stack.pop()!;
          if (a instanceof Complex || b instanceof Complex) {
            const ca = a instanceof Complex ? a : new Complex(a, 0);
            const cb = b instanceof Complex ? b : new Complex(b, 0);
            stack.push(ca.add(cb));
          } else {
            stack.push(a + b);
          }
          break;
        }
        case '-': {
          const b = stack.pop()!;
          const a = stack.pop()!;
          if (a instanceof Complex || b instanceof Complex) {
            const ca = a instanceof Complex ? a : new Complex(a, 0);
            const cb = b instanceof Complex ? b : new Complex(b, 0);
            stack.push(ca.sub(cb));
          } else {
            stack.push(a - b);
          }
          break;
        }
        case '*': {
          const b = stack.pop()!;
          const a = stack.pop()!;
          if (a instanceof Complex || b instanceof Complex) {
            const ca = a instanceof Complex ? a : new Complex(a, 0);
            const cb = b instanceof Complex ? b : new Complex(b, 0);
            stack.push(ca.mul(cb));
          } else {
            stack.push(a * b);
          }
          break;
        }
        case '/': {
          const b = stack.pop()!;
          const a = stack.pop()!;
          if (a instanceof Complex || b instanceof Complex) {
            const ca = a instanceof Complex ? a : new Complex(a, 0);
            const cb = b instanceof Complex ? b : new Complex(b, 0);
            stack.push(ca.div(cb));
          } else {
            if (b === 0) throw new Error('Math ERROR: Division by zero');
            stack.push(a / b);
          }
          break;
        }
        case '^': {
          const b = popNum();
          const a = stack.pop()!;
          if (a instanceof Complex) {
            stack.push(a.pow(b));
          } else {
            if (a < 0 && !Number.isInteger(b)) {
              const ca = new Complex(a, 0);
              stack.push(ca.pow(b));
            } else {
              stack.push(Math.pow(a, b));
            }
          }
          break;
        }
        case 'neg': {
          const a = stack.pop()!;
          if (a instanceof Complex) stack.push(new Complex(-a.re, -a.im));
          else stack.push(-a);
          break;
        }
        case '!': {
          const a = Math.round(popNum());
          if (a < 0) throw new Error('Math ERROR');
          let f = 1;
          for (let i = 2; i <= a; i++) f *= i;
          stack.push(f);
          break;
        }
        case '%': {
          const a = popNum();
          stack.push(a / 100);
          break;
        }
        case 'sin': {
          const a = popNum();
          stack.push(Math.sin(Evaluator.toRad(a, angleUnit)));
          break;
        }
        case 'cos': {
          const a = popNum();
          stack.push(Math.cos(Evaluator.toRad(a, angleUnit)));
          break;
        }
        case 'tan': {
          const a = popNum();
          stack.push(Math.tan(Evaluator.toRad(a, angleUnit)));
          break;
        }
        case 'asin': {
          const a = popNum();
          if (a < -1 || a > 1) throw new Error('Math ERROR');
          stack.push(Evaluator.fromRad(Math.asin(a), angleUnit));
          break;
        }
        case 'acos': {
          const a = popNum();
          if (a < -1 || a > 1) throw new Error('Math ERROR');
          stack.push(Evaluator.fromRad(Math.acos(a), angleUnit));
          break;
        }
        case 'atan': {
          const a = popNum();
          stack.push(Evaluator.fromRad(Math.atan(a), angleUnit));
          break;
        }
        case 'cot': {
          const a = popNum();
          const t = Math.tan(Evaluator.toRad(a, angleUnit));
          if (t === 0) throw new Error('Math ERROR');
          stack.push(1 / t);
          break;
        }
        case 'sec': {
          const a = popNum();
          const c = Math.cos(Evaluator.toRad(a, angleUnit));
          if (c === 0) throw new Error('Math ERROR');
          stack.push(1 / c);
          break;
        }
        case 'csc': {
          const a = popNum();
          const s = Math.sin(Evaluator.toRad(a, angleUnit));
          if (s === 0) throw new Error('Math ERROR');
          stack.push(1 / s);
          break;
        }
        case 'ln': {
          const a = popNum();
          if (a <= 0) throw new Error('Math ERROR');
          stack.push(Math.log(a));
          break;
        }
        case 'log': {
          const a = popNum();
          if (a <= 0) throw new Error('Math ERROR');
          stack.push(Math.log10(a));
          break;
        }
        case 'sqrt': {
          const a = popNum();
          if (a < 0) {
            stack.push(new Complex(0, Math.sqrt(-a)));
          } else {
            stack.push(Math.sqrt(a));
          }
          break;
        }
        case 'cbrt': {
          const a = popNum();
          stack.push(Math.cbrt(a));
          break;
        }
        case 'abs': {
          const a = stack.pop()!;
          stack.push(a instanceof Complex ? a.abs() : Math.abs(a));
          break;
        }
        case 'floor': {
          stack.push(Math.floor(popNum()));
          break;
        }
        case 'ceil': {
          stack.push(Math.ceil(popNum()));
          break;
        }
        case 'round': {
          stack.push(Math.round(popNum()));
          break;
        }
        case 'gcd': {
          const b = Math.abs(Math.round(popNum()));
          const a = Math.abs(Math.round(popNum()));
          stack.push(Surd.gcd(a, b));
          break;
        }
        case 'lcm': {
          const b = Math.abs(Math.round(popNum()));
          const a = Math.abs(Math.round(popNum()));
          stack.push(b === 0 || a === 0 ? 0 : (a * b) / Surd.gcd(a, b));
          break;
        }
        case 'mod': {
          const b = popNum();
          const a = popNum();
          stack.push(a % b);
          break;
        }
        case 'nPr': {
          const r = Math.round(popNum());
          const n = Math.round(popNum());
          if (n < 0 || r < 0 || r > n) throw new Error('Math ERROR');
          let res = 1;
          for (let i = 0; i < r; i++) res *= n - i;
          stack.push(res);
          break;
        }
        case 'nCr': {
          const r = Math.round(popNum());
          const n = Math.round(popNum());
          if (n < 0 || r < 0 || r > n) throw new Error('Math ERROR');
          let res = 1;
          for (let i = 1; i <= r; i++) {
            res = (res * (n - r + i)) / i;
          }
          stack.push(Math.round(res));
          break;
        }
        case 'pol': {
          const y = popNum();
          const x = popNum();
          const r = Math.hypot(x, y);
          stack.push(r);
          break;
        }
        case 'rec': {
          const theta = popNum();
          const r = popNum();
          const rad = Evaluator.toRad(theta, angleUnit);
          stack.push(r * Math.cos(rad));
          break;
        }
        default:
          throw new Error(`Syntax ERROR: Unknown token ${token}`);
      }
    }

    if (stack.length !== 1) {
      throw new Error('Syntax ERROR');
    }

    return stack[0];
  }
}
