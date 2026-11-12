/**
 * Haptic feedback wrapper using HTML5 Vibration API
 */

export class Haptics {
  static enabled: boolean = true;

  static trigger(ms: number = 10): void {
    if (!Haptics.enabled || typeof window === 'undefined' || !('vibrate' in navigator)) {
      return;
    }
    try {
      navigator.vibrate(ms);
    } catch {
      // Vibration not supported or not allowed
    }
  }

  static lightClick(): void {
    Haptics.trigger(8);
  }

  static specialClick(): void {
    Haptics.trigger(15);
  }

  static errorVibrate(): void {
    if (!Haptics.enabled || typeof window === 'undefined' || !('vibrate' in navigator)) {
      return;
    }
    try {
      navigator.vibrate([40, 30, 40]);
    } catch {
      // Ignored
    }
  }
}

// ---- iPhone haptics (added 2026-11-13; same method as Tv/remote-web/src/haptic.ts) ----
// iPhone Safari has no navigator.vibrate. Its switch control (<input type="checkbox" switch>, iOS 17.4+) buzzes when a
// REAL finger toggles it (since iOS 26.5 a script click no longer does). So on iPhone an invisible switch is laid over
// every <button>: the finger taps the switch, iOS buzzes, and the click bubbles up to the button as usual.
// Opt a button out with data-nohaptic. Button click handlers must not preventDefault() a click whose target is the
// switch (that would cancel the toggle): use isHapticSwitch(e.target).
const isIOS = () =>
  /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const isHapticSwitch = (t: EventTarget | null) => t instanceof Element && t.classList.contains('hx');

function addSwitch(b: HTMLButtonElement): void {
  if (b.hasAttribute('data-nohaptic') || b.querySelector(':scope > .hx')) return;
  const s = document.createElement('input');
  s.type = 'checkbox';
  s.setAttribute('switch', '');
  s.className = 'hx';
  s.tabIndex = -1;
  s.setAttribute('aria-hidden', 'true');
  if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
  b.appendChild(s);
}

// The haptics setting: off = the switches are hidden and taps go straight to the buttons.
export function setTapHaptics(on: boolean): void {
  document.documentElement.classList.toggle('no-hx', !on);
}

export function initTapHaptics(on: boolean): void {
  if (typeof window === 'undefined' || !isIOS() || 'vibrate' in navigator) return;
  const css = document.createElement('style');
  // Kept a real (invisible) native switch: restyling it with appearance:none might stop the haptic.
  css.textContent = `.hx{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;
    cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;z-index:1}
    .no-hx .hx,button:disabled>.hx{display:none}`;
  document.head.appendChild(css);
  setTapHaptics(on);
  const scan = () => document.querySelectorAll('button').forEach((b) => addSwitch(b as HTMLButtonElement));
  scan();
  // Buttons are re-rendered (keypad, drawers) and textContent changes remove the switch: re-scan.
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
}
