/**
 * Matrix calculation engine (1x1 to 4x4)
 */

export class Matrix {
  readonly rows: number;
  readonly cols: number;
  readonly data: number[][];

  constructor(rows: number, cols: number, data?: number[][]) {
    this.rows = rows;
    this.cols = cols;
    if (data) {
      this.data = data.map(r => [...r]);
    } else {
      this.data = Array.from({ length: rows }, () => Array(cols).fill(0));
    }
  }

  static identity(n: number): Matrix {
    const m = new Matrix(n, n);
    for (let i = 0; i < n; i++) {
      m.data[i][i] = 1;
    }
    return m;
  }

  get(r: number, c: number): number {
    return this.data[r][c];
  }

  set(r: number, c: number, val: number): void {
    this.data[r][c] = val;
  }

  add(other: Matrix): Matrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error('Dimension ERROR');
    }
    const result = new Matrix(this.rows, this.cols);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        result.data[r][c] = this.data[r][c] + other.data[r][c];
      }
    }
    return result;
  }

  sub(other: Matrix): Matrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error('Dimension ERROR');
    }
    const result = new Matrix(this.rows, this.cols);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        result.data[r][c] = this.data[r][c] - other.data[r][c];
      }
    }
    return result;
  }

  mul(other: Matrix | number): Matrix {
    if (typeof other === 'number') {
      const result = new Matrix(this.rows, this.cols);
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          result.data[r][c] = this.data[r][c] * other;
        }
      }
      return result;
    }

    if (this.cols !== other.rows) {
      throw new Error('Dimension ERROR');
    }

    const result = new Matrix(this.rows, other.cols);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < other.cols; c++) {
        let sum = 0;
        for (let k = 0; k < this.cols; k++) {
          sum += this.data[r][k] * other.data[k][c];
        }
        result.data[r][c] = sum;
      }
    }
    return result;
  }

  transpose(): Matrix {
    const result = new Matrix(this.cols, this.rows);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        result.data[c][r] = this.data[r][c];
      }
    }
    return result;
  }

  det(): number {
    if (this.rows !== this.cols) {
      throw new Error('Dimension ERROR: Square matrix required');
    }
    const n = this.rows;
    if (n === 1) return this.data[0][0];
    if (n === 2) {
      return this.data[0][0] * this.data[1][1] - this.data[0][1] * this.data[1][0];
    }
    if (n === 3) {
      const d = this.data;
      return (
        d[0][0] * (d[1][1] * d[2][2] - d[1][2] * d[2][1]) -
        d[0][1] * (d[1][0] * d[2][2] - d[1][2] * d[2][0]) +
        d[0][2] * (d[1][0] * d[2][1] - d[1][1] * d[2][0])
      );
    }

    // LU decomposition for 4x4 or higher
    const a = this.data.map(r => [...r]);
    let det = 1;
    for (let i = 0; i < n; i++) {
      let pivot = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(a[j][i]) > Math.abs(a[pivot][i])) pivot = j;
      }
      if (Math.abs(a[pivot][i]) < 1e-12) return 0;
      if (pivot !== i) {
        [a[i], a[pivot]] = [a[pivot], a[i]];
        det = -det;
      }
      det *= a[i][i];
      for (let j = i + 1; j < n; j++) {
        const factor = a[j][i] / a[i][i];
        for (let k = i + 1; k < n; k++) {
          a[j][k] -= factor * a[i][k];
        }
      }
    }
    return det;
  }

  inverse(): Matrix {
    if (this.rows !== this.cols) {
      throw new Error('Dimension ERROR: Square matrix required');
    }
    const d = this.det();
    if (Math.abs(d) < 1e-12) {
      throw new Error('Math ERROR: Singular matrix has no inverse');
    }

    const n = this.rows;
    // Gauss-Jordan elimination on augmented matrix [A | I]
    const aug = this.data.map((r, i) => {
      const row = [...r];
      for (let j = 0; j < n; j++) row.push(i === j ? 1 : 0);
      return row;
    });

    for (let i = 0; i < n; i++) {
      let pivot = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(aug[j][i]) > Math.abs(aug[pivot][i])) pivot = j;
      }
      if (pivot !== i) [aug[i], aug[pivot]] = [aug[pivot], aug[i]];

      const diag = aug[i][i];
      for (let k = 0; k < 2 * n; k++) aug[i][k] /= diag;

      for (let j = 0; j < n; j++) {
        if (j !== i) {
          const factor = aug[j][i];
          for (let k = 0; k < 2 * n; k++) {
            aug[j][k] -= factor * aug[i][k];
          }
        }
      }
    }

    const result = new Matrix(n, n);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        result.data[r][c] = aug[r][c + n];
      }
    }
    return result;
  }

  pow(exponent: number): Matrix {
    if (this.rows !== this.cols) throw new Error('Dimension ERROR');
    if (!Number.isInteger(exponent) || exponent < -1) {
      throw new Error('Math ERROR: Matrix power must be an integer >= -1');
    }
    if (exponent === -1) return this.inverse();
    if (exponent === 0) return Matrix.identity(this.rows);

    let res = Matrix.identity(this.rows);
    let base: Matrix = this;
    let exp = exponent;

    while (exp > 0) {
      if (exp % 2 === 1) res = res.mul(base);
      base = base.mul(base);
      exp = Math.floor(exp / 2);
    }
    return res;
  }
}
