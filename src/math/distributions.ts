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

  /**
   * Error function approximation
   */
  static erf(x: number): number {
    // Abramowitz and Stegun formula 7.1.26
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x);
    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

    return sign * y;
  }

  /**
   * Standard Normal CDF: Phi(z)
   */
  static stdNormalCDF(z: number): number {
    return 0.5 * (1 + Distributions.erf(z / Math.SQRT2));
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

    let z = 0;
    const q = area - 0.5;

    if (Math.abs(q) <= 0.42) {
      const r = q * q;
      z =
        (q *
          (((((a[1] * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * r + a[6])) /
        ((((((b[1] * r + b[2]) * r + b[3]) * r + b[4]) * r + b[5]) * r + 1.0));
    } else {
      const r = area < 0.5 ? area : 1.0 - area;
      const s = Math.log(-Math.log(r));
      let t =
        c[1] +
        s *
          (c[2] +
            s *
              (c[3] +
                s *
                  (c[4] +
                    s * (c[5] + s * c[6]))));
      const u =
        1.0 +
        s *
          (d[1] +
            s *
              (d[2] +
                s *
                  (d[3] +
                    s * d[4])));
      z = t / u;
      if (area < 0.5) z = -z;
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
