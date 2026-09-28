import { Fraction } from './src/math/fraction.ts';
import { Surd } from './src/math/surd.ts';
import { Complex } from './src/math/complex.ts';
import { Calculus } from './src/math/calculus.ts';
import { Matrix } from './src/math/matrix.ts';
import { Solver } from './src/math/solver.ts';
import { Evaluator } from './src/math/evaluator.ts';
import { CASIO_CONSTANTS } from './src/math/constants.ts';
import { CASIO_CONVERSIONS } from './src/math/conversions.ts';

console.log('--- TESTING FRACTIONS ---');
const f1 = new Fraction(1n, 2n);
const f2 = new Fraction(1n, 3n);
const fSum = f1.add(f2);
console.log('1/2 + 1/3 =', fSum.toString());
if (fSum.toString() !== '5/6') throw new Error('Fraction addition failed');

console.log('--- TESTING SURDS & FACT ---');
const s = new Surd(1, 12);
console.log('sqrt(12) =', s.toString());
const fact120 = Surd.formatPrimeFactors(120);
console.log('FACT(120) =', fact120);
if (fact120 !== '2^3 × 3 × 5') throw new Error('Prime factorization failed');

console.log('--- TESTING CALCULUS ---');
// Integral of sin(x) from 0 to pi/3 = 1 - cos(pi/3) = 1 - 0.5 = 0.5
const intRes = Calculus.integrate(Math.sin, 0, Math.PI / 3);
console.log('int_0^(pi/3) sin(x) dx =', intRes);
if (Math.abs(intRes - 0.5) > 1e-5) throw new Error('Integration failed');

console.log('--- TESTING MATRICES ---');
const m = new Matrix(2, 2, [[1, 2], [3, 4]]);
console.log('det([[1,2],[3,4]]) =', m.det());
if (m.det() !== -2) throw new Error('Matrix determinant failed');

console.log('--- TESTING SOLVER ---');
const q = Solver.solveQuadratic(1, -5, 6);
console.log('x^2 - 5x + 6 = 0 roots:', q.x1.re, q.x2.re);
if (Math.abs(q.x1.re - 3) > 1e-5 || Math.abs(q.x2.re - 2) > 1e-5) {
  throw new Error('Quadratic solver failed');
}

console.log('--- TESTING EVALUATOR ---');
const vars = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, X: 5, Y: 0, M: 0, Ans: 0, PreAns: 0 };
const eval1 = Evaluator.evaluate('2*X + 3', vars, 'DEG');
console.log('2*X + 3 with X=5:', eval1);
if (eval1.decimal !== '13') throw new Error('Evaluator failed');

const evalTrig = Evaluator.evaluate('sin(30)', vars, 'DEG');
console.log('sin(30 deg):', evalTrig);
if (evalTrig.decimal !== '0.5') throw new Error('Trig evaluation failed');

console.log('--- TESTING CONSTANTS & CONVERSIONS COUNT ---');
console.log('Constants count:', Object.keys(CASIO_CONSTANTS).length);
console.log('Conversions count:', Object.keys(CASIO_CONVERSIONS).length);
if (Object.keys(CASIO_CONSTANTS).length !== 40) throw new Error('Missing constants');
if (Object.keys(CASIO_CONVERSIONS).length !== 40) throw new Error('Missing conversions');

console.log('ALL TESTS PASSED SUCCESSFULLY! ✅');
