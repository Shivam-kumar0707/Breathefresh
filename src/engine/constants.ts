/**
 * BreatheFresh Impact Engine Constants
 * Every tunable number lives in this file only. No magic numbers elsewhere.
 * Rendered on /method and documented in README.
 */

export const BREATHING = {
  sleep: 0.6,
  rest: 1.0,
  light: 1.4,
  brisk: 2.5,
  exercise: 3.5,
} as const;

export const MASK = {
  none: 0,
  surgical: 0.2, // ~20% filtration efficiency due to edge leakage
  n95: 0.8,      // Lab ~95% x real-world fit factor (~80% effective)
} as const;

export const COMMUTE_FACTOR = {
  walk: 1.0,
  cycle: 1.0,
  two_wheeler: 1.1, // closer to vehicle exhausts
  auto: 1.2,
  e_rickshaw: 1.2,
  car_open: 1.0,
  car_ac: 0.6,      // cabin filter + recirculation
  bus: 1.1,
  metro: 0.5,       // underground/filtered stations & AC coaches
} as const;

export const ACH = {
  closed: 0.5,            // standard modern closed room
  sealed: 0.35,           // weather-stripped / taped windows & door sweep
  ventilate_window: 1.5,  // cracked window / deliberate short ventilation
  open: 3.0,              // fully open windows / cross-ventilation
} as const;

export const PENETRATION = 0.8; // Fraction of outdoor PM2.5 entering through envelope
export const DEPOSITION = 0.2;  // Gravitational settling & surface deposition rate per hour

export const SOURCE_ADD = {
  cooking_no_hood: 25,
  cooking_hood: 10,
  incense: 40,
  wood_coal_heater: 60,
  indoor_smoking: 50,
} as const;

export const WORK_SCHOOL_INDOOR_FACTOR = 0.7; // Typical building infiltration factor

export const RISK_MULT = {
  adult: 1.0,
  teen: 1.1,
  child: 1.3,
  senior: 1.3,
  pregnant: 1.3,
  heart: 1.5,
  asthma_copd: 1.6,
} as const;

export const CIG_PM25 = 22; // 22 µg/m³ of 24h PM2.5 ≈ 1 cigarette/day (Berkeley Earth heuristic)

export const CO2E_G_PER_PKM = {
  walk: 0,
  cycle: 0,
  two_wheeler: 70,
  auto: 90,
  car_petrol: 170,
  car_ev: 80,
  bus: 35,
  metro: 30,
  e_rickshaw: 40,
} as const;

export const COOKING_CO2E_KG_WEEK = {
  lpg: 8.5,
  induction: 3.8,
  biomass: 24.0,
} as const;

export const HEATING_CO2E_KG_WEEK = {
  none: 0,
  electric: 14.0,
  coal_wood: 48.0,
} as const;

export const CEILING_HEIGHT_METERS = 2.7;

export const MIN_INDOOR_FRACTION = 0.05; // Indoor PM2.5 floor (clamp: purifiers are not 100% airtight)

export const RISK_BAND_THRESHOLDS = {
  lowMax: 35,
  moderateMax: 90,
  highMax: 150,
} as const;

export type Band = 'low' | 'moderate' | 'high' | 'severe';

export const CONSTANT_DOCS = [
  {
    name: 'CIG_PM25',
    value: `${CIG_PM25} µg/m³`,
    source: 'Berkeley Earth (Muller & Rohde)',
    desc: 'Equates 22 µg/m³ of 24-hour PM2.5 exposure to smoking roughly 1 cigarette per day.',
  },
  {
    name: 'MASK efficiency',
    value: 'N95: 80%, Surgical: 20%',
    source: 'NIOSH / CDC real-world fit studies',
    desc: 'Accounts for typical facial sealing leaks during everyday use.',
  },
  {
    name: 'PENETRATION & DEPOSITION',
    value: '0.80 & 0.20 h⁻¹',
    source: 'LBNL Indoor Air Mass Balance Models',
    desc: 'Standard physical aerosol transport constants for residential buildings.',
  },
  {
    name: 'ACH (Air Changes per Hour)',
    value: 'Sealed: 0.35, Closed: 0.5, Open: 3.0',
    source: 'ASHRAE Fundamentals & CPCB Delhi indoor studies',
    desc: 'Air exchange rate across room envelopes based on window tightness.',
  },
  {
    name: 'COMMUTE_FACTOR',
    value: 'Metro: 0.5, AC Car: 0.6, Open: 1.0–1.2',
    source: 'CSE India Commuter Exposure Studies',
    desc: 'In-transit microenvironment concentration relative to ambient outdoor air.',
  },
  {
    name: 'CO2E_G_PER_PKM',
    value: 'Metro: 30g, Bus: 35g, 2-Wheeler: 70g, Car: 170g',
    source: 'IPCC & WRI India Urban Transport Factors',
    desc: 'Gram CO2 equivalent per passenger-kilometer for urban transport modes.',
  },
] as const;
