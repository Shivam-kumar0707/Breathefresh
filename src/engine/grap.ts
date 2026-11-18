/**
 * Graded Response Action Plan (GRAP) for Delhi NCR
 * Based on CAQM (Commission for Air Quality Management in NCR and Adjoining Areas) guidelines.
 */

export type GrapStageId = 'Stage I' | 'Stage II' | 'Stage III' | 'Stage IV';

export interface GrapStageInfo {
  stage: GrapStageId;
  name: string;
  aqiRange: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  keyMeasures: string[];
}

export const GRAP_STAGES: Record<GrapStageId, GrapStageInfo> = {
  'Stage I': {
    stage: 'Stage I',
    name: 'Poor (AQI 201–300)',
    aqiRange: '201–300',
    color: '#ea580c',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-900 border-orange-300',
    keyMeasures: [
      'Strict ban on open burning of garbage and biomass',
      'Anti-dust drives at construction sites',
      'Water sprinkling and mechanized sweeping on roads',
    ],
  },
  'Stage II': {
    stage: 'Stage II',
    name: 'Very Poor (AQI 301–400)',
    aqiRange: '301–400',
    color: '#dc2626',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-900 border-red-300',
    keyMeasures: [
      'Ban on diesel generator sets (except essential services)',
      'Enhanced parking fees to discourage private vehicles',
      'Augmented metro and bus frequency for commuters',
    ],
  },
  'Stage III': {
    stage: 'Stage III',
    name: 'Severe (AQI 401–450)',
    aqiRange: '401–450',
    color: '#9333ea',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-900 border-purple-300',
    keyMeasures: [
      'Strict ban on non-essential construction and demolition',
      'Ban on BS-III petrol and BS-IV diesel 4-wheelers',
      'Discontinuation of physical classes up to primary schools',
    ],
  },
  'Stage IV': {
    stage: 'Stage IV',
    name: 'Severe Plus (AQI > 450)',
    aqiRange: '> 450',
    color: '#881337',
    badgeBg: 'bg-rose-900',
    badgeText: 'text-rose-100 border-rose-700',
    keyMeasures: [
      'Ban on entry of non-essential trucks into Delhi',
      'Online classes for all school grades',
      '50% work-from-home mandate for public and private offices',
    ],
  },
};

export const NCR_CITIES = [
  'delhi',
  'new delhi',
  'noida',
  'greater noida',
  'ghaziabad',
  'gurugram',
  'gurgaon',
  'faridabad',
  'meerut',
  'sonipat',
  'panipat',
  'rohtak',
  'bahadurgarh',
  'hapur',
  'bulandshahr',
  'muzaffarnagar',
];

export const CAQM_OFFICIAL_URL = 'https://caqm.nic.in/';

/**
 * Checks whether a given city/region name falls within Delhi NCR jurisdiction.
 */
export function isNcrCity(cityName: string): boolean {
  if (!cityName) return false;
  const normalized = cityName.toLowerCase().trim();
  return NCR_CITIES.some((ncr) => normalized.includes(ncr));
}

/**
 * Estimates active GRAP stage based on NAQI value.
 * Note: Official GRAP stage is notified by CAQM and may be triggered proactively.
 */
export function estimateGrapStage(aqi: number): GrapStageInfo | null {
  if (aqi > 450) return GRAP_STAGES['Stage IV'];
  if (aqi >= 401) return GRAP_STAGES['Stage III'];
  if (aqi >= 301) return GRAP_STAGES['Stage II'];
  if (aqi >= 201) return GRAP_STAGES['Stage I'];
  return null;
}
