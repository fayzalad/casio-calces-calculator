import { store } from './state/store';
import { renderKeypad } from './ui/keypad';
import { DisplayRenderer } from './display/renderer';
import { setupDrawersAndModals } from './ui/drawers';
import { GraphPlotter } from './graph/plotter';
import { sound } from './audio/sound';
import { Haptics } from './audio/haptics';
import { Evaluator } from './math/evaluator';

window.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Display Renderer
  const statusEl = document.getElementById('lcd-status');
  const exprEl = document.getElementById('lcd-expression');
  const resultEl = document.getElementById('lcd-result');

  if (statusEl && exprEl && resultEl) {
    new DisplayRenderer(statusEl, exprEl, resultEl);
  }

  // 2. Render Keypad
  const keypadContainer = document.getElementById('keypad');
  if (keypadContainer) {
    renderKeypad(keypadContainer);
  }

  // 3. Setup Modals, Drawers, and Settings
  setupDrawersAndModals();

  // 4. Setup Theme Switcher
  const casioThemeBtn = document.getElementById('theme-casio-btn');
  const calcesThemeBtn = document.getElementById('theme-calces-btn');

  const updateThemeButtons = () => {
    const isCasio = store.settings.theme === 'casio-classic';
    casioThemeBtn?.classList.toggle('active', isCasio);
    calcesThemeBtn?.classList.toggle('active', !isCasio);
    document.documentElement.setAttribute('data-theme', store.settings.theme);
  };

  casioThemeBtn?.addEventListener('click', () => {
    store.setTheme('casio-classic');
    updateThemeButtons();
  });

  calcesThemeBtn?.addEventListener('click', () => {
    store.setTheme('calces-dark');
    updateThemeButtons();
  });

  updateThemeButtons();

  // 5. Setup Quick Nav Bar Buttons
  const quickDegBtn = document.getElementById('quick-deg-btn');
  const updateDegPill = () => {
    if (quickDegBtn) quickDegBtn.textContent = store.settings.angleUnit;
  };

  quickDegBtn?.addEventListener('click', () => {
    const current = store.settings.angleUnit;
    const next = current === 'DEG' ? 'RAD' : current === 'RAD' ? 'GRA' : 'DEG';
    store.setAngleUnit(next);
    updateDegPill();
  });
  updateDegPill();
  store.subscribe(updateDegPill);

  document.getElementById('quick-hist-btn')?.addEventListener('click', () => {
    document.getElementById('history-drawer')?.classList.remove('hidden');
  });

  document.getElementById('quick-vars-btn')?.addEventListener('click', () => {
    document.getElementById('var-modal')?.classList.remove('hidden');
  });

  document.getElementById('quick-settings-btn')?.addEventListener('click', () => {
    document.getElementById('settings-modal')?.classList.remove('hidden');
  });

  // 6. Setup Grapher Canvas & Panel
  const graphPanel = document.getElementById('graph-panel');
  const graphCanvas = document.getElementById('graph-canvas') as HTMLCanvasElement;
  let plotter: GraphPlotter | null = null;

  if (graphCanvas) {
    plotter = new GraphPlotter(graphCanvas);

    const resizeGraph = () => {
      const rect = graphCanvas.parentElement?.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        plotter?.resize(rect.width, rect.height);
      }
    };

    window.addEventListener('resize', resizeGraph);

    const plotCurrentExpr = () => {
      const input = document.getElementById('graph-expr-input') as HTMLInputElement;
      const expr = input?.value || 'sin(x)';
      try {
        const fn = (xVal: number) => {
          const testVars = { ...store.variables, X: xVal, x: xVal };
          const res = Evaluator.evaluate(expr, testVars, store.settings.angleUnit);
          return typeof res.numericValue === 'number' ? res.numericValue : res.numericValue.re;
        };
        plotter?.setFunction(fn);
      } catch {
        // Ignored
      }
    };

    document.getElementById('graph-plot-btn')?.addEventListener('click', plotCurrentExpr);
    document.getElementById('graph-reset-btn')?.addEventListener('click', () => plotter?.resetView());

    document.getElementById('quick-graph-btn')?.addEventListener('click', () => {
      graphPanel?.classList.remove('hidden');
      setTimeout(resizeGraph, 50);
      plotCurrentExpr();
    });

    document.getElementById('graph-close-btn')?.addEventListener('click', () => {
      graphPanel?.classList.add('hidden');
    });
  }

  // 7. Physical Desktop Keyboard Support
  window.addEventListener('keydown', (e) => {
    // Ignore keystrokes when typing into text inputs
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    sound.playKeyClick();
    Haptics.lightClick();

    if (e.key >= '0' && e.key <= '9') {
      store.insertText(e.key);
      e.preventDefault();
    } else if (e.key === '.') {
      store.insertText('.');
      e.preventDefault();
    } else if (e.key === '+') {
      store.insertText('+');
      e.preventDefault();
    } else if (e.key === '-') {
      store.insertText('-');
      e.preventDefault();
    } else if (e.key === '*') {
      store.insertText('×');
      e.preventDefault();
    } else if (e.key === '/') {
      store.insertText('÷');
      e.preventDefault();
    } else if (e.key === '(' || e.key === ')') {
      store.insertText(e.key);
      e.preventDefault();
    } else if (e.key === '^') {
      store.insertText('^');
      e.preventDefault();
    } else if (e.key === 'Enter' || e.key === '=') {
      store.evaluateExpression(true);
      e.preventDefault();
    } else if (e.key === 'Backspace') {
      store.deleteBack();
      e.preventDefault();
    } else if (e.key === 'Escape') {
      store.clearAll();
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      store.moveCursorLeft();
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      store.moveCursorRight();
      e.preventDefault();
    } else if (e.key === 's') {
      store.insertText('sin(');
      e.preventDefault();
    } else if (e.key === 'c') {
      store.insertText('cos(');
      e.preventDefault();
    } else if (e.key === 't') {
      store.insertText('tan(');
      e.preventDefault();
    } else if (e.key === 'l') {
      store.insertText('log(');
      e.preventDefault();
    } else if (e.key === 'n') {
      store.insertText('ln(');
      e.preventDefault();
    } else if (e.key.toLowerCase() === 'x') {
      store.insertText('X');
      e.preventDefault();
    }
  });

  // 8. Register Service Worker for 100% Offline PWA capability
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
});
