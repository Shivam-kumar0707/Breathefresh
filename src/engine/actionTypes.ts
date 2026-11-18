import type { Scenario } from './exposure';
import type { CookingFuel, HeatingFuel } from './emissions';

export type ActionCategory = 'routine' | 'indoor' | 'alternative';
export type CostTier = 'free' | 'low' | 'mid' | 'high';

export interface AirContext {
  aqi: number;
  currentPm25: number;
  bestHour: number; // 0..23 lowest PM2.5
  worstHour: number; // 0..23 highest PM2.5
  isSevere: boolean;
}

export interface UserProfileContext {
  hasPurifier: boolean;
  cookingFuel: CookingFuel;
  heatingFuel: HeatingFuel;
  hasCar: boolean;
  hasKids: boolean;
  hasVulnerable: boolean;
}

export interface Action {
  id: string;
  category: ActionCategory;
  title: string;
  blurb: string;
  cost: CostTier;
  applicable: (profile: UserProfileContext, ctx: AirContext) => boolean;
  transform: (s: Scenario) => Scenario;
}

export interface ActionImpact {
  id: string;
  title: string;
  category: ActionCategory;
  costTier: CostTier;
  deltaEiPct: number; // e.g. -24.5%
  deltaCigEq: number; // e.g. -1.4 cigs/day
  deltaCo2eKgWeek: number; // e.g. -8.2 kg CO2e/week
  notes?: string;
}
