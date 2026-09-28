/**
 * Complex number arithmetic with Rectangular and Polar forms
 */

export class Complex {
  readonly re: number;
  readonly im: number;

  constructor(re: number = 0, im: number = 0) {
    this.re = Number.isFinite(re) ? re : 0;
    this.im = Number.isFinite(im) ? im : 0;
  }

  static fromPolar(r: number, thetaRad: number): Complex {
    return new Complex(r * Math.cos(thetaRad), r * Math.sin(thetaRad));
  }

  add(other: Complex): Complex {
    return new Complex(this.re + other.re, this.im + other.im);
  }

  sub(other: Complex): Complex {
    return new Complex(this.re - other.re, this.im - other.im);
  }

  mul(other: Complex): Complex {
    return new Complex(
      this.re * other.re - this.im * other.im,
      this.re * other.im + this.im * other.re
    );
  }

  div(other: Complex): Complex {
    const den = other.re * other.re + other.im * other.im;
    if (den === 0) {
      throw new Error('Math ERROR: Division by zero');
    }
    return new Complex(
      (this.re * other.re + this.im * other.im) / den,
      (this.im * other.re - this.re * other.im) / den
    );
  }

  abs(): number {
    return Math.hypot(this.re, this.im);
  }

  arg(): number {
    return Math.atan2(this.im, this.re);
  }

  conj(): Complex {
    return new Complex(this.re, -this.im);
  }

  pow(exponent: number | Complex): Complex {
    if (typeof exponent === 'number') {
      const r = this.abs();
      const theta = this.arg();
      const newR = Math.pow(r, exponent);
      const newTheta = theta * exponent;
      return Complex.fromPolar(newR, newTheta);
    } else {
      // z^w = exp(w * ln(z))
      return this.ln().mul(exponent).exp();
    }
  }

  exp(): Complex {
    const expRe = Math.exp(this.re);
    return new Complex(expRe * Math.cos(this.im), expRe * Math.sin(this.im));
  }

  ln(): Complex {
    return new Complex(Math.log(this.abs()), this.arg());
  }

  sin(): Complex {
    return new Complex(
      Math.sin(this.re) * Math.cosh(this.im),
      Math.cos(this.re) * Math.sinh(this.im)
    );
  }

  cos(): Complex {
    return new Complex(
      Math.cos(this.re) * Math.cosh(this.im),
      -Math.sin(this.re) * Math.sinh(this.im)
    );
  }

  tan(): Complex {
    return this.sin().div(this.cos());
  }

  toRectangularString(precision: number = 10): string {
    const r = Number(this.re.toPrecision(precision));
    const i = Number(this.im.toPrecision(precision));

    if (i === 0) return `${r}`;
    if (r === 0) return i === 1 ? 'i' : i === -1 ? '-i' : `${i}i`;

    const sign = i > 0 ? '+' : '-';
    const absI = Math.abs(i);
    const iPart = absI === 1 ? 'i' : `${absI}i`;
    return `${r} ${sign} ${iPart}`;
  }

  toPolarString(angleUnit: 'DEG' | 'RAD' | 'GRA' = 'DEG', precision: number = 8): string {
    const r = Number(this.abs().toPrecision(precision));
    let theta = this.arg();

    if (angleUnit === 'DEG') {
      theta = (theta * 180) / Math.PI;
    } else if (angleUnit === 'GRA') {
      theta = (theta * 200) / Math.PI;
    }

    const t = Number(theta.toPrecision(precision));
    return `${r} ∠ ${t}°`;
  }
}
