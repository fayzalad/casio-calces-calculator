# Calculator (project notes)

Casio fx-991ES PLUS / CalcES emulator PWA. See `README.md` ("Resume here") for state. Adds to the root `Claude code/CLAUDE.md`.

## Session log

### 2026-10-07 - Keyboard `/` makes a stacked fraction

- **Changed:** `src/main.ts` (keyboard `/` calls `store.insertFraction()`); README change log and Resume-here updated.
- **Why:** user saw a bare `÷` after typing `/` on the live site and expected the stacked fraction.
- **Files:** `src/main.ts`, `README.md`, `CLAUDE.md`.
- **Revert:** restore `'/': '÷'` in the `typed` map in `src/main.ts` and delete the `e.key === '/'` branch.
- **Verified:** `npm test` pass, build OK, browser pane showed stacked 1/2 + 3/4 = 5/4. Commit `79ff153` (earlier work) was pushed; this change committed locally, not pushed.

### 2026-10-07 - Stacked-fraction input

- **Changed:** added `src/math/templates.ts`; `insertFraction`/DEL handling in `src/state/store.ts`; recursive LCD drawing in `src/display/renderer.ts`; `■/□` key in `src/ui/keypad.ts`; template pre-pass in `src/math/evaluator.ts`; history text in `src/ui/drawers.ts`; styles in `src/style.css`; 7 tests in `test_physical.ts`; README change log updated.
- **Why:** user asked to start on stacked-fraction input, the biggest remaining gap to a physical calculator.
- **Files:** as listed.
- **Revert:** `git checkout -- . && rm src/math/templates.ts` reverts this together with the earlier uncommitted pass; nothing is committed yet.
- **Verified:** `tsc`, `npm test`, `npm run build` pass; browser pane showed 1/2 + 3/4 stacked = 5/4. Not pushed.

### 2026-10-07 - Physical-calculator accuracy pass

- **Changed:** rewrote `src/math/evaluator.ts`; changed `src/state/store.ts`, `src/ui/keypad.ts`, `src/ui/drawers.ts`, `src/display/renderer.ts`, `src/main.ts`, `src/math/surd.ts`, `src/style.css`, `index.html`, `package.json` (test script); added `test_physical.ts`; wrote README "Resume here" + change log; created this file.
- **Why:** user asked to make the calculator behave as close to a real physical one as possible; probing found wrong sin(180), 2π, -2^2, broken e/sinh/calculus/mod, etc. Details in the README change log.
- **Files:** listed above.
- **Revert:** `git checkout -- . && rm test_physical.ts CLAUDE.md` (nothing was committed; all changes are in the working tree).
- **Verified:** `npx tsc --noEmit`, `npm test`, `npm run build` pass; spot-checked in the browser pane. Not pushed to GitHub.
