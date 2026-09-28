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
