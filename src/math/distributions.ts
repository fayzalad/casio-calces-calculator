/**
 * Probability distributions: Normal, Binomial, Poisson
 */

export class Distributions {
  /**
   * Normal Probability Density: f(x) = (1 / (sigma * sqrt(2pi))) * exp(-0.5 * ((x - mu) / sigma)^2)
   */
  static normalPD(x: number, mu: number = 0, sigma: number = 1): number {
    if (sigma <= 0) throw new Error('Math ERROR: Standard deviation must be > 0');
    const z = (x - mu) / sigma;
    return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
  }

  /** Error function: Taylor series for small |x|, erfc continued fraction beyond (about 1e-15 accurate). */
  static erf(x: number): number {
    const ax = Math.abs(x);
    if (ax >= 2.5) return x < 0 ? Distributions.erfc(ax) - 1 : 1 - Distributions.erfc(ax);
    let term = ax;
    let sum = ax;
    for (let n = 1; n < 80; n++) {
      term *= -(ax * ax) / n;
      const add = term / (2 * n + 1);
      sum += add;
      if (Math.abs(add) < 1e-17) break;
    }
    const r = (2 / Math.sqrt(Math.PI)) * sum;
    return x < 0 ? -r : r;
  }

  /** Complementary error function, accurate in the tails. */
  static erfc(x: number): number {
    if (x < 0) return 2 - Distributions.erfc(-x);
    if (x < 2.5) return 1 - Distributions.erf(x);
    let f = x;
    for (let k = 80; k >= 1; k--) f = x + k / 2 / f;
    return Math.exp(-x * x) / Math.sqrt(Math.PI) / f;
  }

  /**
   * Standard Normal CDF: Phi(z)
   */
  static stdNormalCDF(z: number): number {
    return 0.5 * Distributions.erfc(-z / Math.SQRT2);
  }

  /**
   * Normal Cumulative Distribution: P(lower <= X <= upper)
   */
  static normalCD(lower: number, upper: number, mu: number = 0, sigma: number = 1): number {
    if (sigma <= 0) throw new Error('Math ERROR: Standard deviation must be > 0');
    const zLower = (lower - mu) / sigma;
    const zUpper = (upper - mu) / sigma;
    return Distributions.stdNormalCDF(zUpper) - Distributions.stdNormalCDF(zLower);
  }

  /**
   * Inverse Normal: finds x such that P(X <= x) = area
   */
  static invNormal(area: number, mu: number = 0, sigma: number = 1): number {
    if (area <= 0 || area >= 1) throw new Error('Math ERROR: Area must be between 0 and 1');
    if (sigma <= 0) throw new Error('Math ERROR: Standard deviation must be > 0');

    // Rational approximation for inverse normal (Beasley-Springer-Moro)
    const a = [
      0,
      -3.969683028665376e1,
      2.209460984245205e2,
      -2.759285104469687e2,
      1.383577518672690e2,
      -3.066479806614716e1,
      2.506628277459239
    ];
    const b = [
      0,
      -5.447609879822406e1,
      1.615858368580409e2,
      -1.556989798598866e2,
      6.680131188771972e1,
      -1.328068155288572e1
    ];
    const c = [
      0,
      -7.784894002430293e-3,
      -3.223964580411365e-1,
      -2.400758277161838,
      -2.549732539343734,
      4.374664141464968,
      2.938163982698783
    ];
    const d = [
      0,
      7.784695709041462e-3,
      3.224671290700398e-1,
      2.445134137142996,
      3.754408661907416
    ];

    // Acklam's rational approximation: central region and the two tails
    const pLow = 0.02425;
    let z = 0;
    if (area < pLow || area > 1 - pLow) {
      const r = Math.sqrt(-2 * Math.log(area < 0.5 ? area : 1 - area));
      z =
        (((((c[1] * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) * r + c[6]) /
        ((((d[1] * r + d[2]) * r + d[3]) * r + d[4]) * r + 1);
      if (area > 0.5) z = -z;
    } else {
      const q = area - 0.5;
      const r = q * q;
      z =
        (((((a[1] * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * r + a[6]) * q /
        (((((b[1] * r + b[2]) * r + b[3]) * r + b[4]) * r + b[5]) * r + 1);
    }
    // Two Halley steps against the CDF bring it to full precision
    for (let i = 0; i < 2; i++) {
      const e = Distributions.stdNormalCDF(z) - area;
      const u = e * Math.sqrt(2 * Math.PI) * Math.exp((z * z) / 2);
      z -= u / (1 + (z * u) / 2);
    }

    return mu + z * sigma;
  }

  /**
   * Binomial Probability: P(X = k) = nCk * p^k * (1 - p)^(n - k)
   */
  static binomialPD(k: number, n: number, p: number): number {
    if (p < 0 || p > 1) throw new Error('Math ERROR: Probability p must be in [0, 1]');
    if (k < 0 || k > n || !Number.isInteger(k) || !Number.isInteger(n)) return 0;

    // Log-gamma based computation for numerical stability
    let logCoeff = 0;
    for (let i = 1; i <= k; i++) {
      logCoeff += Math.log(n - k + i) - Math.log(i);
    }
    const logProb = logCoeff + k * Math.log(p) + (n - k) * Math.log(1 - p);
    return Math.exp(logProb);
  }

  /**
   * Binomial Cumulative Distribution: P(X <= k)
   */
  static binomialCD(k: number, n: number, p: number): number {
    let total = 0;
    for (let i = 0; i <= Math.floor(k); i++) {
      total += Distributions.binomialPD(i, n, p);
    }
    return Math.min(1, Math.max(0, total));
  }

  /**
   * Poisson Probability: P(X = k) = (lambda^k * e^-lambda) / k!
   */
  static poissonPD(k: number, lambda: number): number {
    if (lambda <= 0) throw new Error('Math ERROR: Lambda must be > 0');
    if (k < 0 || !Number.isInteger(k)) return 0;

    let logProb = -lambda + k * Math.log(lambda);
    for (let i = 1; i <= k; i++) {
      logProb -= Math.log(i);
    }
    return Math.exp(logProb);
  }

  /**
   * Poisson Cumulative Distribution: P(X <= k)
   */
  static poissonCD(k: number, lambda: number): number {
    let total = 0;
    for (let i = 0; i <= Math.floor(k); i++) {
      total += Distributions.poissonPD(i, lambda);
    }
    return Math.min(1, Math.max(0, total));
  }
}
