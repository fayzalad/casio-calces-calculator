import { store } from '../state/store';
import { CalculatorMode } from '../types/calculator';
import { Evaluator } from '../math/evaluator';
import { Statistics } from '../math/statistics';
import { Matrix } from '../math/matrix';
import { Vector } from '../math/vector';
import { Solver } from '../math/solver';
import { Distributions } from '../math/distributions';
import { BaseN, BaseSystem } from '../math/baseN';

/** Modes that have their own screen. COMP and CMPLX use the main display; GRAPH has its own panel. */
type PanelMode = 'STAT' | 'BASE_N' | 'EQN' | 'MATRIX' | 'TABLE' | 'VECTOR' | 'DISTR';

interface Field { id: string; label: string; value: string; type?: 'text' | 'area' | 'select'; options?: string[] }
interface Panel {
  title: string;
  fields: Field[];
  run: (v: Record<string, string>) => string;
}

const num = (s: string): number => {
  const r = Evaluator.evaluate(s.trim(), store.variables, store.settings.angleUnit).numericValue;
  const n = typeof r === 'number' ? r : r.re;
  if (!Number.isFinite(n)) throw new Error('Math ERROR');
  return n;
};
/** "1, 2 3;4" -> [1,2,3,4]; entries may be expressions like 1/2 */
const list = (s: string): number[] =>
  s.split(/[\s,;]+/).filter(Boolean).map(num);
const fmt = (n: number): string => Evaluator.formatNumber(Number(n.toPrecision(12)));

const matrixFrom = (s: string): Matrix => {
  const rows = s.split(/[;\n]+/).map(r => r.trim()).filter(Boolean).map(list);
  if (rows.length === 0 || rows.length > 4 || rows.some(r => r.length !== rows[0].length || r.length > 4)) {
    throw new Error('Dimension ERROR');
  }
  return new Matrix(rows.length, rows[0].length, rows);
};
const matrixText = (m: Matrix): string => m.data.map(r => r.map(fmt).join('\t')).join('\n');

const complexText = (c: { re: number; im: number }): string =>
  c.im === 0 ? fmt(c.re) : `${fmt(c.re)} ${c.im < 0 ? '-' : '+'} ${fmt(Math.abs(c.im))}i`;

const PANELS: Record<PanelMode, Panel> = {
  STAT: {
    title: 'STAT  (statistics & regression)',
    fields: [
      { id: 'x', label: 'x data (comma, space or new line)', value: '1, 2, 3, 4, 5', type: 'area' },
      { id: 'y', label: 'y data (optional, same length; enables regression)', value: '2, 4, 5, 4, 5', type: 'area' },
      { id: 'reg', label: 'Regression', value: 'Linear', type: 'select', options: ['Linear', 'Quadratic', 'Logarithmic', 'Exponential', 'Power', 'Inverse'] },
      { id: 'pred', label: 'Predict y at x = (optional)', value: '' }
    ],
    run: v => {
      const x = list(v.x);
      if (x.length === 0) throw new Error('Syntax ERROR');
      const s = Statistics.analyze1Var(x);
      let out =
        `n = ${s.n}\nx̄ = ${fmt(s.mean)}\nΣx = ${fmt(s.sumX)}\nΣx² = ${fmt(s.sumX2)}\n` +
        `σx = ${fmt(s.sigmaX)}\nsx = ${fmt(s.sX)}\nminX = ${fmt(s.minX)}\nQ1 = ${fmt(s.q1)}\n` +
        `Med = ${fmt(s.median)}\nQ3 = ${fmt(s.q3)}\nmaxX = ${fmt(s.maxX)}`;
      const y = v.y.trim() ? list(v.y) : [];
      if (y.length) {
        if (y.length !== x.length) throw new Error('Dimension ERROR');
        const r = v.reg === 'Quadratic' ? Statistics.quadraticRegression(x, y)
          : v.reg === 'Exponential' ? Statistics.exponentialRegression(x, y)
          : v.reg === 'Logarithmic' ? Statistics.logarithmicRegression(x, y)
          : v.reg === 'Power' ? Statistics.powerRegression(x, y)
          : v.reg === 'Inverse' ? Statistics.inverseRegression(x, y)
          : Statistics.linearRegression(x, y);
        out += `\n\n${v.reg} regression\na = ${fmt(r.a)}\nb = ${fmt(r.b)}`;
        if (r.c !== undefined) out += `\nc = ${fmt(r.c)}`;
        if (r.r !== undefined) out += `\nr = ${fmt(r.r)}`;
        out += `\nR² = ${fmt(r.r2)}`;
        if (v.pred.trim()) out += `\nŷ(${v.pred.trim()}) = ${fmt(r.predictY(num(v.pred)))}`;
      }
      return out;
    }
  },

  BASE_N: {
    title: 'BASE-N',
    fields: [
      { id: 'a', label: 'Number A', value: '255' },
      { id: 'base', label: 'A is in', value: 'DEC', type: 'select', options: ['DEC', 'HEX', 'BIN', 'OCT'] },
      { id: 'op', label: 'Operation', value: 'none', type: 'select', options: ['none', '+', '-', '×', '÷', 'AND', 'OR', 'XOR', 'XNOR', 'NOT A', 'Neg A'] },
      { id: 'b', label: 'Number B (same base)', value: '1' }
    ],
    run: v => {
      const base = v.base as BaseSystem;
      let a = BaseN.parse(v.a.trim(), base);
      const b = v.b.trim() ? BaseN.parse(v.b.trim(), base) : 0;
      switch (v.op) {
        case '+': a = a + b; break;
        case '-': a = a - b; break;
        case '×': a = a * b; break;
        case '÷': if (b === 0) throw new Error('Math ERROR'); a = Math.trunc(a / b); break;
        case 'AND': a = BaseN.and(a, b); break;
        case 'OR': a = BaseN.or(a, b); break;
        case 'XOR': a = BaseN.xor(a, b); break;
        case 'XNOR': a = BaseN.xnor(a, b); break;
        case 'NOT A': a = BaseN.not(a); break;
        case 'Neg A': a = BaseN.neg(a); break;
      }
      return (['DEC', 'HEX', 'BIN', 'OCT'] as BaseSystem[]).map(b2 => `${b2}  ${BaseN.format(a, b2)}`).join('\n');
    }
  },

  EQN: {
    title: 'EQN  (equations)',
    fields: [
      { id: 'type', label: 'Type', value: 'Quadratic  ax²+bx+c=0',
        type: 'select', options: ['Simultaneous 2 unknowns', 'Simultaneous 3 unknowns', 'Quadratic  ax²+bx+c=0', 'Cubic  ax³+bx²+cx+d=0', 'Solve f(x)=0'] },
      { id: 'c', label: 'Coefficients (rows separated by ; for simultaneous, last number of each row is the constant)', value: '1, -3, 2', type: 'area' },
      { id: 'guess', label: 'Start guess (Solve f(x)=0 only, f uses X)', value: '1' }
    ],
    run: v => {
      if (v.type.startsWith('Simultaneous')) {
        const n = v.type.includes('3') ? 3 : 2;
        const rows = v.c.split(/[;\n]+/).map(r => list(r)).filter(r => r.length);
        if (rows.length !== n || rows.some(r => r.length !== n + 1)) throw new Error('Dimension ERROR');
        const sol = Solver.solveLinearSystem(rows.map(r => r.slice(0, n)), rows.map(r => r[n]));
        return sol.map((s, i) => `${'xyz'[i]} = ${fmt(s)}`).join('\n');
      }
      if (v.type.startsWith('Quadratic')) {
        const [a, b, c] = list(v.c);
        if (c === undefined || a === 0) throw new Error('Syntax ERROR');
        const q = Solver.solveQuadratic(a, b, c);
        return `x1 = ${complexText(q.x1)}\nx2 = ${complexText(q.x2)}\nvertex = (${fmt(q.vertexX)}, ${fmt(q.vertexY)})`;
      }
      if (v.type.startsWith('Cubic')) {
        const [a, b, c, d] = list(v.c);
        if (d === undefined || a === 0) throw new Error('Syntax ERROR');
        return Solver.solveCubic(a, b, c, d).map((r, i) => `x${i + 1} = ${complexText(r)}`).join('\n');
      }
      const expr = v.c.trim();
      const f = (x: number) => num(expr.replace(/(?<![A-Za-z])X(?![A-Za-z])/gi, `(${x})`).replace(/(\d)\(/g, '$1×('));
      const root = Solver.solveGeneral(f, num(v.guess));
      if (Math.abs(f(root)) > 1e-6) throw new Error("Can't Solve");
      return `X = ${fmt(root)}\nL-R = ${fmt(f(root))}`;
    }
  },

  MATRIX: {
    title: 'MATRIX  (up to 4×4)',
    fields: [
      { id: 'a', label: 'MatA (rows separated by ;)', value: '1 2; 3 4', type: 'area' },
      { id: 'b', label: 'MatB', value: '5 6; 7 8', type: 'area' },
      { id: 'op', label: 'Operation', value: 'A × B',
        type: 'select', options: ['A + B', 'A - B', 'A × B', 'Det A', 'Trn A', 'A⁻¹', 'A ^ n (n below)', 'Identity (size = n)'] },
      { id: 'n', label: 'n', value: '2' }
    ],
    run: v => {
      const A = matrixFrom(v.a);
      switch (v.op) {
        case 'A + B': return matrixText(A.add(matrixFrom(v.b)));
        case 'A - B': return matrixText(A.sub(matrixFrom(v.b)));
        case 'A × B': return matrixText(A.mul(matrixFrom(v.b)));
        case 'Det A': return `Det A = ${fmt(A.det())}`;
        case 'Trn A': return matrixText(A.transpose());
        case 'A⁻¹': return matrixText(A.inverse());
        case 'Identity (size = n)': return matrixText(Matrix.identity(num(v.n)));
        default: return matrixText(A.pow(num(v.n)));
      }
    }
  },

  TABLE: {
    title: 'TABLE',
    fields: [
      { id: 'f', label: 'f(X) =', value: 'X^2 - 4' },
      { id: 'g', label: 'g(X) = (optional)', value: '2X' },
      { id: 'range', label: 'Start, End, Step', value: '-3, 3, 1' }
    ],
    run: v => {
      const [start, end, step] = list(v.range);
      if (step === undefined || step === 0 || (end - start) / step < 0 || (end - start) / step > 44) throw new Error('Range ERROR');
      const at = (e: string, x: number) =>
        fmt(num(e.replace(/(?<![A-Za-z])X(?![A-Za-z])/gi, `(${x})`).replace(/(\d)\(/g, '$1×(')));
      const rows = ['X\tf(X)' + (v.g.trim() ? '\tg(X)' : '')];
      for (let i = 0; i <= Math.round((end - start) / step); i++) {
        const x = Number((start + i * step).toPrecision(12));
        rows.push(`${fmt(x)}\t${at(v.f, x)}${v.g.trim() ? '\t' + at(v.g, x) : ''}`);
      }
      return rows.join('\n');
    }
  },

  VECTOR: {
    title: 'VECTOR  (2D / 3D)',
    fields: [
      { id: 'a', label: 'VctA (2 or 3 numbers)', value: '1, 2, 3' },
      { id: 'b', label: 'VctB', value: '4, 5, 6' },
      { id: 'op', label: 'Operation', value: 'A · B (dot)',
        type: 'select', options: ['A + B', 'A - B', 'A · B (dot)', 'A × B (cross)', 'Abs(A)', 'Unit A', 'Angle(A,B)'] }
    ],
    run: v => {
      const A = new Vector(list(v.a));
      const show = (x: Vector) => `[ ${x.elements.map(fmt).join(', ')} ]`;
      switch (v.op) {
        case 'A + B': return show(A.add(new Vector(list(v.b))));
        case 'A - B': return show(A.sub(new Vector(list(v.b))));
        case 'A · B (dot)': return fmt(A.dot(new Vector(list(v.b))));
        case 'A × B (cross)': return show(A.cross(new Vector(list(v.b))));
        case 'Abs(A)': return fmt(A.norm());
        case 'Unit A': return show(A.unit());
        default: return `${fmt(A.angleWith(new Vector(list(v.b))))}°`;
      }
    }
  },

  DISTR: {
    title: 'DISTR  (distributions)',
    fields: [
      { id: 'fn', label: 'Function', value: 'Normal CD', type: 'select',
        options: ['Normal PD', 'Normal CD', 'Inverse Normal', 'Binomial PD', 'Binomial CD', 'Poisson PD', 'Poisson CD'] },
      { id: 'p', label: 'Normal PD: x, σ, μ · Normal CD: lower, upper, σ, μ · InvN: area, σ, μ · Binomial: x, N, p · Poisson: x, λ', value: '-1, 1, 1, 0', type: 'area' }
    ],
    run: v => {
      const p = list(v.p);
      const need = (n: number) => { if (p.length < n) throw new Error('Syntax ERROR'); };
      switch (v.fn) {
        case 'Normal PD': need(1); return fmt(Distributions.normalPD(p[0], p[2] ?? 0, p[1] ?? 1));
        case 'Normal CD': need(2); return fmt(Distributions.normalCD(p[0], p[1], p[3] ?? 0, p[2] ?? 1));
        case 'Inverse Normal': need(1); return fmt(Distributions.invNormal(p[0], p[2] ?? 0, p[1] ?? 1));
        case 'Binomial PD': need(3); return fmt(Distributions.binomialPD(p[0], p[1], p[2]));
        case 'Binomial CD': need(3); return fmt(Distributions.binomialCD(p[0], p[1], p[2]));
        case 'Poisson PD': need(2); return fmt(Distributions.poissonPD(p[0], p[1]));
        default: need(2); return fmt(Distributions.poissonCD(p[0], p[1]));
      }
    }
  }
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function ensureOverlay(): HTMLElement {
  let el = document.getElementById('mode-panel');
  if (!el) {
    el = document.createElement('div');
    el.id = 'mode-panel';
    el.className = 'modal-overlay hidden';
    document.body.appendChild(el);
  }
  return el;
}

function openPanel(mode: PanelMode): void {
  const def = PANELS[mode];
  const el = ensureOverlay();
  el.dataset.mode = mode;
  el.innerHTML = `
    <div class="modal-card mode-card">
      <div class="modal-header">
        <h3>${esc(def.title)}</h3>
        <button class="btn-close-modal close-btn" aria-label="Close">✕</button>
      </div>
      <div class="mode-fields custom-scroll">
        ${def.fields.map(f => `
          <label class="mode-field"><span>${esc(f.label)}</span>
          ${f.type === 'select'
            ? `<select data-id="${f.id}">${f.options!.map(o => `<option${o === f.value ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`
            : f.type === 'area'
              ? `<textarea data-id="${f.id}" rows="2" spellcheck="false">${esc(f.value)}</textarea>`
              : `<input data-id="${f.id}" value="${esc(f.value)}" spellcheck="false" autocomplete="off">`}
          </label>`).join('')}
        <pre class="mode-result" aria-live="polite"></pre>
      </div>
      <div class="modal-footer">
        <button class="btn-sm mode-calc">Calculate</button>
        <button class="btn-done">Done</button>
      </div>
    </div>`;

  const out = el.querySelector('.mode-result') as HTMLElement;
  const run = () => {
    const vals: Record<string, string> = {};
    el.querySelectorAll<HTMLInputElement>('[data-id]').forEach(i => (vals[i.dataset.id!] = i.value));
    Evaluator.setDisplay(store.settings.displayFormat, store.settings.fixDigits);
    try {
      out.classList.remove('error');
      out.textContent = def.run(vals);
    } catch (e) {
      out.classList.add('error');
      out.textContent = (e as Error).message || 'Syntax ERROR';
    }
  };
  el.querySelector('.mode-calc')!.addEventListener('click', run);
  el.querySelectorAll('input, select, textarea').forEach(i => i.addEventListener('input', run));
  const close = () => {
    el.classList.add('hidden');
    if (store.mode === mode) store.setMode('COMP');
  };
  el.querySelectorAll('.close-btn, .btn-done').forEach(b => b.addEventListener('click', close));
  el.classList.remove('hidden');
  run();
}

/** Opens the mode's own screen whenever the calculator is switched into it (menu, SHIFT+number keys). */
export function setupModePanels(): void {
  if (store.mode in PANELS) store.mode = 'COMP'; // a saved panel mode would otherwise never re-open
  let last: CalculatorMode = store.mode;
  store.subscribe(() => {
    if (store.mode === last) return;
    last = store.mode;
    const el = document.getElementById('mode-panel');
    if (el && !(store.mode in PANELS)) el.classList.add('hidden');
    if (store.mode in PANELS) openPanel(store.mode as PanelMode);
  });
}
