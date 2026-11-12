# Session log

### 2026-11-13 — iPhone haptics committed and deployed

- **Did:** committed the iPhone haptics change as `688ba80` on `main` and ran `npm run deploy`, which updated `gh-pages`.
- **Why:** user said "Commit and deploy".
- **Files:** `gh-pages` branch on GitHub (the live site). `main` is 1 commit ahead of `origin/main` and NOT pushed.
- **Undo:** `git revert 688ba80` then `npm run deploy`.
- **Checked:** the live site serves the new JS (`index-D1KVA5TX.js`, contains the switch code). NOT checked: the buzz on the iPhone.

### 2026-11-13 — iPhone haptics (invisible switch over every button)

- **Did:** `src/audio/haptics.ts` gained `initTapHaptics`/`setTapHaptics`/`isHapticSwitch`: on iPhone (no `navigator.vibrate`) an invisible native `<input type=checkbox switch class=hx>` is laid over every `<button>` (MutationObserver re-adds it), so the finger toggles it and iOS buzzes. Started in `main.ts` from `settings.hapticsEnabled`; the Settings haptics toggle calls `setTapHaptics` (`drawers.ts`). `keypad.ts` no longer `preventDefault()`s a click whose target is the switch (that would cancel the toggle).
- **Why:** user asked for the TV remote's working iPhone haptic here too. Script-clicked switches stopped buzzing in iOS 26.5 (WebKit PR 38473: needs real user activation); a real tap still works (confirmed on the user's iPhone with the TV remote).
- **Files:** `src/audio/haptics.ts`, `src/main.ts`, `src/ui/drawers.ts`, `src/ui/keypad.ts` (uncommitted, NOT deployed)
- **Undo:** `git checkout -- src/audio/haptics.ts src/main.ts src/ui/drawers.ts src/ui/keypad.ts`
- **Checked:** `npm run build` and `npm test` pass; browser pane with a faked iPhone: all 186 buttons got a switch, real taps 1 + 2 = gave 3 and toggled each switch. NOT checked: the buzz on the real iPhone (needs commit + `npm run deploy`; service worker may need a reload or two).

### 2026-11-03 — Raised exponents after x^□

- **Did:** the LCD now draws whatever follows `^` (number, Ans, variable, π, or a bracketed group) as a raised superscript, with a raised empty box right after pressing x^□; replaced the old `^2`/`^3` → ²/³ text swap so all powers look the same.
- **Why:** user wanted x^□ to look like x² (raised) instead of a literal `^`.
- **Files:** `src/display/renderer.ts` (`exponent()` in `drawExpression`), `src/style.css` (`sup.pow`).
- **Undo:** `git revert` the commit after this entry.
- **Checked:** `tsc` + tests pass; viewed `5^(3+1)+2^□` raised in the browser. Known difference from the real calculator: the cursor sits after the raised exponent, and anything typed next goes on the baseline (real one stays in the exponent until →).

### 2026-11-03 — Complex maths, distributions, BASE-N, graph, desktop side panel

- **Did:** CMPLX: complex-aware exp/ln/log/√/trig/powers, `conjg arg re im`, float-dust cleanup, S⇔D flips a+bi / r∠θ. DISTR: replaced 1e-7 erf with ~1e-15 erf/erfc and fixed invNormal (0.975 gave 0.76). BASE-N: negatives show 32-bit two's complement, FFFFFFFF parses as -1. GRAPH: canvas now sizes itself, draws on open, theme colours, nice grid + labels, asymptote gaps, Done button works. Desktop (>=1100x700): history + memory side panel (`src/ui/sidebar.ts`).
- **Why:** user asked to keep refining until everything works; audit found these as real wrong answers/blank graph.
- **Files:** `src/math/evaluator.ts`, `complex.ts`, `distributions.ts`, `baseN.ts`, `src/graph/plotter.ts`, `src/main.ts`, `src/ui/sidebar.ts` (new), `index.html`, `src/style.css`, `test_physical.ts`.
- **Undo:** `git revert` the commit made after this entry (or `git checkout -- .` if uncommitted).
- **Checked:** `tsc` + tests (13 new) pass; graph, MATRIX panel and desktop 1440x900 layout viewed in the browser pane. Not verified: real phone, touch pan/zoom on graph, EQN/VECTOR/BASE-N panels visually.

### 2026-11-03 — Committed and deployed today's work

- **Did:** committed `6feceb0` on main, pushed to origin/main, `npm run deploy` force-pushed gh-pages (`e98a22d`).
- **Why:** user approved commit and deploy.
- **Files:** git history; remote `gh-pages`.
- **Undo:** `git revert 6feceb0` then `npm run deploy`.
- **Checked:** Pages build status `built`; live HTML references `assets/index-B5LueJKE.js`, same as local build. Not verified on an installed phone copy.

### 2026-11-03 — Log/power/inverse regression, TABLE `2X` fix, README resume

- **Did:** added `logarithmicRegression`, `powerRegression`, `inverseRegression` to `src/math/statistics.ts` and the STAT panel; fixed X substitution in TABLE/EQN (`2X` was read as 0); rewrote README "Resume here".
- **Why:** README claimed 6 regression types but only 3 existed; TABLE bug found while smoke-testing panels.
- **Files:** `src/math/statistics.ts`, `src/ui/modes.ts`, `test_physical.ts`, `README.md`.
- **Undo:** `git checkout -- .` reverts all uncommitted work from today.
- **Checked:** `tsc`, tests (3 new) pass; TABLE g(-3)=-6 and Power regression shown in browser. Not verified: desktop width.

### 2026-11-03 — Mode screens (STAT, BASE-N, EQN, MATRIX, TABLE, VECTOR, DISTR)

- **Did:** found the mode menu only set a flag for these modes (math libraries existed but had no UI). Added `src/ui/modes.ts`: a form panel per mode, opened whenever the mode changes (menu or SHIFT+number keys); Done/✕ returns to COMP. Wired in `src/main.ts`; styles appended to `src/style.css`.
- **Why:** user asked me to check the mode menu; selecting a mode appeared to do nothing.
- **Files:** `src/ui/modes.ts` (new), `src/main.ts`, `src/style.css`.
- **Undo:** delete `src/ui/modes.ts`, remove the two lines in `main.ts` and the "Mode screens" CSS block.
- **Checked:** `tsc` + tests pass; all 7 panels give sensible default results in the browser (e.g. DISTR normal CD -1..1 = 0.68268947, MATRIX 19/22/43/50); STAT panel viewed at phone size. NOT verified: the other panels visually, regression types beyond Linear, desktop width. Logarithmic/power/inverse regression are not in `statistics.ts` (README claims them).

### 2026-11-03 — Polish pass 2: DMS, Pol/Rec, polar entry

- **Did:** DMS input (`1°30'15"`, the ° key now cycles ° ' "); `Pol(`/`Rec(` show both answers and store them in X and Y; `r∠θ` entry in CMPLX; Casio-classic active tab text now white.
- **Why:** gaps left after pass 1.
- **Files:** `src/math/evaluator.ts`, `src/state/store.ts`, `src/ui/keypad.ts`, `src/style.css`, `test_physical.ts`.
- **Undo:** `git checkout -- .` (still uncommitted, includes pass 1).
- **Checked:** `tsc` + `npm test` pass (4 new tests); classic skin viewed at phone size. NOT verified: choosing a mode from the menu (STAT etc.) showed no visible change in my one click, unconfirmed whether that is a bug or my click; desktop layout.

### 2026-11-03 — Calculator polish pass (evaluator fixes + CalcES look)

- **Did:** evaluator: bare functions take just the next number (`√2×√8`=4); `(-8)^(1/3)`=-2; `√(-4)` and `(-2)^0.5` are Math ERROR outside CMPLX (new `Evaluator.setComplexMode`, set in `evaluateExpression`); results >=1e10 no longer print as long integers; `∛` symbol parses. UI: CalcES dark theme recoloured to match the app screenshot (grey function keys, near-black number keys incl. Exp/Ans, lighter bezel, bigger sublabels, rounder keys, `Logₐx`); desktop media query (min 900x700) widens chassis to 640px.
- **Why:** user asked to polish and match a real scientific calculator and the native app look.
- **Files:** `src/math/evaluator.ts`, `src/state/store.ts`, `src/ui/keypad.ts`, `src/style.css`, `test_physical.ts`.
- **Undo:** `git checkout -- .` (nothing committed yet).
- **Checked:** `tsc`, `npm test` pass; phone-size screenshot viewed. NOT verified: desktop layout (browser pane too small to trigger the media query), Casio-classic skin after recolour (not touched), non-COMP modes, deploy not run.

