import type { Scenario } from '../exposure';

/**
 * Deep clones a scenario to guarantee purity across engine evaluations.
 */
export function cloneScenario(s: Scenario): Scenario {
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
