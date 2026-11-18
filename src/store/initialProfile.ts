import { getDeviceId } from '../lib/deviceId';
import { DEMO_PERSONAS } from '../data/personas';
import type { UserProfile } from './types';

export const defaultPersona = DEMO_PERSONAS[0]; // The Sharma Family

/**
 * Loads cached profile from localStorage or initializes with the Sharma Family demo profile.
 */
export function getInitialProfile(): UserProfile {
  const deviceId = getDeviceId();
  try {
    const cached = localStorage.getItem('breathefresh_profile');
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...parsed, deviceId };
    }
  } catch {
    // ignore
  }

  return {
    deviceId,
    city: {
      name: defaultPersona.city.name,
      displayName: `${defaultPersona.city.name}, ${defaultPersona.city.country}`,
      lat: defaultPersona.city.lat,
      lon: defaultPersona.city.lon,
      country: defaultPersona.city.country,
    },
    members: defaultPersona.scenario.members,
    lifestyle: {
      homeAreaM2: defaultPersona.lifestyle.homeAreaM2,
      hasPurifier: defaultPersona.lifestyle.hasPurifier,
      cadrM3h: defaultPersona.lifestyle.cadrM3h,
      cookingFuel: defaultPersona.lifestyle.cookingFuel,
      heatingFuel: defaultPersona.lifestyle.heatingFuel,
      commuteMode: defaultPersona.lifestyle.commuteMode,
      commuteKm: defaultPersona.lifestyle.commuteKm,
      budgetTier: defaultPersona.lifestyle.budgetTier,
    },
    language: 'en',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
