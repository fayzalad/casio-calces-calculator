export type CalculatorMode = 
  | 'COMP'    // 1: General calculation
  | 'CMPLX'   // 2: Complex number calculation
  | 'STAT'    // 3: Statistics and regression
  | 'BASE_N'  // 4: Binary, Octal, Decimal, Hexadecimal
  | 'EQN'     // 5: Equation and system solver
  | 'MATRIX'  // 6: Matrix calculation
  | 'TABLE'   // 7: Function table generator
  | 'VECTOR'  // 8: Vector calculation
  | 'DISTR'   // 9: Distributions
  | 'GRAPH';  // 10: 2D Function Graphing

export type AngleUnit = 'DEG' | 'RAD' | 'GRA';

export type DisplayFormat = 'NORM1' | 'NORM2' | 'FIX' | 'SCI' | 'ENG' | 'ENG_SI';

export type FractionDisplay = 'NATURAL' | 'DECIMAL' | 'MIXED';

export type KeyModifier = 'NORMAL' | 'SHIFT' | 'ALPHA' | 'SECOND';

export type UITheme = 'casio-classic' | 'calces-dark';

export type BaseNMode = 'DEC' | 'HEX' | 'BIN' | 'OCT';

export interface CalculationHistoryItem {
  id: string;
  timestamp: number;
  expressionDisplay: string;
  expressionRaw: string;
  resultExact: string;
  resultDecimal: string;
  mode: CalculatorMode;
}

export interface VariableStore {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  F: number;
  X: number;
  Y: number;
  M: number; // Independent memory
  Ans: number; // Last result
  PreAns: number; // Result before last
}

export interface CalculatorSettings {
  angleUnit: AngleUnit;
  displayFormat: DisplayFormat;
  fixDigits: number; // 0-9 for FIX/SCI
  fractionDisplay: FractionDisplay;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  theme: UITheme;
  implicitMultiplication: boolean;
  autoParentheses: boolean;
}
