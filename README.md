# Casio fx-991ES PLUS & CalcES Scientific Calculator Emulator (PWA)

## Resume here  (rewritten each session)

**Last updated 2026-10-07 on DESKTOP.** Local `main` matched GitHub (`origin/main`) at the start of this session.

**State:** stacked-fraction input was added on top of a "behave like the physical fx-991ES" pass was done on the calculator engine and input handling (see Change log). Commit `79ff153` was pushed to `main` (auto-deploys via `.github/workflows`). Follow-up commit `01a0f84` (keyboard `/` draws a stacked fraction) was also pushed.
**Next step:** pick from "Open issues" below (biggest remaining gap: stacked *input* for roots, integrals and sums; fractions are done).
**Get a working state:** `npm ci`, `npm test` (runs `test_math.ts` and `test_physical.ts`), `npm run dev` (or `npm run build && npx vite preview --port 4173`).
**Not verified:** on a real iPhone; the non-COMP modes (STAT/MATRIX/etc.) were not touched or re-tested; the Casio-classic skin was not visually re-checked after the display changes.

---

A full-featured scientific calculator emulating both the physical **Casio fx-991ES PLUS (Natural-V.P.A.M.)** and the **CalcES / Scientific Calculator Plus 991 (by SAMATICA)** app. 

### 🌐 Live Web App (Use Anywhere, Even With Computer Off)
👉 **[https://fayzalad.github.io/casio-calces-calculator/](https://fayzalad.github.io/casio-calces-calculator/)**

Architected as a high-performance **Progressive Web App (PWA)** that runs on desktop computers (Windows / macOS / Linux) and on mobile devices (iPhone / iPad / Android).

---

## 🚀 Features

### 1. Dual Visual Skins (1-Tap Instant Toggle)
- **CalcES Dark (OLED)**: Modern dark UI with neon green and yellow accents, matching the exact layout of the CalcES Android app.
- **Casio fx-991ES PLUS Classic**: Authentic brushed silver faceplate, LCD dot-matrix screen, solar panel cell, and classic physical button styling.

### 2. Natural Textbook Display (Natural-V.P.A.M.)
- Vertical two-dimensional fractions ($\frac{a}{b}$)
- Radicals ($\sqrt{\square}$, $\sqrt[3]{\square}$, $\sqrt[n]{\square}$)
- Definite integrals ($\int_a^b f(x)dx$), summations ($\sum$), products ($\prod$), and limits ($\lim$)
- `S <=> D` button toggling between exact form ($\frac{1}{2}$, $\sqrt{3}$, $\frac{\pi}{4}$) and decimal approximations ($0.5$, $1.732$, etc.)
- Repeated decimals and prime factorization (`FACT`)

### 3. All 10 Calculation Modes
1. **COMP**: General arithmetic, trigonometry, logs, powers, roots, calculus ($\int dx$, $d/dx$, $\sum$, $\prod$, $\lim$), GCD, LCM, mod, permutations ($n\mathrm{P}r$), combinations ($n\mathrm{C}r$).
2. **CMPLX**: Complex numbers ($a + bi \longleftrightarrow r\angle\theta$), conjugate, argument, magnitude.
3. **STAT**: 1-variable statistics ($n$, $\bar{x}$, $\sum x$, $\sum x^2$, $\sigma_x$, $s_x$, $\min$, $Q_1$, median, $Q_3$, $\max$) and 6 regression models (Linear, Quadratic, Logarithmic, Exponential, Power, Inverse).
4. **BASE-N**: Dec, Hex, Bin, Oct conversions and bitwise logic (`AND`, `OR`, `XOR`, `XNOR`, `NOT`, `Neg`).
5. **EQN**: Systems of linear equations (2, 3, and 4 unknowns), polynomials (quadratic, cubic, quartic), and general Newton-Raphson `SOLVE`.
6. **MATRIX**: $1\times1$ to $4\times4$ matrices with spreadsheet grid input, determinants, transposes, inverses, and matrix powers.
7. **TABLE**: Simultaneous $f(x)$ and $g(x)$ table generation over intervals.
8. **VECTOR**: 2D & 3D vector operations (dot product, cross product, norm, angle between vectors).
9. **DISTR**: Normal PD/CD/Inverse, Binomial PD/CD, Poisson PD/CD.
10. **GRAPH**: Interactive 2D Cartesian function plotter ($y = f(x)$) with zoom, pan, and coordinate tracing.

### 4. Constants & Conversions
- **All 40 Casio Scientific Constants** (`SHIFT` + `7` / `CONST`) with CODATA values and search.
- **All 40 Casio Metric Conversions** (`SHIFT` + `8` / `CONV`) with formulas.

### 5. Variables & Memory
- Full variable support: `A`, `B`, `C`, `D`, `E`, `F`, `X`, `Y`, `M` (`STO` / `RCL` / `CLRv`).
- Independent memory (`M+`, `M-`).
- Calculation history stack with 1-tap restore.
- `Ans` and `PreAns`.

---

## 💻 How to Use on Computer (Desktop App)

1. **Start the development server:**
   ```bash
   npm run dev
   ```
2. Open `http://localhost:5173` in **Google Chrome**, **Microsoft Edge**, or **Brave**.
3. **Install as a Desktop App:**
   - Look at the right side of the browser's address bar.
   - Click the **"Install"** icon (or menu -> **"Install Casio 991..."**).
   - The calculator will now launch in its own standalone window with a desktop icon, without browser tabs or address bar!
4. **Physical Keyboard Shortcuts:**
   - Numbers: `0` - `9`, `.`
   - Operators: `+`, `-`, `*` ($\times$), `/` ($\div$), `^` (power), `(`, `)`
   - Equals / Evaluate: `Enter` or `=`
   - Delete Back: `Backspace`
   - Clear All: `Escape`
   - Arrow keys: Move cursor left/right
   - Functions: `s` (sin), `c` (cos), `t` (tan), `l` (log), `n` (ln), `x` (X)

---

## 📱 How to Use on iPhone (Pin to Home Screen as App)

1. Run the server on your computer with `--host` (already configured in `npm run dev`):
   ```bash
   npm run dev
   ```
2. Vite will display your local network address, for example:
   ```
   ➜  Network: http://192.168.1.50:5173/
   ```
3. On your **iPhone**, make sure you are connected to the same Wi-Fi, open **Safari**, and navigate to that address.
4. **Pin to Home Screen:**
   - Tap the **Share** button at the bottom of Safari (square with arrow pointing up).
   - Scroll down and tap **"Add to Home Screen"** (`+`).
   - Tap **"Add"** in the top right.
5. Tap the new **Casio 991** icon on your home screen. It opens as a **full-screen standalone app** with:
   - Zero Safari browser chrome (no URL bar or bottom bar).
   - Full support for iPhone Dynamic Island / notch safe area.
   - Tactile mobile haptic feedback on key presses.
   - 100% offline functionality via the built-in Service Worker.



---

## Change log (append-only, newest first)

### 2026-10-07 DESKTOP: keyboard `/` now draws a stacked fraction

Why: user pushed the build, typed `/` and still saw a bare `÷` symbol instead of a stacked fraction. My earlier decision to keep keyboard `/` linear was wrong for this user. Change: `src/main.ts` calls `store.insertFraction()` for `/` (removed from the linear map). The on-screen `÷` key stays linear, like the physical key. Verified in the browser pane: `1 / 2 → + 3 / 4 Enter` shows two stacked fractions and 5/4. Supersedes the "keyboard `/` stays linear" decision in the entry below.

### 2026-10-07 DESKTOP: stacked-fraction input (natural display)

Why: user asked to start on the biggest remaining gap: typing `1/2` showed `1÷2` on one line, where the real calculator draws a stacked fraction template.

What changed:
- New `src/math/templates.ts`: a fraction is stored in the expression string as `⟨num¦den⟩` (markers U+27E8, U+00A6, U+27E9). Helpers convert to infix `((num)/(den))` for the evaluator, to readable text for the history drawer, and find matching markers (fractions nest).
- `src/state/store.ts`: `insertFraction()` (a number/Ans/variable/π just typed, including `5ᴇ3`, becomes the numerator and the cursor drops into the denominator; otherwise the cursor starts in an empty numerator); `deleteAtFractionMarker()` so DEL steps into or dissolves a fraction instead of leaving a stray marker. Right arrow leaves the denominator.
- `src/ui/keypad.ts`: the `■/□` key calls `insertFraction()`.
- `src/display/renderer.ts`: `drawExpression()` parses the string recursively into `.tfrac/.tnum/.tden` HTML, with the cursor placed anywhere (even inside a fraction) and a dashed box for empty slots. `src/style.css` styles them.
- `src/math/evaluator.ts`: runs `templatesToInfix` first, so implicit multiply works (`2⟨1¦2⟩`).
- `src/ui/drawers.ts`: history shows `(1)÷(2)` instead of raw markers.
- `test_physical.ts`: 7 new checks (typing flow, DEL cases, nesting, 1/2+1/3 = 5/6).

Verified: `tsc` clean, `npm test` all pass, build OK; in the browser pane clicking 1, ■/□, 2, →, +, 3, ■/□, 4, = drew ½ + ¾ stacked and gave a stacked 5/4. Not verified: touch devices, the Casio-classic skin look, very long fractions overflowing the LCD width.

Decisions: the `/` key on a computer keyboard still types a linear `÷` (typing `1/2+3` should not trap you in the denominator); on-screen `■/□` makes the stacked template. SHIFT+`■/□` (mixed number a b/c) is still not implemented and just makes a normal fraction.

Failure noted: first draft of the renderer dropped the cursor when a slot was empty (the box replaced the slot HTML, which contained the cursor); fixed by rendering the cursor and the box together.

### 2026-10-07 DESKTOP: physical-calculator accuracy pass

Why: user asked to make the app behave as close to a real physical calculator as possible. A probe script first confirmed these defects: `sin(180)` showed 1.22e-16, `cos(90)` 6e-17, `2π` gave 23.14 (the pi digits were glued onto the 2), `-2^2` gave 4, `6÷2(1+2)` gave 9, and `e`, `sinh`, `integrate/diff/sum/prod`, infix `mod`, and `Ans` after a tiny result (`1e-7`) all threw errors. Missing closing brackets errored, whereas the real calculator closes them automatically.

What changed:
- `src/math/evaluator.ts` **rewritten**: token-level tokenizer, implicit multiplication (2π, 2(3), 3sin(x), AB), real precedence (neg below ^, implicit multiply above ÷ as on the ES), auto-closing brackets, `e`, `i`, `π`, hyperbolics, `logab`, `root`, `ranint`, infix `mod`/`nPr`/`nCr`, `°`, working calculus (`integrate`, `diff`, `sum`, `prod`, `limit`), exact trig at quarter turns (sin 180 = 0, tan 90 = Math ERROR), 15-digit internal rounding (0.1+0.2 = 0.3), decimal answers when a decimal point is typed or calculus is used, NORM1/NORM2/FIX/SCI/ENG formatting. EXP key now inserts `ᴇ` (one number, so `1÷4ᴇ2` = 1/400).
- `src/state/store.ts`: after `=`, a digit starts a new entry and an operator continues from `Ans`; ▲/▼ walk the replay history (`historyUp/Down`); DEL and ◄/► jump over whole tokens (`sin(`, `Ans`...); M+/M-/STO use the full-precision value instead of parsing display text; hyp-key state; ENG key; screen contents persist across reloads (`casio_calces_screen`); error text is "Math ERROR"/"Syntax ERROR".
- `src/ui/keypad.ts`: hyp key works like the real one (hyp then sin = sinh); SHIFT+MODE opens SETUP; ▲/▼ use replay; `Log_a x` inserts `logab(`; SHIFT+x^□ inserts `root(` (type `root(3,8)`; the comma is SHIFT+`)`); nPr/nCr are infix; RanInt fixed (it used to insert JavaScript text).
- `src/ui/drawers.ts` + `index.html`: SETUP has Number Format (Norm1/Norm2/Fix/Sci/Eng) and digits. Constants insert with `ᴇ`. CONV works off `Ans`.
- `src/display/renderer.ts`: cursor stays put when `^2`/`ᴇ` are shown formatted (it used to drift); exponents shown raised; `hyp` flag on the LCD.
- `src/main.ts`: keyboard handler no longer hijacks Ctrl/Alt shortcuts (Ctrl+C used to type `cos(`), ignores keys while a pop-up is open, adds Delete, up/down arrows, `e`, `p` (π), `r` (√), `a` (Ans), `E` (ᴇ), `!`, `%`, `,`.
- `src/math/surd.ts`: shows `√2` not `√(2)`.
- New `test_physical.ts` (~50 checks); `npm test` runs both test files.

Verified: `npx tsc --noEmit` clean; `npm test` all pass; `npm run build` OK; in the browser pane via synthetic key events: sin(180)=0, Ans continuation, new entry after `=`, π×2 = 2π, 1/3 as a vertical fraction, Math ERROR on 1÷0. Not verified: touch input on a phone, other modes.

## Failures and fixes

- Writing patch scripts inline in a bash heredoc failed twice with "unexpected EOF while looking for matching quote". Fix: write the script/content to a file with the Write tool and run that.
- A temporary `probe.ts` in the project root was deleted after use. Don't commit probe files.
- First run of `test_physical.ts` failed on `1÷4ᴇ2`: my expectation was wrong (NORM1 shows 0.0025 as 2.5 × 10^-3, as the real calculator does). Test fixed, code unchanged.
- Old bug root causes (now fixed): `π` was replaced by its digits with no brackets; the implicit-multiplication regex turned `1e-7` into `1*e-7`; the operator check used `'+-*/^!%neg'.includes(token)`, a substring test that matched tokens like `e`, `n`, `g`.

## Decisions and rationale

- Kept a shunting-yard evaluator (rewritten) rather than a full parser: smaller change; calculus is a text pre-pass that re-enters the evaluator.
- Implicit multiplication binds tighter than ÷ (matches the fx-991ES: `6÷2(1+2)` = 1).
- Decimal input gives decimal output (real Natural-Display behaviour); exact fractions/surds only for non-decimal input.
- Did not commit or push: pushing to `main` deploys the public site, so left for the user to approve.

## Open issues and TODO

- Natural-display input is done for fractions only. √, nth root, ∫, Σ, Π, lim, and x^□ exponents are still plain text (`sqrt(`, `integrate(`); the same marker approach in `src/math/templates.ts` can extend to them. Mixed numbers (SHIFT+■/□) not done.
- `Pol(`/`Rec(` return only one component; `∠` polar entry, DMS (`°'"`) entry, `CALC` and `SOLVE` are not real implementations.
- Left/right on a Syntax/Math ERROR does not jump the cursor to the error position.
- No ON/OFF key, no insert/overwrite toggle (SHIFT+DEL).
- Other modes (STAT, MATRIX, TABLE, VECTOR, DISTR, EQN, BASE-N, CMPLX) were not reviewed this session.
- The feature list at the top of this README describes intended behaviour; not all of it was audited.

## Gotchas

- `dist/` is git-ignored; the GitHub Action rebuilds it on every push to `main`.
- The service worker (`public/sw.js`) caches the old build; hard-refresh or clear site data when testing.
- The exponent key inserts `ᴇ` (U+1D07), not the letter `e`; lowercase `e` is Euler's number.

## File map

- `src/math/evaluator.ts`: expression engine (tokenize, shunting-yard, evaluate, number formatting).
- `src/state/store.ts`: calculator state and key behaviours; `src/ui/keypad.ts`: key definitions; `src/display/renderer.ts`: LCD; `src/ui/drawers.ts`: pop-ups and SETUP; `src/main.ts`: wiring and physical keyboard.
- `test_math.ts`: original unit tests; `test_physical.ts`: physical-behaviour tests.
