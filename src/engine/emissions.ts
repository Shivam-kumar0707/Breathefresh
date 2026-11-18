import {
  CO2E_G_PER_PKM,
  COOKING_CO2E_KG_WEEK,
  HEATING_CO2E_KG_WEEK,
} from './constants';
import type { Scenario } from './exposure';

export type CookingFuel = keyof typeof COOKING_CO2E_KG_WEEK;
export type HeatingFuel = keyof typeof HEATING_CO2E_KG_WEEK;

export interface EmissionsBreakdown {
  transportKgWeek: number;
  cookingKgWeek: number;
  heatingKgWeek: number;
  totalCo2eKgWeek: number;
}

function getCommuteEmissionFactor(mode: string): number {
  if (mode === 'car_open' || mode === 'car_ac') return CO2E_G_PER_PKM.car_petrol;
  if (mode in CO2E_G_PER_PKM) {
    return CO2E_G_PER_PKM[mode as keyof typeof CO2E_G_PER_PKM];
  }
  return CO2E_G_PER_PKM.car_petrol;
}

/**
 * Computes weekly CO2e emissions for a scenario.
 * Pure deterministic calculation.
 */
export function computeEmissions(
  scenario: Scenario,
  cookingFuel: CookingFuel = 'lpg',
  heatingFuel: HeatingFuel = 'none',
  workDaysPerWeek: number = 5
): EmissionsBreakdown {
  const distanceKm = scenario.distanceKmPerDay ?? 15;
  const occupancy = Math.max(1, scenario.occupancy ?? 1);

  // Determine commute modes across members
  let dailyTransportGrams = 0;
  let membersWithCommute = 0;

  for (const member of scenario.members) {
    const commuteBlocks = member.blocks.filter((b) => b.place === 'commute');
    if (commuteBlocks.length > 0) {
      membersWithCommute++;
      for (const block of commuteBlocks) {
        const mode = block.commuteMode ?? 'car_petrol';
        const factor = getCommuteEmissionFactor(mode);
        // Grams CO2e per passenger-km for this member's commute block
        dailyTransportGrams += (distanceKm * factor) / occupancy;
      }
    }
  }

  // If no specific commute block exists, use default car_petrol for adults
  if (membersWithCommute === 0 && scenario.distanceKmPerDay) {
    dailyTransportGrams = (distanceKm * CO2E_G_PER_PKM.car_petrol) / occupancy;
  }

  const transportKgWeek = (dailyTransportGrams * workDaysPerWeek) / 1000;
  const cookingKgWeek = COOKING_CO2E_KG_WEEK[cookingFuel] ?? 0;
  const heatingKgWeek = HEATING_CO2E_KG_WEEK[heatingFuel] ?? 0;

  const totalCo2eKgWeek = transportKgWeek + cookingKgWeek + heatingKgWeek;

  return {
    transportKgWeek: Math.round(transportKgWeek * 10) / 10,
    cookingKgWeek: Math.round(cookingKgWeek * 10) / 10,
    heatingKgWeek: Math.round(heatingKgWeek * 10) / 10,
    totalCo2eKgWeek: Math.round(totalCo2eKgWeek * 10) / 10,
  };
}
