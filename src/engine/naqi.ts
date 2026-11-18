/**
 * India National Air Quality Index (NAQI) Sub-index Calculation
 * Following Central Pollution Control Board (CPCB) official guidelines.
 */

export type NaqiCategory =
  | 'Good'
  | 'Satisfactory'
  | 'Moderate'
  | 'Poor'
  | 'Very Poor'
  | 'Severe';

export interface NaqiBreakpoint {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
  category: NaqiCategory;
  color: string;
}

const PM25_BREAKPOINTS: NaqiBreakpoint[] = [
  { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50, category: 'Good', color: '#16a34a' },
  { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100, category: 'Satisfactory', color: '#65a30d' },
  { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200, category: 'Moderate', color: '#ca8a04' },
  { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300, category: 'Poor', color: '#ea580c' },
  { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400, category: 'Very Poor', color: '#dc2626' },
  { cLow: 251, cHigh: 500, iLow: 401, iHigh: 500, category: 'Severe', color: '#9333ea' },
];

const PM10_BREAKPOINTS: NaqiBreakpoint[] = [
  { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50, category: 'Good', color: '#16a34a' },
  { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100, category: 'Satisfactory', color: '#65a30d' },
  { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200, category: 'Moderate', color: '#ca8a04' },
  { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300, category: 'Poor', color: '#ea580c' },
  { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400, category: 'Very Poor', color: '#dc2626' },
  { cLow: 431, cHigh: 600, iLow: 401, iHigh: 500, category: 'Severe', color: '#9333ea' },
];

function interpolateSubIndex(val: number, breakpoints: NaqiBreakpoint[]): { index: number; category: NaqiCategory; color: string } {
  if (val <= 0) {
    return { index: 0, category: 'Good', color: '#16a34a' };
  }

  for (const bp of breakpoints) {
    if (val <= bp.cHigh) {
      const idx = Math.round(
        bp.iLow + ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (val - bp.cLow)
      );
      return { index: idx, category: bp.category, color: bp.color };
    }
  }

  // Value exceeds highest breakpoint range
  const last = breakpoints[breakpoints.length - 1];
  const extrapolated = Math.min(500, Math.round(401 + ((val - last.cLow) / (last.cHigh - last.cLow)) * 99));
  return { index: extrapolated, category: 'Severe', color: '#9333ea' };
}

export interface NaqiResult {
  aqi: number;
  category: NaqiCategory;
  color: string;
  pm25SubIndex: number;
  pm10SubIndex: number;
  responsiblePollutant: 'PM2.5' | 'PM10';
}

/**
 * Computes India NAQI from 24h rolling PM2.5 and PM10 concentrations.
 */
export function calculateNaqi(pm25: number, pm10: number = 0): NaqiResult {
  const pm25Res = interpolateSubIndex(pm25, PM25_BREAKPOINTS);
  const pm10Res = pm10 > 0 ? interpolateSubIndex(pm10, PM10_BREAKPOINTS) : { index: 0, category: 'Good' as NaqiCategory, color: '#16a34a' };

  if (pm25Res.index >= pm10Res.index) {
    return {
      aqi: pm25Res.index,
      category: pm25Res.category,
      color: pm25Res.color,
      pm25SubIndex: pm25Res.index,
      pm10SubIndex: pm10Res.index,
      responsiblePollutant: 'PM2.5',
    };
  }

  return {
    aqi: pm10Res.index,
    category: pm10Res.category,
    color: pm10Res.color,
    pm25SubIndex: pm25Res.index,
    pm10SubIndex: pm10Res.index,
    responsiblePollutant: 'PM10',
  };
}
