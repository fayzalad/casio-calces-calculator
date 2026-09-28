/**
 * High-precision exact fraction and rational number arithmetic
 */

export class Fraction {
  readonly num: bigint;
  readonly den: bigint;

  constructor(num: bigint | number, den: bigint | number = 1n) {
    let n = typeof num === 'bigint' ? num : BigInt(Math.round(num));
    let d = typeof den === 'bigint' ? den : BigInt(Math.round(den));

    if (d === 0n) {
      throw new Error('Math ERROR: Division by zero');
    }

    if (d < 0n) {
      n = -n;
      d = -d;
    }

    const g = Fraction.gcdBigInt(Fraction.absBigInt(n), d);
    this.num = n / g;
    this.den = d / g;
  }

  static fromNumber(val: number, maxDenominator: number = 1000000): Fraction {
    if (!Number.isFinite(val)) {
      throw new Error('Math ERROR: Non-finite value');
    }

    if (Number.isInteger(val)) {
      return new Fraction(BigInt(val), 1n);
    }

    // Continued fraction expansion to find best rational approximation
    const sign = val < 0 ? -1n : 1n;
    let x = Math.abs(val);

    let h1 = 1n, h2 = 0n;
    let k1 = 0n, k2 = 1n;
    let b = x;

    for (let i = 0; i < 30; i++) {
      const a = BigInt(Math.floor(b));
      const h = a * h1 + h2;
      const k = a * k1 + k2;

      if (k > BigInt(maxDenominator)) break;

      h2 = h1; h1 = h;
      k2 = k1; k1 = k;

      const diff = b - Number(a);
      if (Math.abs(diff) < 1e-12) break;
      b = 1 / diff;
    }

    return new Fraction(sign * h1, k1);
  }

  static gcdBigInt(a: bigint, b: bigint): bigint {
    while (b !== 0n) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  static lcmBigInt(a: bigint, b: bigint): bigint {
    if (a === 0n || b === 0n) return 0n;
    return Fraction.absBigInt((a * b) / Fraction.gcdBigInt(a, b));
  }

  static absBigInt(n: bigint): bigint {
    return n < 0n ? -n : n;
  }

  add(other: Fraction): Fraction {
    return new Fraction(
      this.num * other.den + other.num * this.den,
      this.den * other.den
    );
  }

  sub(other: Fraction): Fraction {
    return new Fraction(
      this.num * other.den - other.num * this.den,
      this.den * other.den
    );
  }

  mul(other: Fraction): Fraction {
    return new Fraction(this.num * other.num, this.den * other.den);
  }

  div(other: Fraction): Fraction {
    if (other.num === 0n) {
      throw new Error('Math ERROR: Division by zero');
    }
    return new Fraction(this.num * other.den, this.den * other.num);
  }

  pow(exponent: number): Fraction | number {
    if (!Number.isInteger(exponent)) {
      return Math.pow(this.toNumber(), exponent);
    }
    if (exponent === 0) return new Fraction(1n, 1n);
    if (exponent > 0 && exponent <= 100) {
      const exp = BigInt(exponent);
      return new Fraction(this.num ** exp, this.den ** exp);
    }
    if (exponent < 0 && exponent >= -100) {
      const exp = BigInt(-exponent);
      return new Fraction(this.den ** exp, this.num ** exp);
    }
    return Math.pow(this.toNumber(), exponent);
  }

  neg(): Fraction {
    return new Fraction(-this.num, this.den);
  }

  inv(): Fraction {
    if (this.num === 0n) throw new Error('Math ERROR: Division by zero');
    return new Fraction(this.den, this.num);
  }

  toNumber(): number {
    return Number(this.num) / Number(this.den);
  }

  isInteger(): boolean {
    return this.den === 1n;
  }

  toMixedString(): string {
    if (this.den === 1n) return this.num.toString();
    const isNeg = this.num < 0n;
    const absNum = Fraction.absBigInt(this.num);
    const whole = absNum / this.den;
    const rem = absNum % this.den;

    if (whole === 0n) {
      return `${this.num}/${this.den}`;
    }
    return `${isNeg ? '-' : ''}${whole} ⌟ ${rem}/${this.den}`;
  }

  toString(): string {
    if (this.den === 1n) return this.num.toString();
    return `${this.num}/${this.den}`;
  }
}
