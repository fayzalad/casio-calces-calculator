/**
 * BASE-N Mode: Decimal, Hexadecimal, Binary, and Octal arithmetic
 */

export type BaseSystem = 'DEC' | 'HEX' | 'BIN' | 'OCT';

export class BaseN {
  static format(val: number, base: BaseSystem, bits: 16 | 32 = 32): string {
    let intVal = Math.round(val);
    const mask = bits === 16 ? 0xffff : 0xffffffff;
    const unsignedVal = (intVal >>> 0) & mask;

    switch (base) {
      case 'DEC':
        return intVal.toString(10);
      case 'HEX':
        return unsignedVal.toString(16).toUpperCase();
      case 'BIN':
        return unsignedVal.toString(2);
      case 'OCT':
        return unsignedVal.toString(8);
    }
  }

  static parse(str: string, base: BaseSystem): number {
    const clean = str.trim();
    switch (base) {
      case 'DEC':
        return parseInt(clean, 10);
      case 'HEX':
        return parseInt(clean, 16);
      case 'BIN':
        return parseInt(clean, 2);
      case 'OCT':
        return parseInt(clean, 8);
    }
  }

  static and(a: number, b: number): number {
    return (Math.round(a) & Math.round(b)) | 0;
  }

  static or(a: number, b: number): number {
    return (Math.round(a) | Math.round(b)) | 0;
  }

  static xor(a: number, b: number): number {
    return (Math.round(a) ^ Math.round(b)) | 0;
  }

  static xnor(a: number, b: number): number {
    return (~(Math.round(a) ^ Math.round(b))) | 0;
  }

  static not(a: number): number {
    return (~Math.round(a)) | 0;
  }

  static neg(a: number): number {
    return (-Math.round(a)) | 0;
  }
}
