/**
 * Natural-display templates.
 *
 * The expression is still a plain string, but a stacked fraction is stored as
 * FRAC_OPEN numerator FRAC_SEP denominator FRAC_CLOSE, e.g. ⟨1¦2⟩ is one half.
 * Fractions can nest. The LCD draws them stacked; the evaluator reads them as ((1)/(2)).
 */
export const FRAC_OPEN = '⟨';
export const FRAC_SEP = '¦';
export const FRAC_CLOSE = '⟩';

export const hasTemplate = (expr: string): boolean => expr.includes(FRAC_OPEN);

/** ⟨a¦b⟩ -> ((a)/(b)) so the normal evaluator can read it. */
export function templatesToInfix(expr: string): string {
  return expr
    .replaceAll(FRAC_OPEN, '((')
    .replaceAll(FRAC_SEP, ')/(')
    .replaceAll(FRAC_CLOSE, '))');
}

/** Readable one-line version for lists such as the history drawer: ⟨1¦2⟩ -> (1)÷(2). */
export function templatesToText(expr: string): string {
  return expr
    .replaceAll(FRAC_OPEN, '(')
    .replaceAll(FRAC_SEP, ')÷(')
    .replaceAll(FRAC_CLOSE, ')');
}

/** Index of the FRAC_CLOSE matching the FRAC_OPEN at openIdx, or -1. */
export function matchingClose(expr: string, openIdx: number): number {
  let depth = 0;
  for (let i = openIdx; i < expr.length; i++) {
    if (expr[i] === FRAC_OPEN) depth++;
    else if (expr[i] === FRAC_CLOSE && --depth === 0) return i;
  }
  return -1;
}

/** Index of the FRAC_OPEN that encloses position idx (a separator or anything inside), or -1. */
export function enclosingOpen(expr: string, idx: number): number {
  let depth = 0;
  for (let i = idx - 1; i >= 0; i--) {
    if (expr[i] === FRAC_CLOSE) depth++;
    else if (expr[i] === FRAC_OPEN) {
      if (depth === 0) return i;
      depth--;
    }
  }
  return -1;
}

/** Index of the FRAC_SEP belonging to the fraction opened at openIdx, or -1. */
export function separatorOf(expr: string, openIdx: number): number {
  let depth = 0;
  for (let i = openIdx; i < expr.length; i++) {
    if (expr[i] === FRAC_OPEN) depth++;
    else if (expr[i] === FRAC_CLOSE) {
      if (--depth === 0) return -1;
    } else if (expr[i] === FRAC_SEP && depth === 1) return i;
  }
  return -1;
}
