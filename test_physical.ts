// Behaviour tests: does the calculator act like the physical fx-991ES?  Run: npx vite-node test_physical.ts
import { Evaluator } from './src/math/evaluator.ts';
import { store } from './src/state/store.ts';

const vars: any = { A: 3, B: 0, C: 0, D: 0, E: 0, F: 0, X: 0, Y: 0, M: 0, Ans: 1e-7, PreAns: 0 };
let bad = 0;
const check = (label: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? 'ok  ' : 'FAIL', label, ok ? '' : `got ${JSON.stringify(got)}`);
};
const ev = (e: string) => {
  try { const r = Evaluator.evaluate(e, vars, 'DEG'); return `${r.exact}|${r.decimal}`; } catch (x: any) { return 'ERR ' + x.message; }
};

const cases: [string, string][] = [
  ['sin(180)', '0|0'], ['cos(90)', '0|0'], ['tan(45)', '1|1'], ['sin(30)', '1/2|0.5'], ['-2^2', '-4|-4'],
  ['2^-2', '1/4|0.25'], ['Ans+1', '1.0000001|1.0000001'], ['5 mod 3', '2|2'], ['A mod 2', '1|1'],
  ['6÷2(1+2)', '1|1'], ['(1+2', '3|3'], ['integrate(X^2,0,3)', '9|9'], ['5 nPr 2', '20|20'],
  ['2π', '2π|6.283185307'], ['0.5+0.25', '0.75|0.75'], ['1÷3', '1/3|0.3333333333'], ['√2', '√2|1.414213562'],
  ['ln(e)', '1|1'], ['log(1000)', '3|3'], ['0.1+0.2', '0.3|0.3'], ['5ᴇ3', '5000|5000'], ['1÷4ᴇ2', '1/400|2.5 × 10^-3'],
  ['sinh(0)', '0|0'], ['10%', '1/10|0.1'], ['5!', '120|120'], ['3×-2', '-6|-6'], ['2(3)+4(5)', '26|26'],
];
for (const [e, want] of cases) { const got = ev(e); check(`${e} = ${want}`, got === want, got); }
for (const e of ['tan(90)', '1÷0', 'ln(0)', '3+', '*3', 'sin(']) check(`${e} errors`, ev(e).startsWith('ERR'), ev(e));

// Display modes
Evaluator.setDisplay('FIX', 2);
check('FIX 2: 1÷3 -> 0.33', Evaluator.formatNumber(1 / 3) === '0.33', Evaluator.formatNumber(1 / 3));
Evaluator.setDisplay('SCI', 3);
check('SCI 3: 12345 -> 1.23 × 10^4', Evaluator.formatNumber(12345) === '1.23 × 10^4', Evaluator.formatNumber(12345));
Evaluator.setDisplay('NORM1', 2);
check('NORM1: 0.005 -> 5 × 10^-3', Evaluator.formatNumber(0.005) === '5 × 10^-3', Evaluator.formatNumber(0.005));
check('NORM1: 0.05 stays decimal', Evaluator.formatNumber(0.05) === '0.05');
check('ENG: 12345 -> 12.345 × 10^3', Evaluator.toEngineering(12345) === '12.345 × 10^3');

// Keypad flow on the store
const press = (...t: string[]) => t.forEach(x => store.insertText(x));
store.clearAll(); store.clearVariables();
press('2', '+', '3'); store.evaluateExpression(true);
check('2+3 = 5', store.resultDecimal === '5', store.resultDecimal);
press('×', '4'); store.evaluateExpression(true);
check('operator after = continues from Ans (5×4=20)', store.resultDecimal === '20', store.resultDecimal);
press('7'); store.evaluateExpression(true);
check('digit after = starts new entry', store.resultDecimal === '7', store.resultDecimal);
store.clearAll(); press('s'); store.insertText('sin('); press('3', '0', ')');
store.deleteBack();
store.clearAll(); store.insertText('sin('); store.deleteBack();
check('DEL removes whole "sin("', store.expression === '', store.expression);
store.clearAll(); press('1', '+', '1'); store.evaluateExpression(true);
store.clearAll(); press('2', '×', '2'); store.evaluateExpression(true);
store.historyUp(); check('up arrow -> latest calc', store.expression === '2×2', store.expression);
store.historyUp(); check('up again -> older calc', store.expression === '1+1', store.expression);
store.historyDown(); check('down returns to newer', store.expression === '2×2', store.expression);
store.clearAll(); press('1', '÷', '3'); store.evaluateExpression(true); store.addToMemory();
check('M+ keeps full precision', Math.abs(store.variables.M - 1 / 3) < 1e-12, store.variables.M);

// Stacked fractions
store.clearAll(); store.clearVariables();
store.insertText('1'); store.insertFraction();
check('1 then fraction key -> ⟨1¦⟩ cursor in denominator', store.expression === '⟨1¦⟩' && store.cursorPos === 3, [store.expression, store.cursorPos]);
store.insertText('2'); store.moveCursorRight(); store.insertText('+');
store.insertText('1'); store.insertFraction(); store.insertText('3'); store.evaluateExpression(true);
check('1/2 + 1/3 = 5/6 via templates', store.resultExact === '5/6', [store.expression, store.resultExact]);
store.clearAll(); store.insertFraction();
check('fraction key on empty -> cursor in numerator', store.expression === '⟨¦⟩' && store.cursorPos === 1, [store.expression, store.cursorPos]);
store.deleteBack();
check('DEL on empty fraction removes it', store.expression === '', store.expression);
store.clearAll(); store.insertText('3'); store.insertFraction(); store.deleteBack();
check('DEL in empty denominator dissolves to numerator', store.expression === '3' && store.cursorPos === 1, [store.expression, store.cursorPos]);
store.clearAll(); store.insertText('2'); store.insertFraction(); store.insertText('4'); store.moveCursorRight(); store.insertText('×3');
store.evaluateExpression(true);
check('⟨2¦4⟩×3 = 3/2', store.resultExact === '3/2', store.resultExact);
store.clearAll(); store.insertText('1'); store.insertFraction(); store.insertText('1'); store.insertFraction(); store.insertText('2');
store.evaluateExpression(true);
check('nested ⟨1¦⟨1¦2⟩⟩ = 2', store.resultExact === '2', [store.expression, store.resultExact]);
store.clearAll(); store.insertText('5ᴇ'); store.insertText('3'); store.insertFraction();
check('fraction key grabs whole 5ᴇ3 as numerator', store.expression === '⟨5ᴇ3¦⟩', store.expression);

console.log(bad ? `\n${bad} FAILED` : '\nall passed');
process.exit(bad ? 1 : 0);
