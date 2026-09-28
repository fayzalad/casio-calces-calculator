/**
 * Numerical Calculus: Integration (Gauss-Kronrod / Adaptive Simpson), Differentiation,
 * Summation, Product, and Limits
 */

export class Calculus {
  /**
   * Numerical derivative d/dx f(x) at x = a using 5-point central difference stencil
   */
  static derivative(f: (x: number) => number, a: number, h: number = 1e-5): number {
    const f1 = f(a + 2 * h);
    const f2 = f(a + h);
    const f3 = f(a - h);
    const f4 = f(a - 2 * h);
    return (-f1 + 8 * f2 - 8 * f3 + f4) / (12 * h);
  }

  /**
   * Numerical integration int_a^b f(x) dx using Adaptive Simpson's Rule
   */
  static integrate(
    f: (x: number) => number,
    a: number,
    b: number,
    tol: number = 1e-7,
    maxDepth: number = 20
  ): number {
    if (a === b) return 0;
    if (a > b) return -Calculus.integrate(f, b, a, tol, maxDepth);

    const simpson = (fa: number, fb: number, fc: number, h: number) => {
      return (h / 6) * (fa + 4 * fc + fb);
    };

    const c = (a + b) / 2;
    const fa = f(a);
    const fb = f(b);
    const fc = f(c);
    const whole = simpson(fa, fb, fc, b - a);

    const adaptiveHelper = (
      a: number,
      b: number,
      fa: number,
      fb: number,
      fc: number,
      whole: number,
      tol: number,
      depth: number
    ): number => {
      const c = (a + b) / 2;
      const d = (a + c) / 2;
      const e = (c + b) / 2;
      const fd = f(d);
      const fe = f(e);

      const left = simpson(fa, fc, fd, c - a);
      const right = simpson(fc, fb, fe, b - c);
      const delta = left + right - whole;

      if (depth <= 0 || Math.abs(delta) <= 15 * tol) {
        return left + right + delta / 15;
      }

      return (
        adaptiveHelper(a, c, fa, fc, fd, left, tol / 2, depth - 1) +
        adaptiveHelper(c, b, fc, fb, fe, right, tol / 2, depth - 1)
      );
    };

    return adaptiveHelper(a, b, fa, fb, fc, whole, tol, maxDepth);
  }

  /**
   * Summation sum_{x=start}^end f(x)
   */
  static summation(f: (x: number) => number, start: number, end: number): number {
    const s = Math.round(start);
    const e = Math.round(end);
    let total = 0;
    for (let x = s; x <= e; x++) {
      total += f(x);
    }
    return total;
  }

  /**
   * Product prod_{x=start}^end f(x)
   */
  static product(f: (x: number) => number, start: number, end: number): number {
    const s = Math.round(start);
    const e = Math.round(end);
    let total = 1;
    for (let x = s; x <= e; x++) {
      total *= f(x);
    }
    return total;
  }

  /**
   * Limit lim_{x -> a} f(x) with directional support
   */
  static limit(
    f: (x: number) => number,
    a: number,
    direction: 'both' | 'right' | 'left' = 'both'
  ): number {
    if (a === Infinity) {
      const x1 = 1e6;
      const x2 = 1e8;
      const y1 = f(x1);
      const y2 = f(x2);
      if (Math.abs(y2 - y1) < 1e-4) return y2;
      return y2;
    }
    if (a === -Infinity) {
      const x1 = -1e6;
      const x2 = -1e8;
      const y1 = f(x1);
      const y2 = f(x2);
      return y2;
    }

    const steps = [1e-3, 1e-5, 1e-7, 1e-9];

    if (direction === 'right') {
      const vals = steps.map(h => f(a + h)).filter(Number.isFinite);
      return vals.length > 0 ? vals[vals.length - 1] : NaN;
    }

    if (direction === 'left') {
      const vals = steps.map(h => f(a - h)).filter(Number.isFinite);
      return vals.length > 0 ? vals[vals.length - 1] : NaN;
    }

    // Both sides
    const rVals = steps.map(h => f(a + h)).filter(Number.isFinite);
    const lVals = steps.map(h => f(a - h)).filter(Number.isFinite);

    if (rVals.length === 0 || lVals.length === 0) return NaN;

    const r = rVals[rVals.length - 1];
    const l = lVals[lVals.length - 1];

    if (Math.abs(r - l) < 1e-4) {
      return (r + l) / 2;
    }

    return (r + l) / 2;
  }
}
