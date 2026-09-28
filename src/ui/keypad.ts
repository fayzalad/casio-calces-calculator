import { store } from '../state/store';
import { sound } from '../audio/sound';
import { Haptics } from '../audio/haptics';
import { KeyModifier } from '../types/calculator';

export interface KeyDefinition {
  id: string;
  primary: string;
  primaryDisplay?: string;
  shift?: string;
  shiftDisplay?: string;
  alpha?: string;
  alphaDisplay?: string;
  second?: string;
  secondDisplay?: string;
  action: (mod: KeyModifier) => void;
  cssClass?: string;
}

export const KEY_DEFINITIONS: KeyDefinition[] = [
  // --- ROW 1 ---
  {
    id: 'key_shift',
    primary: 'SHIFT',
    action: () => store.setModifier('SHIFT'),
    cssClass: 'btn-shift'
  },
  {
    id: 'key_alpha',
    primary: 'ALPHA',
    action: () => store.setModifier('ALPHA'),
    cssClass: 'btn-alpha'
  },
  {
    id: 'key_left',
    primary: '←',
    action: () => store.moveCursorLeft(),
    cssClass: 'btn-nav'
  },
  {
    id: 'key_right',
    primary: '→',
    action: () => store.moveCursorRight(),
    cssClass: 'btn-nav'
  },
  {
    id: 'key_mode',
    primary: 'MODE',
    shift: 'SETUP',
    action: (mod) => {
      const modeModal = document.getElementById('mode-modal');
      if (modeModal) modeModal.classList.toggle('hidden');
    },
    cssClass: 'btn-function'
  },
  {
    id: 'key_2nd',
    primary: '2nd',
    action: () => store.setModifier('SECOND'),
    cssClass: 'btn-2nd'
  },

  // --- ROW 2 ---
  {
    id: 'key_calc',
    primary: 'CALC',
    shift: 'SOLVE',
    alpha: '=',
    action: (mod) => {
      if (mod === 'SHIFT') {
        // SOLVE: Prompt or execute equation solver
        store.evaluateExpression(true);
      } else if (mod === 'ALPHA') {
        store.insertText('=');
      } else {
        store.evaluateExpression(true);
      }
    }
  },
  {
    id: 'key_int',
    primary: '∫dx',
    shift: 'd/dx',
    alpha: ':',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText('diff(');
      else if (mod === 'ALPHA') store.insertText(':');
      else store.insertText('integrate(');
    }
  },
  {
    id: 'key_up',
    primary: '▲',
    action: () => {
      if (store.history.length > 0) {
        store.expression = store.history[0].expressionRaw;
        store.cursorPos = store.expression.length;
        store.notify();
      }
    },
    cssClass: 'btn-nav'
  },
  {
    id: 'key_down',
    primary: '▼',
    action: () => {
      if (store.history.length > 1) {
        store.expression = store.history[1].expressionRaw;
        store.cursorPos = store.expression.length;
        store.notify();
      }
    },
    cssClass: 'btn-nav'
  },
  {
    id: 'key_inv',
    primary: 'x⁻¹',
    shift: 'x!',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText('!');
      else store.insertText('^-1');
    }
  },
  {
    id: 'key_logax',
    primary: 'Log_a x',
    shift: 'Σ',
    alpha: 'Π',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText('sum(');
      else if (mod === 'ALPHA') store.insertText('prod(');
      else store.insertText('log(');
    }
  },

  // --- ROW 3 ---
  {
    id: 'key_frac',
    primary: '■/□',
    shift: 'a b/c',
    alpha: '÷R',
    action: (mod) => {
      if (mod === 'ALPHA') store.insertText(' mod ');
      else store.insertText('/');
    }
  },
  {
    id: 'key_sqrt',
    primary: '√',
    shift: '∛',
    alpha: 'mod',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText('cbrt(');
      else if (mod === 'ALPHA') store.insertText(' mod ');
      else store.insertText('sqrt(');
    }
  },
  {
    id: 'key_sq',
    primary: 'x²',
    shift: 'x³',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText('^3');
      else store.insertText('^2');
    }
  },
  {
    id: 'key_pow',
    primary: 'x^□',
    shift: '□√□',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText('^(1/');
      else store.insertText('^');
    }
  },
  {
    id: 'key_log',
    primary: 'Log',
    shift: '10^x',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText('10^(');
      else store.insertText('log(');
    }
  },
  {
    id: 'key_ln',
    primary: 'Ln',
    shift: 'e^x',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText('e^(');
      else store.insertText('ln(');
    }
  },

  // --- ROW 4 ---
  {
    id: 'key_minus_sign',
    primary: '(-)',
    shift: '∠',
    alpha: 'A',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText('∠');
      else if (mod === 'ALPHA') store.insertText('A');
      else store.insertText('-');
    }
  },
  {
    id: 'key_dms',
    primary: "° ' ''",
    shift: 'FACT',
    alpha: 'B',
    action: (mod) => {
      if (mod === 'SHIFT') store.primeFactorizeResult();
      else if (mod === 'ALPHA') store.insertText('B');
      else store.insertText('°');
    }
  },
  {
    id: 'key_hyp',
    primary: 'hyp',
    shift: 'Abs',
    alpha: 'C',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText('abs(');
      else if (mod === 'ALPHA') store.insertText('C');
      else store.insertText('sinh(');
    }
  },
  {
    id: 'key_sin',
    primary: 'Sin',
    shift: 'Sin⁻¹',
    alpha: 'D',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText('asin(');
      else if (mod === 'ALPHA') store.insertText('D');
      else store.insertText('sin(');
    }
  },
  {
    id: 'key_cos',
    primary: 'Cos',
    shift: 'Cos⁻¹',
    alpha: 'E',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText('acos(');
      else if (mod === 'ALPHA') store.insertText('E');
      else store.insertText('cos(');
    }
  },
  {
    id: 'key_tan',
    primary: 'Tan',
    shift: 'Tan⁻¹',
    alpha: 'F',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText('atan(');
      else if (mod === 'ALPHA') store.insertText('F');
      else store.insertText('tan(');
    }
  },

  // --- ROW 5 ---
  {
    id: 'key_rcl',
    primary: 'RCL',
    shift: 'STO',
    alpha: 'CLRv',
    action: (mod) => {
      if (mod === 'SHIFT') {
        const varModal = document.getElementById('var-modal');
        if (varModal) varModal.classList.remove('hidden');
      } else if (mod === 'ALPHA') {
        store.clearVariables();
      } else {
        const varModal = document.getElementById('var-modal');
        if (varModal) varModal.classList.remove('hidden');
      }
    }
  },
  {
    id: 'key_eng',
    primary: 'ENG',
    shift: 'i',
    alpha: 'Cot',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText('i');
      else if (mod === 'ALPHA') store.insertText('cot(');
      else store.insertText('e3');
    }
  },
  {
    id: 'key_open_paren',
    primary: '(',
    shift: '%',
    alpha: 'Cot⁻¹',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText('%');
      else if (mod === 'ALPHA') store.insertText('acot(');
      else store.insertText('(');
    }
  },
  {
    id: 'key_close_paren',
    primary: ')',
    shift: ',',
    alpha: 'X',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText(',');
      else if (mod === 'ALPHA') store.insertText('X');
      else store.insertText(')');
    }
  },
  {
    id: 'key_sd',
    primary: 'S⇔D',
    shift: 'a b/c ⇔ d/c',
    alpha: 'Y',
    action: (mod) => {
      if (mod === 'ALPHA') store.insertText('Y');
      else store.toggleResultFormat();
    }
  },
  {
    id: 'key_m_plus',
    primary: 'M+',
    shift: 'M-',
    alpha: 'M',
    action: (mod) => {
      if (mod === 'SHIFT') store.subtractFromMemory();
      else if (mod === 'ALPHA') store.insertText('M');
      else store.addToMemory();
    }
  },

  // --- ROW 6 (NUMPAD 7, 8, 9, DEL, AC) ---
  {
    id: 'key_7',
    primary: '7',
    shift: 'CONST',
    action: (mod) => {
      if (mod === 'SHIFT') {
        const constModal = document.getElementById('constants-modal');
        if (constModal) constModal.classList.remove('hidden');
      } else {
        store.insertText('7');
      }
    },
    cssClass: 'btn-num'
  },
  {
    id: 'key_8',
    primary: '8',
    shift: 'CONV',
    action: (mod) => {
      if (mod === 'SHIFT') {
        const convModal = document.getElementById('conversions-modal');
        if (convModal) convModal.classList.remove('hidden');
      } else {
        store.insertText('8');
      }
    },
    cssClass: 'btn-num'
  },
  {
    id: 'key_9',
    primary: '9',
    shift: 'Limit',
    alpha: '∞',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText('limit(');
      else if (mod === 'ALPHA') store.insertText('Infinity');
      else store.insertText('9');
    },
    cssClass: 'btn-num'
  },
  {
    id: 'key_del',
    primary: 'DEL',
    action: () => store.deleteBack(),
    cssClass: 'btn-del'
  },
  {
    id: 'key_ac',
    primary: 'AC',
    shift: 'CLR ALL',
    action: (mod) => {
      if (mod === 'SHIFT') {
        store.clearAll();
        store.clearVariables();
      } else {
        store.clearAll();
      }
    },
    cssClass: 'btn-ac'
  },

  // --- ROW 7 (NUMPAD 4, 5, 6, ×, ÷) ---
  {
    id: 'key_4',
    primary: '4',
    shift: 'MATRIX',
    alpha: '[:::]',
    action: (mod) => {
      if (mod === 'SHIFT' || mod === 'ALPHA') {
        store.setMode('MATRIX');
      } else {
        store.insertText('4');
      }
    },
    cssClass: 'btn-num'
  },
  {
    id: 'key_5',
    primary: '5',
    shift: 'VECTOR',
    action: (mod) => {
      if (mod === 'SHIFT') store.setMode('VECTOR');
      else store.insertText('5');
    },
    cssClass: 'btn-num'
  },
  {
    id: 'key_6',
    primary: '6',
    shift: 'FUNC',
    alpha: 'HELP',
    action: (mod) => {
      if (mod === 'SHIFT') {
        const formulaModal = document.getElementById('formula-modal');
        if (formulaModal) formulaModal.classList.remove('hidden');
      } else {
        store.insertText('6');
      }
    },
    cssClass: 'btn-num'
  },
  {
    id: 'key_mul',
    primary: '×',
    shift: 'nPr',
    alpha: 'GCD',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText('nPr(');
      else if (mod === 'ALPHA') store.insertText('gcd(');
      else store.insertText('×');
    },
    cssClass: 'btn-operator'
  },
  {
    id: 'key_div',
    primary: '÷',
    shift: 'nCr',
    alpha: 'LCM',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText('nCr(');
      else if (mod === 'ALPHA') store.insertText('lcm(');
      else store.insertText('÷');
    },
    cssClass: 'btn-operator'
  },

  // --- ROW 8 (NUMPAD 1, 2, 3, +, -) ---
  {
    id: 'key_1',
    primary: '1',
    shift: 'STAT',
    action: (mod) => {
      if (mod === 'SHIFT') store.setMode('STAT');
      else store.insertText('1');
    },
    cssClass: 'btn-num'
  },
  {
    id: 'key_2',
    primary: '2',
    shift: 'CMPLX',
    action: (mod) => {
      if (mod === 'SHIFT') store.setMode('CMPLX');
      else store.insertText('2');
    },
    cssClass: 'btn-num'
  },
  {
    id: 'key_3',
    primary: '3',
    shift: 'DISTR',
    action: (mod) => {
      if (mod === 'SHIFT') store.setMode('DISTR');
      else store.insertText('3');
    },
    cssClass: 'btn-num'
  },
  {
    id: 'key_add',
    primary: '+',
    shift: 'Pol',
    alpha: 'Ceil',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText('pol(');
      else if (mod === 'ALPHA') store.insertText('ceil(');
      else store.insertText('+');
    },
    cssClass: 'btn-operator'
  },
  {
    id: 'key_sub',
    primary: '-',
    shift: 'Rec',
    alpha: 'Floor',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText('rec(');
      else if (mod === 'ALPHA') store.insertText('floor(');
      else store.insertText('-');
    },
    cssClass: 'btn-operator'
  },

  // --- ROW 9 (NUMPAD 0, ., Exp, Ans, =) ---
  {
    id: 'key_0',
    primary: '0',
    shift: 'COPY',
    alpha: 'PASTE',
    action: (mod) => {
      if (mod === 'SHIFT') {
        navigator.clipboard?.writeText(store.getActiveResult());
      } else if (mod === 'ALPHA') {
        navigator.clipboard?.readText().then(text => store.insertText(text)).catch(() => {});
      } else {
        store.insertText('0');
      }
    },
    cssClass: 'btn-num'
  },
  {
    id: 'key_dot',
    primary: '.',
    shift: 'Ran#',
    alpha: 'RanInt',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText(Math.random().toFixed(3));
      else if (mod === 'ALPHA') store.insertText(`Math.floor(Math.random()*10)`);
      else store.insertText('.');
    },
    cssClass: 'btn-num'
  },
  {
    id: 'key_exp',
    primary: 'Exp',
    shift: 'π',
    alpha: 'e',
    action: (mod) => {
      if (mod === 'SHIFT') store.insertText('π');
      else if (mod === 'ALPHA') store.insertText('e');
      else store.insertText(' × 10^');
    }
  },
  {
    id: 'key_ans',
    primary: 'Ans',
    alpha: 'PreAns',
    action: (mod) => {
      if (mod === 'ALPHA') store.insertText('PreAns');
      else store.insertText('Ans');
    }
  },
  {
    id: 'key_equals',
    primary: '=',
    shift: 'History',
    action: (mod) => {
      if (mod === 'SHIFT') {
        const histDrawer = document.getElementById('history-drawer');
        if (histDrawer) histDrawer.classList.remove('hidden');
      } else {
        store.evaluateExpression(true);
      }
    },
    cssClass: 'btn-equals'
  }
];

export function renderKeypad(container: HTMLElement): void {
  container.innerHTML = '';

  for (const def of KEY_DEFINITIONS) {
    const btn = document.createElement('button');
    btn.id = def.id;
    btn.className = `calc-key ${def.cssClass || ''}`;

    // Sub-labels container
    const labelsDiv = document.createElement('div');
    labelsDiv.className = 'key-sublabels';

    if (def.shift) {
      const shiftSpan = document.createElement('span');
      shiftSpan.className = 'sublabel shift-label';
      shiftSpan.textContent = def.shiftDisplay || def.shift;
      labelsDiv.appendChild(shiftSpan);
    }

    if (def.alpha) {
      const alphaSpan = document.createElement('span');
      alphaSpan.className = 'sublabel alpha-label';
      alphaSpan.textContent = def.alphaDisplay || def.alpha;
      labelsDiv.appendChild(alphaSpan);
    }

    btn.appendChild(labelsDiv);

    // Primary label
    const mainSpan = document.createElement('span');
    mainSpan.className = 'key-main-label';
    mainSpan.textContent = def.primaryDisplay || def.primary;
    btn.appendChild(mainSpan);

    // Touch & Click handlers
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const isSpecial = def.id === 'key_shift' || def.id === 'key_alpha' || def.id === 'key_equals';
      sound.playKeyClick(isSpecial);
      if (isSpecial) Haptics.specialClick();
      else Haptics.lightClick();

      def.action(store.modifier);
    });

    container.appendChild(btn);
  }
}
