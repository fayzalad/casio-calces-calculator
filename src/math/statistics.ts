/**
 * Statistical analysis and 2-Variable Regression models
 */

export interface Stat1VarResult {
  n: number;
  mean: number;
  sumX: number;
  sumX2: number;
  sigmaX: number; // population std dev
  sX: number; // sample std dev
  minX: number;
  q1: number;
  median: number;
  q3: number;
  maxX: number;
}

export interface RegressionResult {
  type: 'linear' | 'quadratic' | 'logarithmic' | 'exponential' | 'power' | 'inverse';
  a: number;
  b: number;
  c?: number; // for quadratic
  r?: number; // correlation
  r2: number; // coefficient of determination
  predictY: (x: number) => number;
  predictX?: (y: number) => number;
}

export class Statistics {
  static analyze1Var(data: number[]): Stat1VarResult {
    const n = data.length;
    if (n === 0) throw new Error('Stat ERROR: No data');

    const sorted = [...data].sort((a, b) => a - b);
    const sumX = sorted.reduce((acc, v) => acc + v, 0);
    const sumX2 = sorted.reduce((acc, v) => acc + v * v, 0);
    const mean = sumX / n;

    const variancePop = sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
    const sigmaX = Math.sqrt(variancePop);
    const sX = n > 1 ? Math.sqrt((variancePop * n) / (n - 1)) : 0;

    const minX = sorted[0];
    const maxX = sorted[n - 1];

    const getPercentile = (p: number) => {
      const idx = (n - 1) * p;
      const lower = Math.floor(idx);
      const frac = idx - lower;
      if (lower + 1 < n) {
        return sorted[lower] + frac * (sorted[lower + 1] - sorted[lower]);
      }
      return sorted[lower];
    };

    const q1 = getPercentile(0.25);
    const median = getPercentile(0.5);
    const q3 = getPercentile(0.75);

    return { n, mean, sumX, sumX2, sigmaX, sX, minX, q1, median, q3, maxX };
  }

  static linearRegression(x: number[], y: number[]): RegressionResult {
    const n = x.length;
    if (n !== y.length || n < 2) throw new Error('Stat ERROR: Insufficient pairs');

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumX2 += x[i] * x[i];
      sumY2 += y[i] * y[i];
    }

    const denom = n * sumX2 - sumX * sumX;
    if (Math.abs(denom) < 1e-12) throw new Error('Stat ERROR: Collinear data');

    const b = (n * sumXY - sumX * sumY) / denom;
    const a = (sumY - b * sumX) / n;

    const numR = n * sumXY - sumX * sumY;
    const denR = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const r = denR !== 0 ? numR / denR : 0;

    return {
      type: 'linear',
      a,
      b,
      r,
      r2: r * r,
      predictY: (xVal: number) => a + b * xVal,
      predictX: (yVal: number) => (b !== 0 ? (yVal - a) / b : NaN)
    };
  }

  static quadraticRegression(x: number[], y: number[]): RegressionResult {
    const n = x.length;
    if (n !== y.length || n < 3) throw new Error('Stat ERROR: At least 3 pairs required');

    let sx = 0, sx2 = 0, sx3 = 0, sx4 = 0, sy = 0, sxy = 0, sx2y = 0;
    for (let i = 0; i < n; i++) {
      const xi = x[i];
      const yi = y[i];
      const xi2 = xi * xi;
      sx += xi;
      sx2 += xi2;
      sx3 += xi2 * xi;
      sx4 += xi2 * xi2;
      sy += yi;
      sxy += xi * yi;
      sx2y += xi2 * yi;
    }

    // Solve 3x3 linear system for a, b, c in y = a + bx + cx^2
    const A = [
      [n, sx, sx2],
      [sx, sx2, sx3],
      [sx2, sx3, sx4]
    ];
    const B = [sy, sxy, sx2y];

    // Cramer's rule / 3x3 solver
    const det = (m: number[][]) =>
      m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
      m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
      m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

    const D = det(A);
    if (Math.abs(D) < 1e-12) throw new Error('Stat ERROR: Singular matrix');

    const replaceCol = (m: number[][], col: number, vec: number[]) => {
      return m.map((row, r) => row.map((val, c) => (c === col ? vec[r] : val)));
    };

    const a = det(replaceCol(A, 0, B)) / D;
    const b = det(replaceCol(A, 1, B)) / D;
    const c = det(replaceCol(A, 2, B)) / D;

    // R2 computation
    const yMean = sy / n;
    const ssTot = y.reduce((acc, yi) => acc + (yi - yMean) ** 2, 0);
    const ssRes = y.reduce((acc, yi, i) => acc + (yi - (a + b * x[i] + c * x[i] ** 2)) ** 2, 0);
    const r2 = ssTot !== 0 ? Math.max(0, 1 - ssRes / ssTot) : 1;

    return {
      type: 'quadratic',
      a,
      b,
      c,
      r2,
      predictY: (xVal: number) => a + b * xVal + c * xVal * xVal
    };
  }

  static exponentialRegression(x: number[], y: number[]): RegressionResult {
    // y = a * e^(bx) -> ln(y) = ln(a) + b * x
    const valid = y.every(v => v > 0);
    if (!valid) throw new Error('Stat ERROR: Exponential requires positive Y values');

    const lnY = y.map(v => Math.log(v));
    const lin = Statistics.linearRegression(x, lnY);

    const a = Math.exp(lin.a);
    const b = lin.b;

    return {
      type: 'exponential',
      a,
      b,
      r: lin.r,
      r2: lin.r2,
      predictY: (xVal: number) => a * Math.exp(b * xVal),
      predictX: (yVal: number) => (yVal > 0 && b !== 0 ? Math.log(yVal / a) / b : NaN)
    };
  }
}
