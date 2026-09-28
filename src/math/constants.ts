/**
 * All 40 Built-in Casio fx-991ES Plus Scientific Constants (CODATA Recommended Values)
 */

export interface ScientificConstant {
  code: string;
  symbol: string;
  name: string;
  unit: string;
  value: number;
}

export const CASIO_CONSTANTS: Record<string, ScientificConstant> = {
  '01': { code: '01', symbol: 'mp', name: 'Proton mass', unit: 'kg', value: 1.672621898e-27 },
  '02': { code: '02', symbol: 'mn', name: 'Neutron mass', unit: 'kg', value: 1.674927471e-27 },
  '03': { code: '03', symbol: 'me', name: 'Electron mass', unit: 'kg', value: 9.10938356e-31 },
  '04': { code: '04', symbol: 'mμ', name: 'Muon mass', unit: 'kg', value: 1.883531594e-28 },
  '05': { code: '05', symbol: 'a0', name: 'Bohr radius', unit: 'm', value: 5.2917721067e-11 },
  '06': { code: '06', symbol: 'h', name: 'Planck constant', unit: 'J s', value: 6.62607015e-34 },
  '07': { code: '07', symbol: 'μN', name: 'Nuclear magneton', unit: 'J T^-1', value: 5.050783699e-27 },
  '08': { code: '08', symbol: 'μB', name: 'Bohr magneton', unit: 'J T^-1', value: 9.274009994e-24 },
  '09': { code: '09', symbol: 'ħ', name: 'Reduced Planck constant', unit: 'J s', value: 1.054571817e-34 },
  '10': { code: '10', symbol: 'α', name: 'Fine-structure constant', unit: '', value: 7.2973525664e-3 },
  '11': { code: '11', symbol: 're', name: 'Classical electron radius', unit: 'm', value: 2.8179403227e-15 },
  '12': { code: '12', symbol: 'λc', name: 'Compton wavelength', unit: 'm', value: 2.4263102367e-12 },
  '13': { code: '13', symbol: 'γp', name: 'Proton gyromagnetic ratio', unit: 's^-1 T^-1', value: 2.675222005e8 },
  '14': { code: '14', symbol: 'λcp', name: 'Proton Compton wavelength', unit: 'm', value: 1.32140985396e-15 },
  '15': { code: '15', symbol: 'λcn', name: 'Neutron Compton wavelength', unit: 'm', value: 1.31959090481e-15 },
  '16': { code: '16', symbol: 'R∞', name: 'Rydberg constant', unit: 'm^-1', value: 10973731.568508 },
  '17': { code: '17', symbol: 'u', name: 'Atomic mass unit', unit: 'kg', value: 1.660539040e-27 },
  '18': { code: '18', symbol: 'μp', name: 'Proton magnetic moment', unit: 'J T^-1', value: 1.4106067873e-26 },
  '19': { code: '19', symbol: 'μe', name: 'Electron magnetic moment', unit: 'J T^-1', value: -9.284764620e-24 },
  '20': { code: '20', symbol: 'μn', name: 'Neutron magnetic moment', unit: 'J T^-1', value: -9.6623650e-27 },
  '21': { code: '21', symbol: 'μμ', name: 'Muon magnetic moment', unit: 'J T^-1', value: -4.49044826e-26 },
  '22': { code: '22', symbol: 'F', name: 'Faraday constant', unit: 'C mol^-1', value: 96485.33289 },
  '23': { code: '23', symbol: 'e', name: 'Elementary charge', unit: 'C', value: 1.602176634e-19 },
  '24': { code: '24', symbol: 'NA', name: 'Avogadro constant', unit: 'mol^-1', value: 6.02214076e23 },
  '25': { code: '25', symbol: 'k', name: 'Boltzmann constant', unit: 'J K^-1', value: 1.380649e-23 },
  '26': { code: '26', symbol: 'Vm', name: 'Molar volume of ideal gas', unit: 'm^3 mol^-1', value: 0.022710947 },
  '27': { code: '27', symbol: 'R', name: 'Molar gas constant', unit: 'J mol^-1 K^-1', value: 8.3144598 },
  '28': { code: '28', symbol: 'c0', name: 'Speed of light in vacuum', unit: 'm s^-1', value: 299792458 },
  '29': { code: '29', symbol: 'C1', name: 'First radiation constant', unit: 'W m^2', value: 3.741771790e-16 },
  '30': { code: '30', symbol: 'C2', name: 'Second radiation constant', unit: 'm K', value: 1.43877736e-2 },
  '31': { code: '31', symbol: 'σ', name: 'Stefan-Boltzmann constant', unit: 'W m^-2 K^-4', value: 5.670367e-8 },
  '32': { code: '32', symbol: 'ε0', name: 'Electric constant', unit: 'F m^-1', value: 8.854187817e-12 },
  '33': { code: '33', symbol: 'μ0', name: 'Magnetic constant', unit: 'N A^-2', value: 1.2566370614e-6 },
  '34': { code: '34', symbol: 'Φ0', name: 'Magnetic flux quantum', unit: 'Wb', value: 2.067833831e-15 },
  '35': { code: '35', symbol: 'g', name: 'Standard acceleration of gravity', unit: 'm s^-2', value: 9.80665 },
  '36': { code: '36', symbol: 'G0', name: 'Conductance quantum', unit: 'S', value: 7.7480917310e-5 },
  '37': { code: '37', symbol: 'Z0', name: 'Characteristic impedance of vacuum', unit: 'Ω', value: 376.730313461 },
  '38': { code: '38', symbol: 't', name: 'Celsius temperature', unit: 'K', value: 273.15 },
  '39': { code: '39', symbol: 'G', name: 'Newtonian gravitational constant', unit: 'm^3 kg^-1 s^-2', value: 6.67408e-11 },
  '40': { code: '40', symbol: 'atm', name: 'Standard atmosphere', unit: 'Pa', value: 101325 }
};
