import { Complex } from './complex';

export interface PolynomialRoot {
  root: Complex;
  multiplicity: number;
}

export interface QuadraticResult {
  x1: Complex;
  x2: Complex;
  vertexX: number;
  vertexY: number;
  isMinimum: boolean;
}

export class Solver {
  /**
   * Solves system of linear equations A * X = B
   */
  static solveLinearSystem(A: number[][], B: number[]): number[] {
    const n = B.length;
    if (A.length !== n || A.some(row => row.length !== n)) {
      throw new Error('Dimension ERROR');
    }

    // Augmented matrix
    const M = A.map((row, i) => [...row, B[i]]);

    // Gaussian elimination with partial pivoting
    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k;
      }

      if (Math.abs(M[maxRow][i]) < 1e-12) {
        throw new Error('Math ERROR: Infinite or No Solutions');
      }

      [M[i], M[maxRow]] = [M[maxRow], M[i]];

      for (let k = i + 1; k < n; k++) {
        const factor = M[k][i] / M[i][i];
        for (let j = i; j <= n; j++) {
          M[k][j] -= factor * M[i][j];
        }
      }
    }

    // Back substitution
    const X = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let sum = M[i][n];
      for (let j = i + 1; j < n; j++) {
        sum -= M[i][j] * X[j];
      }
      X[i] = sum / M[i][i];
    }

    return X;
  }

  /**
   * Solves quadratic equation: a x^2 + b x + c = 0
   */
  static solveQuadratic(a: number, b: number, c: number): QuadraticResult {
    if (a === 0) {
      if (b === 0) throw new Error('Math ERROR: No variable to solve');
      const root = -c / b;
      return {
        x1: new Complex(root, 0),
        x2: new Complex(root, 0),
        vertexX: root,
        vertexY: c,
        isMinimum: true
      };
    }

    const disc = b * b - 4 * a * c;
    const vertexX = -b / (2 * a);
    const vertexY = c - (b * b) / (4 * a);
    const isMinimum = a > 0;

    let x1: Complex;
    let x2: Complex;

    if (disc >= 0) {
      const sqrtDisc = Math.sqrt(disc);
      x1 = new Complex((-b + sqrtDisc) / (2 * a), 0);
      x2 = new Complex((-b - sqrtDisc) / (2 * a), 0);
    } else {
      const sqrtDisc = Math.sqrt(-disc);
      x1 = new Complex(-b / (2 * a), sqrtDisc / (2 * a));
      x2 = new Complex(-b / (2 * a), -sqrtDisc / (2 * a));
    }

    return { x1, x2, vertexX, vertexY, isMinimum };
  }

  /**
   * Solves cubic equation: a x^3 + b x^2 + c x + d = 0 using Cardano's formula
   */
  static solveCubic(a: number, b: number, c: number, d: number): Complex[] {
    if (a === 0) {
      const q = Solver.solveQuadratic(b, c, d);
      return [q.x1, q.x2];
    }

    // Depress the cubic: x = t - b / (3a) -> t^3 + p t + q = 0
    const p = (3 * a * c - b * b) / (3 * a * a);
    const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
    const shift = -b / (3 * a);

    const delta = (q * q) / 4 + (p * p * p) / 27;

    if (delta > 1e-12) {
      // 1 real root, 2 complex conjugates
      const u = Math.cbrt(-q / 2 + Math.sqrt(delta));
      const v = Math.cbrt(-q / 2 - Math.sqrt(delta));
      const t1 = u + v;
      const realPart = -(u + v) / 2;
      const imagPart = ((u - v) * Math.sqrt(3)) / 2;

      return [
        new Complex(t1 + shift, 0),
        new Complex(realPart + shift, imagPart),
        new Complex(realPart + shift, -imagPart)
      ];
    } else if (Math.abs(delta) <= 1e-12) {
      // All real roots, at least 2 equal
      const u = Math.cbrt(-q / 2);
      return [
        new Complex(2 * u + shift, 0),
        new Complex(-u + shift, 0),
        new Complex(-u + shift, 0)
      ];
    } else {
      // 3 distinct real roots (Casus irreducibilis)
      const r = Math.sqrt(-(p * p * p) / 27);
      const phi = Math.acos(Math.max(-1, Math.min(1, -q / (2 * r))));
      const m = 2 * Math.cbrt(r);

      return [
        new Complex(m * Math.cos(phi / 3) + shift, 0),
        new Complex(m * Math.cos((phi + 2 * Math.PI) / 3) + shift, 0),
        new Complex(m * Math.cos((phi + 4 * Math.PI) / 3) + shift, 0)
      ];
    }
  }

  /**
   * General non-linear equation root finder: f(x) = 0 using Newton-Raphson / Secant
   */
  static solveGeneral(
    f: (x: number) => number,
    initialGuess: number = 0,
    tol: number = 1e-9,
    maxIter: number = 100
  ): number {
    let x = initialGuess;
    const h = 1e-5;

    for (let iter = 0; iter < maxIter; iter++) {
      const y = f(x);
      if (Math.abs(y) < tol) return x;

      const dy = (f(x + h) - f(x - h)) / (2 * h);
      if (Math.abs(dy) < 1e-12) {
        // Flat derivative, take small step
        x += (Math.random() - 0.5) * 0.1;
        continue;
      }

      const nextX = x - y / dy;
      if (Math.abs(nextX - x) < tol) return nextX;
      x = nextX;
    }

    return x;
  }
}
