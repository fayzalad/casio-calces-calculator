import { store } from '../state/store';
import { CASIO_CONSTANTS } from '../math/constants';
import { CASIO_CONVERSIONS } from '../math/conversions';
import { templatesToText } from '../math/templates';
import { CalculatorMode, AngleUnit, UITheme, DisplayFormat } from '../types/calculator';

export function setupDrawersAndModals(): void {
  setupBackdropClose();
  setupModeModal();
  setupVariableModal();
  setupConstantsModal();
  setupConversionsModal();
  setupHistoryDrawer();
  setupSettingsModal();
}

function setupBackdropClose(): void {
  const overlays = document.querySelectorAll<HTMLElement>('.modal-overlay, .drawer-overlay');
  overlays.forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.add('hidden');
      }
    });
  });
}

function setupModeModal(): void {
  const modal = document.getElementById('mode-modal');
  if (!modal) return;

  const modes: { id: CalculatorMode; num: number; name: string }[] = [
    { id: 'COMP', num: 1, name: 'COMP (General Math)' },
    { id: 'CMPLX', num: 2, name: 'CMPLX (Complex Numbers)' },
    { id: 'STAT', num: 3, name: 'STAT (Statistics & Regression)' },
    { id: 'BASE_N', num: 4, name: 'BASE-N (Dec, Hex, Bin, Oct)' },
    { id: 'EQN', num: 5, name: 'EQN (Equation Solver)' },
    { id: 'MATRIX', num: 6, name: 'MATRIX (Linear Algebra)' },
    { id: 'TABLE', num: 7, name: 'TABLE (Function Table)' },
    { id: 'VECTOR', num: 8, name: 'VECTOR (2D & 3D Vectors)' },
    { id: 'DISTR', num: 9, name: 'DISTR (Distributions)' },
    { id: 'GRAPH', num: 10, name: 'GRAPH (2D Function Plotter)' }
  ];

  const list = modal.querySelector('.mode-list');
  if (list) {
    list.innerHTML = modes
      .map(
        m => `
        <button class="mode-item" data-mode="${m.id}">
          <span class="mode-num">${m.num}:</span>
          <span class="mode-name">${m.name}</span>
        </button>
      `
      )
      .join('');

    list.querySelectorAll('.mode-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode') as CalculatorMode;
        store.setMode(mode);
        modal.classList.add('hidden');

        const graphPanel = document.getElementById('graph-panel');
        if (graphPanel) {
          if (mode === 'GRAPH') graphPanel.classList.remove('hidden');
          else graphPanel.classList.add('hidden');
        }
      });
    });
  }

  modal.querySelectorAll('.close-btn, .btn-done').forEach(btn => {
    btn.addEventListener('click', () => modal.classList.add('hidden'));
  });
}

function setupVariableModal(): void {
  const modal = document.getElementById('var-modal');
  if (!modal) return;

  const renderVars = () => {
    const grid = modal.querySelector('.vars-grid');
    if (!grid) return;

    const varKeys: ('A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'X' | 'Y' | 'M')[] = [
      'A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'M'
    ];

    grid.innerHTML = varKeys
      .map(
        k => `
        <div class="var-card">
          <div class="var-header">
            <span class="var-name">${k}</span>
            <span class="var-val">${store.variables[k]}</span>
          </div>
          <div class="var-actions">
            <button class="btn-sm btn-insert" data-var="${k}">Insert</button>
            <button class="btn-sm btn-store" data-var="${k}">STO → ${k}</button>
          </div>
        </div>
      `
      )
      .join('');

    grid.querySelectorAll('.btn-insert').forEach(b => {
      b.addEventListener('click', () => {
        const v = b.getAttribute('data-var')!;
        store.insertText(v);
        modal.classList.add('hidden');
      });
    });

    grid.querySelectorAll('.btn-store').forEach(b => {
      b.addEventListener('click', () => {
        const v = b.getAttribute('data-var') as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'X' | 'Y' | 'M';
        store.storeVariable(v);
        renderVars();
      });
    });
  };

  store.subscribe(renderVars);
  renderVars();

  modal.querySelector('.btn-clear-all')?.addEventListener('click', () => {
    store.clearVariables();
    renderVars();
  });

  modal.querySelectorAll('.close-btn, .btn-done').forEach(btn => {
    btn.addEventListener('click', () => modal.classList.add('hidden'));
  });
}

function setupConstantsModal(): void {
  const modal = document.getElementById('constants-modal');
  if (!modal) return;

  const list = modal.querySelector('.constants-list');
  const searchInput = modal.querySelector<HTMLInputElement>('.const-search');

  const renderList = (filter = '') => {
    if (!list) return;
    const f = filter.toLowerCase();
    const items = Object.values(CASIO_CONSTANTS).filter(
      c =>
        c.code.includes(f) ||
        c.name.toLowerCase().includes(f) ||
        c.symbol.toLowerCase().includes(f)
    );

    list.innerHTML = items
      .map(
        c => `
        <button class="const-item" data-val="${c.value}">
          <div class="const-info">
            <span class="const-code">${c.code}: ${c.symbol}</span>
            <span class="const-name">${c.name}</span>
          </div>
          <span class="const-val">${c.value.toExponential(4)} ${c.unit}</span>
        </button>
      `
      )
      .join('');

    list.querySelectorAll('.const-item').forEach(b => {
      b.addEventListener('click', () => {
        const val = b.getAttribute('data-val')!;
        // constants carry exponents like 6.626e-34; the calculator's exponent key is ᴇ
        store.insertText(val.replace('e', 'ᴇ'));
        modal.classList.add('hidden');
      });
    });
  };

  searchInput?.addEventListener('input', () => renderList(searchInput.value));
  renderList();

  modal.querySelectorAll('.close-btn, .btn-done').forEach(btn => {
    btn.addEventListener('click', () => modal.classList.add('hidden'));
  });
}

function setupConversionsModal(): void {
  const modal = document.getElementById('conversions-modal');
  if (!modal) return;

  const list = modal.querySelector('.conversions-list');
  const searchInput = modal.querySelector<HTMLInputElement>('.conv-search');

  const renderList = (filter = '') => {
    if (!list) return;
    const f = filter.toLowerCase();
    const items = Object.values(CASIO_CONVERSIONS).filter(
      c =>
        c.code.includes(f) ||
        c.label.toLowerCase().includes(f)
    );

    list.innerHTML = items
      .map(
        c => `
        <button class="conv-item" data-code="${c.code}">
          <span class="conv-code">${c.code}</span>
          <span class="conv-label">${c.label}</span>
        </button>
      `
      )
      .join('');

    list.querySelectorAll('.conv-item').forEach(b => {
      b.addEventListener('click', () => {
        const code = b.getAttribute('data-code')!;
        const conv = CASIO_CONVERSIONS[code];
        if (conv) {
          const currentVal = store.justEvaluated ? store.variables.Ans : parseFloat(store.expression) || 1;
          const converted = conv.convert(currentVal);
          store.expression = `${currentVal}`;
          store.cursorPos = store.expression.length;
          store.resultExact = converted.toString();
          store.resultDecimal = converted.toString();
          store.variables.PreAns = store.variables.Ans;
          store.variables.Ans = converted;
          store.justEvaluated = true;
          store.notify();
        }
        modal.classList.add('hidden');
      });
    });
  };

  searchInput?.addEventListener('input', () => renderList(searchInput.value));
  renderList();

  modal.querySelectorAll('.close-btn, .btn-done').forEach(btn => {
    btn.addEventListener('click', () => modal.classList.add('hidden'));
  });
}

function setupHistoryDrawer(): void {
  const drawer = document.getElementById('history-drawer');
  if (!drawer) return;

  const renderHistory = () => {
    const list = drawer.querySelector('.history-list');
    if (!list) return;

    if (store.history.length === 0) {
      list.innerHTML = `<div class="empty-msg" style="padding: 20px; color: #9ca3af; text-align: center;">No calculation history yet.</div>`;
      return;
    }

    list.innerHTML = store.history
      .map(
        h => `
        <div class="history-card" data-expr="${h.expressionRaw}" data-res="${h.resultExact}">
          <div class="hist-expr">${templatesToText(h.expressionDisplay)}</div>
          <div class="hist-res">= ${h.resultExact}</div>
        </div>
      `
      )
      .join('');

    list.querySelectorAll('.history-card').forEach(c => {
      c.addEventListener('click', () => {
        const expr = c.getAttribute('data-expr')!;
        store.expression = expr;
        store.cursorPos = expr.length;
        store.evaluateExpression(false);
        drawer.classList.add('hidden');
      });
    });
  };

  store.subscribe(renderHistory);
  renderHistory();

  drawer.querySelector('.btn-clear-hist')?.addEventListener('click', () => {
    store.history = [];
    renderHistory();
  });

  drawer.querySelectorAll('.close-btn, .btn-done').forEach(btn => {
    btn.addEventListener('click', () => drawer.classList.add('hidden'));
  });
}

function setupSettingsModal(): void {
  const modal = document.getElementById('settings-modal');
  if (!modal) return;

  const themeSelect = modal.querySelector<HTMLSelectElement>('#setting-theme');
  const angleSelect = modal.querySelector<HTMLSelectElement>('#setting-angle');
  const soundToggle = modal.querySelector<HTMLInputElement>('#setting-sound');
  const hapticToggle = modal.querySelector<HTMLInputElement>('#setting-haptics');

  if (themeSelect) {
    themeSelect.value = store.settings.theme;
    themeSelect.addEventListener('change', () => {
      store.setTheme(themeSelect.value as UITheme);
    });
  }

  if (angleSelect) {
    angleSelect.value = store.settings.angleUnit;
    angleSelect.addEventListener('change', () => {
      store.setAngleUnit(angleSelect.value as AngleUnit);
    });
  }

  const formatSelect = modal.querySelector<HTMLSelectElement>('#setting-format');
  const digitsSelect = modal.querySelector<HTMLSelectElement>('#setting-digits');
  const digitsRow = modal.querySelector<HTMLElement>('#setting-digits-row');
  const applyDisplay = () => {
    if (!formatSelect || !digitsSelect) return;
    const fmt = formatSelect.value as DisplayFormat;
    if (digitsRow) digitsRow.style.display = fmt === 'FIX' || fmt === 'SCI' ? '' : 'none';
    store.setDisplayFormat(fmt, parseInt(digitsSelect.value, 10));
  };
  if (formatSelect && digitsSelect) {
    formatSelect.value = store.settings.displayFormat;
    digitsSelect.value = String(store.settings.fixDigits);
    if (digitsRow) {
      digitsRow.style.display =
        store.settings.displayFormat === 'FIX' || store.settings.displayFormat === 'SCI' ? '' : 'none';
    }
    formatSelect.addEventListener('change', applyDisplay);
    digitsSelect.addEventListener('change', applyDisplay);
  }

  if (soundToggle) {
    soundToggle.checked = store.settings.soundEnabled;
    soundToggle.addEventListener('change', () => {
      store.settings.soundEnabled = soundToggle.checked;
      store.notify();
    });
  }

  if (hapticToggle) {
    hapticToggle.checked = store.settings.hapticsEnabled;
    hapticToggle.addEventListener('change', () => {
      store.settings.hapticsEnabled = hapticToggle.checked;
      store.notify();
    });
  }

  modal.querySelectorAll('.close-btn, .btn-done').forEach(btn => {
    btn.addEventListener('click', () => modal.classList.add('hidden'));
  });
}
