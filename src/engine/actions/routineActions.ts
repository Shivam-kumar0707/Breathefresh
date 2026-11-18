import type { Action } from '../actionTypes';
import { cloneScenario } from './cloneScenario';

/**
 * Routine lifestyle and schedule shifting actions.
 */
export const ROUTINE_ACTIONS: Action[] = [
  // 1. ROUTINE: Shift outdoor activity to cleanest window
  {
    id: 'shift_outdoor_to_best_window',
    category: 'routine',
    title: 'Shift outdoor hours to cleanest afternoon window',
    blurb:
      'Reschedule runs, errands and strolls away from morning smog traps into the cleanest hours.',
    cost: 'free',
    applicable: (_p, ctx) => ctx.aqi > 100,
    transform: (s) => {
      const next = cloneScenario(s);
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
    blurb:
      'Exercise increases breathing volume 3.5×. Moving workouts inside reduces heavy lung deposition.',
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
    blurb:
      'Vehicular exhaust peaks at rush hour. Shifting 45 minutes earlier or later avoids dense curb fumes.',
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
];
