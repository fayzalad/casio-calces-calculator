/**
 * Vector operations (2D and 3D)
 */

export class Vector {
  readonly elements: number[];

  constructor(elements: number[]) {
    if (elements.length !== 2 && elements.length !== 3) {
      throw new Error('Dimension ERROR: Vectors must be 2D or 3D');
    }
    this.elements = [...elements];
  }

  get dim(): number {
    return this.elements.length;
  }

  add(other: Vector): Vector {
    if (this.dim !== other.dim) throw new Error('Dimension ERROR');
    return new Vector(this.elements.map((v, i) => v + other.elements[i]));
  }

  sub(other: Vector): Vector {
    if (this.dim !== other.dim) throw new Error('Dimension ERROR');
    return new Vector(this.elements.map((v, i) => v - other.elements[i]));
  }

  mul(scalar: number): Vector {
    return new Vector(this.elements.map(v => v * scalar));
  }

  dot(other: Vector): number {
    if (this.dim !== other.dim) throw new Error('Dimension ERROR');
    return this.elements.reduce((sum, v, i) => sum + v * other.elements[i], 0);
  }

  cross(other: Vector): Vector {
    if (this.dim !== 3 || other.dim !== 3) {
      throw new Error('Dimension ERROR: Cross product requires 3D vectors');
    }
    const [a1, a2, a3] = this.elements;
    const [b1, b2, b3] = other.elements;
    return new Vector([
      a2 * b3 - a3 * b2,
      a3 * b1 - a1 * b3,
      a1 * b2 - a2 * b1
    ]);
  }

  norm(): number {
    return Math.sqrt(this.elements.reduce((sum, v) => sum + v * v, 0));
  }

  unit(): Vector {
    const n = this.norm();
    if (n === 0) throw new Error('Math ERROR: Zero vector has no unit vector');
    return this.mul(1 / n);
  }

  angleWith(other: Vector, inDegrees: boolean = true): number {
    const dot = this.dot(other);
    const denom = this.norm() * other.norm();
    if (denom === 0) throw new Error('Math ERROR: Cannot compute angle with zero vector');
    const cosTheta = Math.max(-1, Math.min(1, dot / denom));
    const rad = Math.acos(cosTheta);
    return inDegrees ? (rad * 180) / Math.PI : rad;
  }
}
