import { z } from 'zod';
import ghaziabadFallback from './fallback/ghaziabad.json';
import delhiFallback from './fallback/delhi.json';
import krakowFallback from './fallback/krakow.json';
import { calculateNaqi, type NaqiResult } from '../engine/naqi';
import { estimateGrapStage, isNcrCity, type GrapStageInfo } from '../engine/grap';

export const AirApiResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  current: z.object({
    time: z.string(),
    pm2_5: z.number(),
    pm10: z.number(),
    us_aqi: z.number(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    pm2_5: z.array(z.number()),
    pm10: z.array(z.number()),
    us_aqi: z.array(z.number()),
  }),
});

export type RawAirData = z.infer<typeof AirApiResponseSchema>;

export interface CleanWindow {
  hour: number;
  timeLabel: string;
  pm25: number;
  aqi: number;
}

export interface AirState {
  current: {
    time: string;
    pm2_5: number;
    pm10: number;
    us_aqi: number;
  };
  naqi: NaqiResult;
  grapStage: GrapStageInfo | null;
  isNcr: boolean;
  bestWindow: CleanWindow;
  worstWindow: CleanWindow;
  inversionRisk: boolean;
  hourlySeries: {
    time: string;
    hour: number;
    pm2_5: number;
    pm10: number;
    aqi: number;
    isBestWindow: boolean;
    isWorstWindow: boolean;
  }[];
  today24hPm25: number[]; // 24 numbers for Impact Engine
  forecastDays: {
    date: string;
    avgPm25: number;
    hourlyPm25: number[];
  }[];
  isSampleData: boolean;
  dataSourceLabel: string;
}

/**
 * Finds the closest fallback snapshot based on Euclidean coordinate distance.
 */
function getNearestFallback(lat: number, lon: number): RawAirData {
  const fallbacks = [
    { data: ghaziabadFallback as RawAirData, lat: 28.67, lon: 77.45 },
    { data: delhiFallback as RawAirData, lat: 28.61, lon: 77.21 },
    { data: krakowFallback as RawAirData, lat: 50.06, lon: 19.94 },
  ];

  let minDistance = Infinity;
  let nearest = fallbacks[0].data;

  for (const item of fallbacks) {
    const d = Math.hypot(lat - item.lat, lon - item.lon);
    if (d < minDistance) {
      minDistance = d;
      nearest = item.data;
    }
  }

  return nearest;
}

/**
 * Transforms raw Open-Meteo air response into a structured AirState.
 */
export function processAirData(
  raw: RawAirData,
  cityName: string,
  isSampleData: boolean,
  inversionRisk: boolean = false
): AirState {
  // Use recent 24 hours of PM2.5 for rolling average
  const hoursPm25 = raw.hourly.pm2_5.slice(0, 48);
  const hoursPm10 = raw.hourly.pm10.slice(0, 48);
  const hoursAqi = raw.hourly.us_aqi.slice(0, 48);
  const hoursTime = raw.hourly.time.slice(0, 48);

  // Compute NAQI from current or latest rolling 24h
  const rollingPm25Avg =
    hoursPm25.slice(0, 24).reduce((sum, v) => sum + v, 0) / Math.max(1, Math.min(24, hoursPm25.length));
  const rollingPm10Avg =
    hoursPm10.slice(0, 24).reduce((sum, v) => sum + v, 0) / Math.max(1, Math.min(24, hoursPm10.length));

  const naqi = calculateNaqi(rollingPm25Avg, rollingPm10Avg);

  // Check NCR status and estimate GRAP
  const isNcr = isNcrCity(cityName);
  const grapStage = isNcr ? estimateGrapStage(naqi.aqi) : null;

  // Next 24-hour horizon for the daily plan
  const today24hPm25 = hoursPm25.slice(24, 48).length === 24
    ? hoursPm25.slice(24, 48)
    : hoursPm25.slice(0, 24);

  // Identify best window (lowest PM2.5) and worst window (highest PM2.5) in the next 24 hours
  let minPm = Infinity;
  let minHour = 14;
  let maxPm = -Infinity;
  let maxHour = 7;

  for (let i = 0; i < today24hPm25.length; i++) {
    const val = today24hPm25[i];
    if (val < minPm) {
      minPm = val;
      minHour = i;
    }
    if (val > maxPm) {
      maxPm = val;
      maxHour = i;
    }
  }

  const bestWindow: CleanWindow = {
    hour: minHour,
    timeLabel: `${minHour.toString().padStart(2, '0')}:00 – ${(minHour + 2) % 24}:00`,
    pm25: Math.round(minPm),
    aqi: raw.hourly.us_aqi[minHour] ?? Math.round(minPm * 1.2),
  };

  const worstWindow: CleanWindow = {
    hour: maxHour,
    timeLabel: `${maxHour.toString().padStart(2, '0')}:00 – ${(maxHour + 2) % 24}:00`,
    pm25: Math.round(maxPm),
    aqi: raw.hourly.us_aqi[maxHour] ?? Math.round(maxPm * 1.3),
  };

  // Build 48h hourly series for Recharts
  const hourlySeries = hoursTime.map((t, idx) => {
    const d = new Date(t);
    const hour = d.getHours();
    return {
      time: t,
      hour,
      pm2_5: Math.round(hoursPm25[idx] ?? 0),
      pm10: Math.round(hoursPm10[idx] ?? 0),
      aqi: hoursAqi[idx] ?? 0,
      isBestWindow: hour >= minHour && hour <= minHour + 2,
      isWorstWindow: hour >= maxHour && hour <= maxHour + 2,
    };
  });

  // Split into forecast days (up to 3 days)
  const forecastDays = [];
  for (let day = 0; day < 3; day++) {
    const dayHours = raw.hourly.pm2_5.slice(day * 24, (day + 1) * 24);
    if (dayHours.length === 24) {
      const avg = Math.round(dayHours.reduce((a, b) => a + b, 0) / 24);
      const dateStr = raw.hourly.time[day * 24]?.split('T')[0] ?? `Day ${day + 1}`;
      forecastDays.push({
        date: dateStr,
        avgPm25: avg,
        hourlyPm25: dayHours,
      });
    }
  }

  return {
    current: {
      time: raw.current.time,
      pm2_5: Math.round(raw.current.pm2_5 * 10) / 10,
      pm10: Math.round(raw.current.pm10 * 10) / 10,
      us_aqi: raw.current.us_aqi,
    },
    naqi,
    grapStage,
    isNcr,
    bestWindow,
    worstWindow,
    inversionRisk,
    hourlySeries,
    today24hPm25,
    forecastDays,
    isSampleData,
    dataSourceLabel: isSampleData ? 'Offline Sample Data (Fallback Snapshot)' : 'Live Open-Meteo Air Quality API',
  };
}

/**
 * Fetches live air quality from Open-Meteo with strict 6s timeout and graceful fallback snapshot.
 */
export async function fetchAirQuality(
  lat: number,
  lon: number,
  cityName: string
): Promise<AirState> {
  const roundedLat = Math.round(lat * 100) / 100;
  const roundedLon = Math.round(lon * 100) / 100;

  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${roundedLat}&longitude=${roundedLon}&current=pm2_5,pm10,us_aqi&hourly=pm2_5,pm10,us_aqi&past_days=1&forecast_days=3&timezone=auto`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);

  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`Open-Meteo responded with status ${res.status}`);
    }

    const json = await res.json();
    const validated = AirApiResponseSchema.parse(json);

    // Also check inversion risk via weather (boundary layer height & wind)
    let inversionRisk = false;
    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${roundedLat}&longitude=${roundedLon}&hourly=temperature_2m,wind_speed_10m,boundary_layer_height&forecast_days=1&timezone=auto`;
      const wCtrl = new AbortController();
      const wTimer = setTimeout(() => wCtrl.abort(), 3000);
      const wRes = await fetch(weatherUrl, { signal: wCtrl.signal });
      clearTimeout(wTimer);
      if (wRes.ok) {
        const wJson = await wRes.json();
        const blh = wJson?.hourly?.boundary_layer_height?.[6]; // 6 AM morning
        const wind = wJson?.hourly?.wind_speed_10m?.[6];
        if (blh !== undefined && wind !== undefined && blh < 250 && wind < 5) {
          inversionRisk = true;
        }
      }
    } catch {
      // Weather check is optional; ignore failure
    }

    return processAirData(validated, cityName, false, inversionRisk);
  } catch (err) {
    clearTimeout(timer);
    console.warn(`Air quality fetch failed for (${lat}, ${lon}), using fallback snapshot:`, err);
    const fallbackRaw = getNearestFallback(lat, lon);
    return processAirData(fallbackRaw, cityName, true, true);
  }
}
