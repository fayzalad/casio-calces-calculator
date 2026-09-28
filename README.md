# Casio fx-991ES PLUS & CalcES Scientific Calculator Emulator (PWA)

A full-featured scientific calculator emulating both the physical **Casio fx-991ES PLUS (Natural-V.P.A.M.)** and the **CalcES / Scientific Calculator Plus 991 (by SAMATICA)** app. 

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
