import type { Action } from '../actionTypes';
import { cloneScenario } from './cloneScenario';

/**
 * Clean transit and fuel transition alternatives.
 */
export const ALTERNATIVE_ACTIONS: Action[] = [
  // 16. ALTERNATIVES: Metro or public bus instead of personal car
  {
    id: 'metro_or_bus_instead_of_car',
    category: 'alternative',
    title: 'Take Metro or electric bus instead of driving',
    blurb:
      'Metro cabins have filtered air, cut exposure in road jams, and slash ~10 kg CO2e weekly.',
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
