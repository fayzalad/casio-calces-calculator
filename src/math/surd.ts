/**
 * Surd simplification, prime factorization (FACT), and exact radical recognition
 */

export interface PrimeFactor {
  prime: number;
  exponent: number;
}

export class Surd {
  /**
   * Represents a * sqrt(b) / c
   */
  readonly coeff: number; // a
  readonly radicand: number; // b
  readonly denom: number; // c

  constructor(coeff: number, radicand: number = 1, denom: number = 1) {
    if (radicand < 0) {
      throw new Error('Math ERROR: Negative square root in real mode');
    }

    if (denom === 0) {
      throw new Error('Math ERROR: Division by zero');
    }

    // Simplify sqrt(radicand): pull out square factors
    let r = Math.round(radicand);
    let c = coeff;
    let d = denom;

    if (r === 0) {
      this.coeff = 0;
      this.radicand = 1;
      this.denom = 1;
      return;
    }

    let factor = 2;
    while (factor * factor <= r) {
      while (r % (factor * factor) === 0) {
        c *= factor;
        r /= (factor * factor);
      }
      factor++;
    }

    // Simplify gcd(c, d)
    const g = Surd.gcd(Math.abs(Math.round(c)), Math.abs(Math.round(d)));
    c /= g;
    d /= g;

    if (d < 0) {
      c = -c;
      d = -d;
    }

    this.coeff = c;
    this.radicand = r;
    this.denom = d;
  }

  static gcd(a: number, b: number): number {
    while (b !== 0) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  static primeFactorization(n: number): PrimeFactor[] {
    let val = Math.abs(Math.round(n));
    if (val <= 1) return [];

    const factors: PrimeFactor[] = [];
    let d = 2;

    while (d * d <= val) {
      let count = 0;
      while (val % d === 0) {
        count++;
        val /= d;
      }
      if (count > 0) {
        factors.push({ prime: d, exponent: count });
      }
      d = d === 2 ? 3 : d + 2;
    }

    if (val > 1) {
      factors.push({ prime: val, exponent: 1 });
    }

    return factors;
  }

  static formatPrimeFactors(n: number): string {
    const factors = Surd.primeFactorization(n);
    if (factors.length === 0) return n.toString();
    return factors
      .map(f => f.exponent > 1 ? `${f.prime}^${f.exponent}` : `${f.prime}`)
      .join(' × ');
  }

  toNumber(): number {
    return (this.coeff * Math.sqrt(this.radicand)) / this.denom;
  }

  toString(): string {
    if (this.coeff === 0) return '0';

    let numStr = '';
    if (this.radicand === 1) {
      numStr = `${this.coeff}`;
    } else if (this.coeff === 1) {
      numStr = `√${this.radicand}`;
    } else if (this.coeff === -1) {
      numStr = `-√${this.radicand}`;
    } else {
      numStr = `${this.coeff}√${this.radicand}`;
    }

    if (this.denom === 1) return numStr;
    return `${numStr}/${this.denom}`;
  }

  /**
   * Attempt to identify exact surd/pi representation for a floating point number
   */
  static tryRecognizeExact(val: number, eps = 1e-10): string | null {
    if (!Number.isFinite(val)) return null;
    if (Math.abs(val) < eps) return '0';

    const sign = val < 0 ? '-' : '';
    const absVal = Math.abs(val);

    // Integer
    if (Math.abs(absVal - Math.round(absVal)) < eps) {
      return (sign ? '-' : '') + Math.round(absVal).toString();
    }

    // Rational fraction check
    for (let d = 2; d <= 64; d++) {
      const n = Math.round(absVal * d);
      if (Math.abs(absVal - n / d) < eps) {
        return `${sign}${n}/${d}`;
      }
    }

    // sqrt(n) / d check for small n and d
    for (let d = 1; d <= 12; d++) {
      const targetR = Math.round((absVal * d) ** 2);
      if (targetR > 0 && targetR <= 200) {
        const testVal = Math.sqrt(targetR) / d;
        if (Math.abs(absVal - testVal) < eps) {
          const s = new Surd(1, targetR, d);
          return `${sign}${s.toString()}`;
        }
      }
    }

    // pi multiples check: n * pi / d
    const piVal = absVal / Math.PI;
    for (let d = 1; d <= 24; d++) {
      const n = Math.round(piVal * d);
      if (Math.abs(piVal - n / d) < eps && n > 0) {
        if (d === 1) {
          return n === 1 ? `${sign}π` : `${sign}${n}π`;
        }
        return n === 1 ? `${sign}π/${d}` : `${sign}${n}π/${d}`;
      }
    }

    // sqrt(n) * pi / d check
    for (let d = 1; d <= 12; d++) {
      const targetR = Math.round(((piVal * d) ** 2));
      if (targetR > 0 && targetR <= 50) {
        if (Math.abs(piVal - Math.sqrt(targetR) / d) < eps) {
          const s = new Surd(1, targetR, d);
          return `${sign}${s.toString()}π`;
        }
      }
    }

    return null;
  }
}
