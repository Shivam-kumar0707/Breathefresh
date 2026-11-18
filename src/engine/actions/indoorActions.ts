import type { Action } from '../actionTypes';
import { cloneScenario } from './cloneScenario';

/**
 * Indoor intervention and filtration actions.
 */
export const INDOOR_ACTIONS: Action[] = [
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
    blurb:
      'Flush indoor CO2 when solar heating lifts the inversion layer and ambient PM2.5 is lowest.',
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
    blurb:
      'Traps oil droplets and ultrafine cooking aerosols before they disperse through bedrooms.',
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
    blurb:
      'Dry sweeping re-suspends settled fine dust into the breathing zone; damp mopping traps it.',
    cost: 'free',
    applicable: () => true,
    transform: (s) => {
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
        cadrM3h: Math.max(existingCadr, 450),
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
];
