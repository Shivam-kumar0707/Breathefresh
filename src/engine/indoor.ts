import {
  ACH,
  CEILING_HEIGHT_METERS,
  DEPOSITION,
  MIN_INDOOR_FRACTION,
  PENETRATION,
  SOURCE_ADD,
} from './constants';

export type WindowState = 'closed' | 'sealed' | 'ventilate_window' | 'open';

export interface Home {
  areaM2: number;
  windows: WindowState;
  ventilationHours?: number[];
  purifier?: {
    cadrM3h: number;
    hours: number[]; // 0..23 hours when purifier is active
  };
  sources: Partial<Record<keyof typeof SOURCE_ADD, number[]>>; // hours when source is active
}

export interface IndoorHourParams {
  outdoorPm25: number;
  areaM2: number;
  ceilingHeight?: number;
  windows: WindowState;
  isVentilating?: boolean;
  cadrM3h?: number;
  isPurifierActive?: boolean;
  sourceAdd?: number;
}

/**
 * Computes steady-state indoor PM2.5 concentration for a single hour using mass balance principles.
 * Equation:
 *   C_in = (PENETRATION * a * C_out) / (a + DEPOSITION + CADR / V) + sourceAdd
 * Physics safeguards:
 *   Clamped to at least 0.05 * C_out (5% physical bypass floor).
 *
 * @param params - Physical room, air change, purifier CADR, and source parameters.
 * @returns Steady-state indoor PM2.5 concentration in µg/m³.
 */
export function computeIndoorHour(params: IndoorHourParams): number {
  const {
    outdoorPm25,
    areaM2,
    ceilingHeight = CEILING_HEIGHT_METERS,
    windows,
    isVentilating = false,
    cadrM3h = 0,
    isPurifierActive = false,
    sourceAdd = 0,
  } = params;

  if (outdoorPm25 <= 0 && sourceAdd <= 0) {
    return 0;
  }

  // Air changes per hour: if ventilating during this hour, use open rate
  const a = isVentilating ? ACH.open : ACH[windows];

  // Purifier CADR active only during running hours
  const activeCadr = isPurifierActive ? Math.max(0, cadrM3h) : 0;

  // Room volume in m³
  const volume = Math.max(1, areaM2 * ceilingHeight);

  // Mass balance steady-state
  const denom = a + DEPOSITION + activeCadr / volume;
  const cInRaw =
    denom > 0 ? (PENETRATION * a * outdoorPm25) / denom + sourceAdd : outdoorPm25 + sourceAdd;

  // Physical clamp: even best purifiers have edge bypass
  const minFloor = MIN_INDOOR_FRACTION * outdoorPm25;
  const clamped = Math.max(minFloor, cInRaw);

  return Math.round(clamped * 10) / 10;
}

/**
 * Computes a 24-hour indoor PM2.5 concentration profile across all hours.
 * Evaluates individual hourly purifier schedules, window ventilation events, and indoor combustion sources.
 *
 * @param outdoorHourly - 24-element array of ambient outdoor PM2.5 levels.
 * @param home - Home characteristics including room volume, window state, purifier schedule, and active sources.
 * @returns 24-element array of modeled indoor hourly concentrations (µg/m³).
 */
export function computeIndoorProfile(outdoorHourly: number[], home: Home): number[] {
  const result: number[] = [];
  const hourly = outdoorHourly || [];

  for (let h = 0; h < 24; h++) {
    const cOut = hourly[h] ?? 0;
    const isVentilating = home.ventilationHours?.includes(h) ?? false;
    const isPurifierActive = home.purifier ? home.purifier.hours.includes(h) : false;
    const cadr = home.purifier?.cadrM3h ?? 0;

    // Calculate source contributions active in this hour
    let sourceAdd = 0;
    for (const [sourceKey, activeHours] of Object.entries(home.sources || {})) {
      if (activeHours && activeHours.includes(h)) {
        sourceAdd += SOURCE_ADD[sourceKey as keyof typeof SOURCE_ADD] ?? 0;
      }
    }

    const cIn = computeIndoorHour({
      outdoorPm25: cOut,
      areaM2: home.areaM2,
      windows: home.windows,
      isVentilating,
      cadrM3h: cadr,
      isPurifierActive,
      sourceAdd,
    });

    result.push(cIn);
  }

  return result;
}
