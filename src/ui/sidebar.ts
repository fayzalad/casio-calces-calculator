import { store } from '../state/store';
import { templatesToText } from '../math/templates';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Wide screens only (CSS hides it below 1100px): live history and memory next to the calculator. */
export function setupSidebar(): void {
  const aside = document.createElement('aside');
  aside.className = 'side-panel';
  aside.setAttribute('aria-label', 'History and memory');
  document.body.appendChild(aside);

  const render = () => {
    const vars = (['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'M'] as const)
      .map(k => `<div class="side-var"><b>${k}</b><span>${esc(String(Number(store.variables[k].toPrecision(10))))}</span></div>`)
      .join('');
    const hist = store.history.length
      ? store.history.slice(0, 30).map((h, i) => `
          <button class="side-hist" data-i="${i}">
            <span class="side-expr">${esc(templatesToText(h.expressionRaw))}</span>
            <span class="side-res">= ${esc(h.resultExact)}</span>
          </button>`).join('')
      : '<p class="side-empty">Your calculations will appear here. Click one to reuse it.</p>';
    aside.innerHTML = `
      <h2>History</h2><div class="side-list custom-scroll">${hist}</div>
      <h2>Memory</h2><div class="side-vars">${vars}</div>
      <p class="side-keys">Keyboard: digits, + - * / ^ ( ), Enter =, Backspace DEL, Esc AC, s c t l n r = sin cos tan log ln √, p = π, a = Ans</p>`;
  };

  aside.addEventListener('click', e => {
    const btn = (e.target as HTMLElement).closest('.side-hist') as HTMLElement | null;
    if (!btn) return;
    const h = store.history[Number(btn.dataset.i)];
    if (!h) return;
    store.clearAll();
    store.insertText(h.expressionRaw);
  });

  store.subscribe(render);
  render();
}
