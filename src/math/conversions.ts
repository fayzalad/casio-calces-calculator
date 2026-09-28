/**
 * All 40 Built-in Casio fx-991ES Plus Metric Conversions
 */

export interface MetricConversion {
  code: string;
  from: string;
  to: string;
  label: string;
  convert: (x: number) => number;
}

export const CASIO_CONVERSIONS: Record<string, MetricConversion> = {
  '01': { code: '01', from: 'in', to: 'cm', label: 'in → cm', convert: x => x * 2.54 },
  '02': { code: '02', from: 'cm', to: 'in', label: 'cm → in', convert: x => x / 2.54 },
  '03': { code: '03', from: 'ft', to: 'm', label: 'ft → m', convert: x => x * 0.3048 },
  '04': { code: '04', from: 'm', to: 'ft', label: 'm → ft', convert: x => x / 0.3048 },
  '05': { code: '05', from: 'yd', to: 'm', label: 'yd → m', convert: x => x * 0.9144 },
  '06': { code: '06', from: 'm', to: 'yd', label: 'm → yd', convert: x => x / 0.9144 },
  '07': { code: '07', from: 'mile', to: 'km', label: 'mile → km', convert: x => x * 1.609344 },
  '08': { code: '08', from: 'km', to: 'mile', label: 'km → mile', convert: x => x / 1.609344 },
  '09': { code: '09', from: 'n mile', to: 'm', label: 'n mile → m', convert: x => x * 1852 },
  '10': { code: '10', from: 'm', to: 'n mile', label: 'm → n mile', convert: x => x / 1852 },
  '11': { code: '11', from: 'acre', to: 'm²', label: 'acre → m²', convert: x => x * 4046.8564224 },
  '12': { code: '12', from: 'm²', to: 'acre', label: 'm² → acre', convert: x => x / 4046.8564224 },
  '13': { code: '13', from: 'gal(US)', to: 'L', label: 'gal(US) → L', convert: x => x * 3.785411784 },
  '14': { code: '14', from: 'L', to: 'gal(US)', label: 'L → gal(US)', convert: x => x / 3.785411784 },
  '15': { code: '15', from: 'gal(UK)', to: 'L', label: 'gal(UK) → L', convert: x => x * 4.54609 },
  '16': { code: '16', from: 'L', to: 'gal(UK)', label: 'L → gal(UK)', convert: x => x / 4.54609 },
  '17': { code: '17', from: 'pc', to: 'km', label: 'pc → km', convert: x => x * 3.085677581e13 },
  '18': { code: '18', from: 'km', to: 'pc', label: 'km → pc', convert: x => x / 3.085677581e13 },
  '19': { code: '19', from: 'km/h', to: 'm/s', label: 'km/h → m/s', convert: x => x / 3.6 },
  '20': { code: '20', from: 'm/s', to: 'km/h', label: 'm/s → km/h', convert: x => x * 3.6 },
  '21': { code: '21', from: 'oz', to: 'g', label: 'oz → g', convert: x => x * 28.349523125 },
  '22': { code: '22', from: 'g', to: 'oz', label: 'g → oz', convert: x => x / 28.349523125 },
  '23': { code: '23', from: 'lb', to: 'kg', label: 'lb → kg', convert: x => x * 0.45359237 },
  '24': { code: '24', from: 'kg', to: 'lb', label: 'kg → lb', convert: x => x / 0.45359237 },
  '25': { code: '25', from: 'atm', to: 'Pa', label: 'atm → Pa', convert: x => x * 101325 },
  '26': { code: '26', from: 'Pa', to: 'atm', label: 'Pa → atm', convert: x => x / 101325 },
  '27': { code: '27', from: 'bar', to: 'Pa', label: 'bar → Pa', convert: x => x * 100000 },
  '28': { code: '28', from: 'Pa', to: 'bar', label: 'Pa → bar', convert: x => x / 100000 },
  '29': { code: '29', from: 'mmHg', to: 'Pa', label: 'mmHg → Pa', convert: x => x * 133.322 },
  '30': { code: '30', from: 'Pa', to: 'mmHg', label: 'Pa → mmHg', convert: x => x / 133.322 },
  '31': { code: '31', from: 'hp', to: 'kW', label: 'hp → kW', convert: x => x * 0.74569987158227 },
  '32': { code: '32', from: 'kW', to: 'hp', label: 'kW → hp', convert: x => x / 0.74569987158227 },
  '33': { code: '33', from: 'kgf/cm²', to: 'Pa', label: 'kgf/cm² → Pa', convert: x => x * 98066.5 },
  '34': { code: '34', from: 'Pa', to: 'kgf/cm²', label: 'Pa → kgf/cm²', convert: x => x / 98066.5 },
  '35': { code: '35', from: 'kgf·m', to: 'J', label: 'kgf·m → J', convert: x => x * 9.80665 },
  '36': { code: '36', from: 'J', to: 'kgf·m', label: 'J → kgf·m', convert: x => x / 9.80665 },
  '37': { code: '37', from: '°F', to: '°C', label: '°F → °C', convert: x => (x - 32) * (5 / 9) },
  '38': { code: '38', from: '°C', to: '°F', label: '°C → °F', convert: x => (x * 9 / 5) + 32 },
  '39': { code: '39', from: 'J', to: 'cal', label: 'J → cal', convert: x => x / 4.184 },
  '40': { code: '40', from: 'cal', to: 'J', label: 'cal → J', convert: x => x * 4.184 }
};
