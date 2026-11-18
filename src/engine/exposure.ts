import {
  BREATHING,
  CIG_PM25,
  COMMUTE_FACTOR,
  MASK,
  RISK_BAND_THRESHOLDS,
  RISK_MULT,
  WORK_SCHOOL_INDOOR_FACTOR,
  type Band,
} from './constants';
import { computeIndoorProfile, type Home } from './indoor';

export type Place = 'home' | 'work_school' | 'outdoor' | 'commute';

export interface Block {
  startHour: number; // 0..23
  endHour: number; // 1..24
  place: Place;
  activity: keyof typeof BREATHING;
  commuteMode?: keyof typeof COMMUTE_FACTOR;
  mask: keyof typeof MASK;
}

export type AgeGroup = 'child' | 'teen' | 'adult' | 'senior';
export type HealthCondition = 'asthma_copd' | 'heart' | 'pregnant';

export interface Member {
  id: string;
  name: string;
  ageGroup: AgeGroup;
  conditions: HealthCondition[];
  blocks: Block[];
}

export interface Scenario {
  outdoorPm25: number[]; // 24 hourly concentrations
  members: Member[];
  home: Home;
  distanceKmPerDay?: number;
  occupancy?: number;
}

export interface MemberExposure {
  memberId: string;
  name: string;
  hourly: number[]; // hourly dose (C(h) * breathing * (1 - mask))
  hourlyConcentration: number[]; // microenvironment C(h)
  ei: number; // Exposure Index: 24h mean breathing-weighted concentration
  cigEq: number; // EI / CIG_PM25
  riskScore: number;
  band: Band;
  byPlace: Record<Place, number>; // contribution to EI by location
}

export interface FamilyExposureResult {
  perMember: Record<string, MemberExposure>;
  totalCigEq: number;
  averageEi: number;
  maxBand: Band;
}

/**
 * Returns the maximum risk multiplier applicable to this member.
 */
export function getMemberRiskMultiplier(member: Member): number {
  let maxMult: number = RISK_MULT[member.ageGroup] ?? 1.0;
  for (const cond of member.conditions) {
    const mult = RISK_MULT[cond] ?? 1.0;
    if (mult > maxMult) {
      maxMult = mult;
    }
  }
  return maxMult;
}

/**
 * Determines risk band from a risk score.
 */
export function getRiskBand(riskScore: number): Band {
  if (riskScore <= RISK_BAND_THRESHOLDS.lowMax) return 'low';
  if (riskScore <= RISK_BAND_THRESHOLDS.moderateMax) return 'moderate';
  if (riskScore <= RISK_BAND_THRESHOLDS.highMax) return 'high';
  return 'severe';
}

/**
 * Computes individual fine-particulate dose for a specific family member across all 24 hours.
 * Multiplies microenvironmental concentration C(h) by physical activity breathing volume and mask factor:
 *   Dose(h) = C_microenv(h) * BreathingMult(activity) * (1 - MaskEfficiency)
 * Pure deterministic calculation.
 *
 * @param scenario - The holistic family and environmental scenario.
 * @param memberId - Target member's unique identifier.
 * @returns Complete MemberExposure profile with hourly dose series, EI, cigarette equivalents, and risk score.
 */
export function computeExposure(scenario: Scenario, memberId: string): MemberExposure {
  const member = scenario.members.find((m) => m.id === memberId);
  if (!member) {
    throw new Error(`Member with id "${memberId}" not found in scenario`);
  }

  const indoorHourly = computeIndoorProfile(scenario.outdoorPm25, scenario.home);
  const hourlyDose: number[] = [];
  const hourlyConcentration: number[] = [];

  const byPlaceDose: Record<Place, number> = {
    home: 0,
    work_school: 0,
    outdoor: 0,
    commute: 0,
  };

  // Build a lookup for hour -> block (defaulting to home rest if unspecified)
  for (let h = 0; h < 24; h++) {
    const matchingBlock = member.blocks.find((b) => h >= b.startHour && h < b.endHour);

    const place: Place = matchingBlock ? matchingBlock.place : 'home';
    const activity = matchingBlock ? matchingBlock.activity : 'rest';
    const mask = matchingBlock ? matchingBlock.mask : 'none';
    const commuteMode = matchingBlock?.commuteMode;

    const outdoorConcentration = scenario.outdoorPm25[h] ?? 0;

    let microenvConcentration = 0;
    switch (place) {
      case 'home':
        microenvConcentration = indoorHourly[h] ?? 0;
        break;
      case 'work_school':
        microenvConcentration = outdoorConcentration * WORK_SCHOOL_INDOOR_FACTOR;
        break;
      case 'outdoor':
        microenvConcentration = outdoorConcentration;
        break;
      case 'commute': {
        const factor = commuteMode ? COMMUTE_FACTOR[commuteMode] : 1.0;
        microenvConcentration = outdoorConcentration * factor;
        break;
      }
    }

    const breathingMultiplier = BREATHING[activity] ?? 1.0;
    const maskEfficiency = MASK[mask] ?? 0;
    const dose = microenvConcentration * breathingMultiplier * (1 - maskEfficiency);

    hourlyConcentration.push(Math.round(microenvConcentration * 10) / 10);
    hourlyDose.push(Math.round(dose * 10) / 10);
    byPlaceDose[place] += dose;
  }

  const totalDoseSum = hourlyDose.reduce((acc, d) => acc + d, 0);
  const ei = Math.round((totalDoseSum / 24) * 10) / 10;
  const cigEq = Math.round((ei / CIG_PM25) * 10) / 10;

  const riskMultiplier = getMemberRiskMultiplier(member);
  const riskScore = Math.round(ei * riskMultiplier * 10) / 10;
  const band = getRiskBand(riskScore);

  const byPlace: Record<Place, number> = {
    home: Math.round((byPlaceDose.home / 24) * 10) / 10,
    work_school: Math.round((byPlaceDose.work_school / 24) * 10) / 10,
    outdoor: Math.round((byPlaceDose.outdoor / 24) * 10) / 10,
    commute: Math.round((byPlaceDose.commute / 24) * 10) / 10,
  };

  return {
    memberId: member.id,
    name: member.name,
    hourly: hourlyDose,
    hourlyConcentration,
    ei,
    cigEq,
    riskScore,
    band,
    byPlace,
  };
}

/**
 * Computes collective household exposure metrics across all members.
 * Aggregates cumulative cigarette equivalents, calculates mean family Exposure Index, and identifies peak vulnerability band.
 *
 * @param scenario - Family scenario containing all member schedules, home parameters, and outdoor air quality.
 * @returns FamilyExposureResult containing per-member breakdown, total household cigarette equivalents, and max band.
 */
export function familyExposure(scenario: Scenario): FamilyExposureResult {
  const perMember: Record<string, MemberExposure> = {};
  let totalCigEq = 0;
  let totalEi = 0;
  let maxBand: Band = 'low';

  const bandRank: Record<Band, number> = { low: 0, moderate: 1, high: 2, severe: 3 };

  for (const member of scenario.members) {
    const exp = computeExposure(scenario, member.id);
    perMember[member.id] = exp;
    totalCigEq += exp.cigEq;
    totalEi += exp.ei;
    if (bandRank[exp.band] > bandRank[maxBand]) {
      maxBand = exp.band;
    }
  }

  const memberCount = Math.max(1, scenario.members.length);
  const averageEi = Math.round((totalEi / memberCount) * 10) / 10;
  totalCigEq = Math.round(totalCigEq * 10) / 10;

  return {
    perMember,
    totalCigEq,
    averageEi,
    maxBand,
  };
}
