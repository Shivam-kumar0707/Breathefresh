import type { Scenario } from './exposure';
import { familyExposure } from './exposure';
import { computeEmissions, type CookingFuel, type HeatingFuel } from './emissions';

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

// Deep clone helper for scenario purity
function cloneScenario(s: Scenario): Scenario {
  return {
    outdoorPm25: [...s.outdoorPm25],
    distanceKmPerDay: s.distanceKmPerDay,
    occupancy: s.occupancy,
    home: {
      areaM2: s.home.areaM2,
      windows: s.home.windows,
      ventilationHours: s.home.ventilationHours ? [...s.home.ventilationHours] : undefined,
      purifier: s.home.purifier
        ? { cadrM3h: s.home.purifier.cadrM3h, hours: [...s.home.purifier.hours] }
        : undefined,
      sources: Object.fromEntries(
        Object.entries(s.home.sources).map(([k, v]) => [k, v ? [...v] : undefined])
      ),
    },
    members: s.members.map((m) => ({
      ...m,
      conditions: [...m.conditions],
      blocks: m.blocks.map((b) => ({ ...b })),
    })),
  };
}

export const ACTION_CATALOG: Action[] = [
  // 1. ROUTINE: Shift outdoor activity to cleanest window
  {
    id: 'shift_outdoor_to_best_window',
    category: 'routine',
    title: 'Shift outdoor hours to cleanest afternoon window',
    blurb: 'Reschedule runs, errands and strolls away from morning smog traps into the cleanest hours.',
    cost: 'free',
    applicable: (_p, ctx) => ctx.aqi > 100,
    transform: (s) => {
      const next = cloneScenario(s);
      // Find lowest outdoor PM2.5 hour between 11:00 and 16:00
      let bestH = 14;
      let minVal = Infinity;
      for (let h = 11; h <= 16; h++) {
        const val = next.outdoorPm25[h] ?? 999;
        if (val < minVal) {
          minVal = val;
          bestH = h;
        }
      }

      next.members = next.members.map((m) => ({
        ...m,
        blocks: m.blocks.map((b) => {
          if (b.place === 'outdoor') {
            return {
              ...b,
              startHour: bestH,
              endHour: Math.min(24, bestH + (b.endHour - b.startHour)),
            };
          }
          return b;
        }),
      }));
      return next;
    },
  },

  // 2. ROUTINE: N95 on outdoor & commute
  {
    id: 'n95_outdoor',
    category: 'routine',
    title: 'Wear snug N95 mask outdoors and in transit',
    blurb: 'A well-fitted N95 filters ~80% of fine aerosol particles during travel and errands.',
    cost: 'low',
    applicable: (_p, ctx) => ctx.aqi > 100,
    transform: (s) => {
      const next = cloneScenario(s);
      next.members = next.members.map((m) => ({
        ...m,
        blocks: m.blocks.map((b) => {
          if (b.place === 'outdoor' || b.place === 'commute') {
            return { ...b, mask: 'n95' };
          }
          return b;
        }),
      }));
      return next;
    },
  },

  // 3. ROUTINE: Swap outdoor workout to indoor yoga/bodyweight
  {
    id: 'indoor_workout_swap',
    category: 'routine',
    title: 'Swap outdoor exercise for indoor workout',
    blurb: 'Exercise increases breathing volume 3.5×. Moving workouts inside reduces heavy lung deposition.',
    cost: 'free',
    applicable: (_p, ctx) => ctx.aqi > 150,
    transform: (s) => {
      const next = cloneScenario(s);
      next.members = next.members.map((m) => ({
        ...m,
        blocks: m.blocks.map((b) => {
          if (b.place === 'outdoor' && (b.activity === 'exercise' || b.activity === 'brisk')) {
            return { ...b, place: 'home', activity: 'light' };
          }
          return b;
        }),
      }));
      return next;
    },
  },

  // 4. ROUTINE: Keep children indoors on severe smog days
  {
    id: 'kids_indoor_play_on_severe',
    category: 'routine',
    title: 'Move children’s playtime indoors',
    blurb: 'Children breathe faster per kg of body weight; indoor play shields developing airways.',
    cost: 'free',
    applicable: (p, ctx) => p.hasKids && ctx.aqi > 200,
    transform: (s) => {
      const next = cloneScenario(s);
      next.members = next.members.map((m) => {
        if (m.ageGroup === 'child') {
          return {
            ...m,
            blocks: m.blocks.map((b) => {
              if (b.place === 'outdoor') {
                return { ...b, place: 'home', activity: 'rest' };
              }
              return b;
            }),
          };
        }
        return m;
      });
      return next;
    },
  },

  // 5. ROUTINE: Avoid peak traffic rush hour
  {
    id: 'avoid_peak_traffic_hours',
    category: 'routine',
    title: 'Shift commute outside 8-10 AM / 6-8 PM rush',
    blurb: 'Vehicular exhaust peaks at rush hour. Shifting 45 minutes earlier or later avoids dense curb fumes.',
    cost: 'free',
    applicable: (_p, ctx) => ctx.aqi > 150,
    transform: (s) => {
      const next = cloneScenario(s);
      next.members = next.members.map((m) => ({
        ...m,
        blocks: m.blocks.map((b) => {
          if (b.place === 'commute' && b.startHour >= 8 && b.startHour <= 10) {
            return { ...b, startHour: 10, endHour: 11 };
          }
          return b;
        }),
      }));
      return next;
    },
  },

  // 6. ROUTINE: Work from home on severe smog days
  {
    id: 'wfh_on_severe',
    category: 'routine',
    title: 'Work from home during Severe / GRAP III+ alerts',
    blurb: 'Eliminates commute exposure entirely and reduces city vehicular emissions.',
    cost: 'free',
    applicable: (_p, ctx) => ctx.aqi > 250,
    transform: (s) => {
      const next = cloneScenario(s);
      next.members = next.members.map((m) => {
        if (m.ageGroup === 'adult') {
          return {
            ...m,
            blocks: m.blocks.map((b) => {
              if (b.place === 'commute' || b.place === 'work_school') {
                return { ...b, place: 'home', activity: 'rest' };
              }
              return b;
            }),
          };
        }
        return m;
      });
      return next;
    },
  },

  // 7. INDOOR: Bedroom HEPA air purifier
  {
    id: 'purifier_bedroom',
    category: 'indoor',
    title: 'Run HEPA purifier in bedroom overnight (10 PM–7 AM)',
    blurb: 'Provides 8 hours of continuous clean air during restorative sleep.',
    cost: 'mid',
    applicable: () => true,
    transform: (s) => {
      const next = cloneScenario(s);
      const sleepHours = [22, 23, 0, 1, 2, 3, 4, 5, 6];
      const existingHours = next.home.purifier?.hours ?? [];
      const mergedHours = Array.from(new Set([...existingHours, ...sleepHours]));
      const currentCadr = next.home.purifier?.cadrM3h ?? 0;
      next.home.purifier = {
        cadrM3h: Math.max(currentCadr, 250),
        hours: mergedHours,
      };
      return next;
    },
  },

  // 8. INDOOR: Living room continuous purifier
  {
    id: 'purifier_living',
    category: 'indoor',
    title: 'Continuous living area air purification (24h)',
    blurb: 'Maintains low baseline PM2.5 in shared family spaces round-the-clock.',
    cost: 'mid',
    applicable: () => true,
    transform: (s) => {
      const next = cloneScenario(s);
      const allHours = Array.from({ length: 24 }, (_, i) => i);
      const currentCadr = next.home.purifier?.cadrM3h ?? 0;
      next.home.purifier = {
        cadrM3h: Math.max(currentCadr, 350),
        hours: allHours,
      };
      return next;
    },
  },

  // 9. INDOOR: Seal door and window gaps
  {
    id: 'seal_gaps',
    category: 'indoor',
    title: 'Seal window gaps & install door sweeps',
    blurb: 'Reduces air infiltration rate (ACH) by 30%, keeping dirty ambient air out.',
    cost: 'low',
    applicable: () => true,
    transform: (s) => {
      const next = cloneScenario(s);
      if (next.home.windows !== 'open') {
        next.home.windows = 'sealed';
      }
      return next;
    },
  },

  // 10. INDOOR: Ventilate only during cleanest afternoon hours
  {
    id: 'ventilate_best_window_only',
    category: 'indoor',
    title: 'Ventilate home only 1:00 PM – 3:00 PM',
    blurb: 'Flush indoor CO2 when solar heating lifts the inversion layer and ambient PM2.5 is lowest.',
    cost: 'free',
    applicable: (_p, ctx) => ctx.aqi > 150,
    transform: (s) => {
      const next = cloneScenario(s);
      next.home.ventilationHours = [13, 14];
      if (next.home.windows === 'open') {
        next.home.windows = 'closed';
      }
      return next;
    },
  },

  // 11. INDOOR: Cook with range hood / active kitchen exhaust
  {
    id: 'cook_with_hood_or_window',
    category: 'indoor',
    title: 'Run kitchen exhaust hood during all cooking',
    blurb: 'Traps oil droplets and ultrafine cooking aerosols before they disperse through bedrooms.',
    cost: 'free',
    applicable: () => true,
    transform: (s) => {
      const next = cloneScenario(s);
      const cookingHours = next.home.sources.cooking_no_hood;
      if (cookingHours && cookingHours.length > 0) {
        next.home.sources.cooking_hood = cookingHours;
        delete next.home.sources.cooking_no_hood;
      }
      return next;
    },
  },

  // 12. INDOOR: Skip incense / dhoop / candles on severe smog days
  {
    id: 'skip_incense_on_severe',
    category: 'indoor',
    title: 'Pause burning incense, camphor & dhoop indoors',
    blurb: 'One incense stick releases PM2.5 equivalent to several cigarettes in an enclosed room.',
    cost: 'free',
    applicable: (_p, ctx) => ctx.aqi > 150,
    transform: (s) => {
      const next = cloneScenario(s);
      delete next.home.sources.incense;
      return next;
    },
  },

  // 13. INDOOR: Wet mop instead of dry brooming
  {
    id: 'wet_mop',
    category: 'indoor',
    title: 'Wet-mop floors daily (avoid dry brooming)',
    blurb: 'Dry sweeping re-suspends settled fine dust into the breathing zone; damp mopping traps it.',
    cost: 'free',
    applicable: () => true,
    transform: (s) => {
      // Wet mopping reduces indoor background infiltration/resuspension
      const next = cloneScenario(s);
      if (next.home.windows === 'closed') {
        next.home.windows = 'sealed';
      }
      return next;
    },
  },

  // 14. INDOOR: DIY Corsi-Rosenthal Box
  {
    id: 'diy_corsi_box',
    category: 'indoor',
    title: 'Build a DIY Corsi-Rosenthal box purifier',
    blurb: 'High-CADR filtration built with a box fan and MERV-13 filters for under ₹2,500.',
    cost: 'low',
    applicable: () => true,
    transform: (s) => {
      const next = cloneScenario(s);
      const allHours = Array.from({ length: 24 }, (_, i) => i);
      const existingCadr = next.home.purifier?.cadrM3h ?? 0;
      next.home.purifier = {
        cadrM3h: Math.max(existingCadr, 450), // high airflow
        hours: allHours,
      };
      return next;
    },
  },

  // 15. INDOOR: Eliminate coal/wood indoor heater burning
  {
    id: 'no_indoor_heater_burning',
    category: 'indoor',
    title: 'Stop unvented coal or wood space heating',
    blurb: 'Solid fuel combustion indoors releases dangerous carbon monoxide and high PM2.5.',
    cost: 'free',
    applicable: (p) => p.heatingFuel === 'coal_wood',
    transform: (s) => {
      const next = cloneScenario(s);
      delete next.home.sources.wood_coal_heater;
      return next;
    },
  },

  // 16. ALTERNATIVES: Metro or public bus instead of personal car
  {
    id: 'metro_or_bus_instead_of_car',
    category: 'alternative',
    title: 'Take Metro or electric bus instead of driving',
    blurb: 'Metro cabins have filtered air, cut exposure in road jams, and slash ~10 kg CO2e weekly.',
    cost: 'free',
    applicable: () => true,
    transform: (s) => {
      const next = cloneScenario(s);
      next.members = next.members.map((m) => ({
        ...m,
        blocks: m.blocks.map((b) => {
          if (b.place === 'commute') {
            return { ...b, commuteMode: 'metro' };
          }
          return b;
        }),
      }));
      return next;
    },
  },

  // 17. ALTERNATIVES: Carpool with neighbors / colleagues
  {
    id: 'carpool',
    category: 'alternative',
    title: 'Carpool with colleagues (3+ per vehicle)',
    blurb: 'Splits vehicular carbon footprint across passengers and eases peak congestion.',
    cost: 'free',
    applicable: (p) => p.hasCar,
    transform: (s) => {
      const next = cloneScenario(s);
      next.occupancy = 3;
      return next;
    },
  },

  // 18. ALTERNATIVES: Cycle short trips (Moderate AQI only)
  {
    id: 'cycle_short_trips',
    category: 'alternative',
    title: 'Cycle short errands (< 3 km)',
    blurb: 'Zero emissions for quick local trips. NOTE: Only recommended when AQI is below 150.',
    cost: 'free',
    applicable: (_p, ctx) => ctx.aqi <= 150,
    transform: (s) => {
      const next = cloneScenario(s);
      next.members = next.members.map((m) => {
        if (m.ageGroup === 'adult') {
          return {
            ...m,
            blocks: m.blocks.map((b) => {
              if (b.place === 'commute') {
                return { ...b, commuteMode: 'cycle', activity: 'brisk' };
              }
              return b;
            }),
          };
        }
        return m;
      });
      return next;
    },
  },

  // 19. ALTERNATIVES: Cooking fuel switch (Biomass -> Induction/LPG)
  {
    id: 'cooking_fuel_switch',
    category: 'alternative',
    title: 'Switch cooking from biomass to electric induction',
    blurb: 'Completely eliminates indoor combustion soot and saves up to 20 kg CO2e per week.',
    cost: 'low',
    applicable: (p) => p.cookingFuel === 'biomass',
    transform: (s) => {
      const next = cloneScenario(s);
      delete next.home.sources.cooking_no_hood;
      return next;
    },
  },

  // 20. ALTERNATIVES: Electric heating switch (Solid fuel -> Electric/Heat pump)
  {
    id: 'electric_heating_switch',
    category: 'alternative',
    title: 'Switch space heating to sealed electric radiator',
    blurb: 'Stops hazardous particle emissions from glowing coal braziers inside the home.',
    cost: 'mid',
    applicable: (p) => p.heatingFuel === 'coal_wood',
    transform: (s) => {
      const next = cloneScenario(s);
      delete next.home.sources.wood_coal_heater;
      return next;
    },
  },
];

/**
 * Applies an action by ID to a scenario without mutating original scenario.
 */
export function applyAction(scenario: Scenario, actionId: string): Scenario {
  const action = ACTION_CATALOG.find((a) => a.id === actionId);
  if (!action) return scenario;
  return action.transform(scenario);
}

/**
 * Overrides outdoor PM2.5 across all 24 hours with a constant value or scaled series.
 * Used for instant client-side Smog Simulator.
 */
export function smogOverride(scenario: Scenario, outdoorPm25: number): Scenario {
  const next = cloneScenario(scenario);
  next.outdoorPm25 = Array(24).fill(outdoorPm25);
  return next;
}

/**
 * Compares a list of actions in isolation against the baseline scenario.
 * Calculates delta in Exposure Index (EI %), cigarette equivalents, and weekly CO2e.
 * Pure function: baseline scenario is NOT modified.
 */
export function compareActions(
  baseline: Scenario,
  actionIds: string[],
  cookingFuel: CookingFuel = 'lpg',
  heatingFuel: HeatingFuel = 'none'
): ActionImpact[] {
  const baseExposure = familyExposure(baseline);
  const baseEmissions = computeEmissions(baseline, cookingFuel, heatingFuel);

  const results: ActionImpact[] = [];

  for (const id of actionIds) {
    const action = ACTION_CATALOG.find((a) => a.id === id);
    if (!action) continue;

    // Apply action to a copy of baseline
    const scenarioCopy = cloneScenario(baseline);
    const modifiedScenario = action.transform(scenarioCopy);

    // Compute updated fuels if action was a fuel switch
    let effCooking = cookingFuel;
    let effHeating = heatingFuel;
    if (id === 'cooking_fuel_switch') effCooking = 'induction';
    if (id === 'electric_heating_switch') effHeating = 'electric';

    const modExposure = familyExposure(modifiedScenario);
    const modEmissions = computeEmissions(modifiedScenario, effCooking, effHeating);

    const deltaEiPct = baseExposure.averageEi > 0
      ? Math.round(((modExposure.averageEi - baseExposure.averageEi) / baseExposure.averageEi) * 1000) / 10
      : 0;

    const deltaCigEq = Math.round((modExposure.totalCigEq - baseExposure.totalCigEq) * 10) / 10;
    const deltaCo2e = Math.round((modEmissions.totalCo2eKgWeek - baseEmissions.totalCo2eKgWeek) * 10) / 10;

    let notes: string | undefined;
    if (deltaEiPct > 0) {
      notes = 'Higher physical ventilation/activity during smog may increase lung dose.';
    }

    results.push({
      id: action.id,
      title: action.title,
      category: action.category,
      costTier: action.cost,
      deltaEiPct,
      deltaCigEq,
      deltaCo2eKgWeek: deltaCo2e,
      notes,
    });
  }

  return results;
}
