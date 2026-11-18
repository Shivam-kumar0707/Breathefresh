import { describe, it, expect } from 'vitest';
import { computeExposure, familyExposure, type Scenario } from './exposure';
import { computeIndoorHour } from './indoor';
import { compareActions } from './actions';
import { buildAllowedNumbers, validateTextNumbers, sanitizeTextWithNumberGuard } from './numberGuard';
import { DEMO_PERSONAS } from '../data/personas';

describe('BreatheFresh Impact Engine', () => {
  const baseScenario: Scenario = {
    outdoorPm25: Array(24).fill(100),
    members: [
      {
        id: 'user-1',
        name: 'Test User',
        ageGroup: 'adult',
        conditions: [],
        blocks: [
          { startHour: 0, endHour: 8, place: 'home', activity: 'sleep', mask: 'none' },
          { startHour: 8, endHour: 9, place: 'commute', activity: 'rest', commuteMode: 'car_ac', mask: 'none' },
          { startHour: 9, endHour: 17, place: 'work_school', activity: 'light', mask: 'none' },
          { startHour: 17, endHour: 18, place: 'commute', activity: 'rest', commuteMode: 'car_ac', mask: 'none' },
          { startHour: 18, endHour: 24, place: 'home', activity: 'rest', mask: 'none' },
        ],
      },
    ],
    home: {
      areaM2: 80,
      windows: 'closed',
      sources: {},
    },
  };

  // Test 1: AQI 0 gives EI 0
  it('AQI 0 gives EI 0 when no indoor sources exist', () => {
    const zeroScenario: Scenario = {
      ...baseScenario,
      outdoorPm25: Array(24).fill(0),
      home: { areaM2: 80, windows: 'closed', sources: {} },
    };
    const res = computeExposure(zeroScenario, 'user-1');
    expect(res.ei).toBe(0);
    expect(res.cigEq).toBe(0);
  });

  // Test 2: N95 on outdoor and commute blocks strictly reduces EI
  it('N95 on outdoor and commute blocks strictly reduces EI', () => {
    const unmaskedScenario: Scenario = {
      ...baseScenario,
      members: [
        {
          id: 'user-1',
          name: 'Test User',
          ageGroup: 'adult',
          conditions: [],
          blocks: [
            { startHour: 0, endHour: 12, place: 'home', activity: 'rest', mask: 'none' },
            { startHour: 12, endHour: 24, place: 'outdoor', activity: 'brisk', mask: 'none' },
          ],
        },
      ],
    };

    const maskedScenario: Scenario = {
      ...unmaskedScenario,
      members: [
        {
          ...unmaskedScenario.members[0],
          blocks: [
            { startHour: 0, endHour: 12, place: 'home', activity: 'rest', mask: 'none' },
            { startHour: 12, endHour: 24, place: 'outdoor', activity: 'brisk', mask: 'n95' },
          ],
        },
      ],
    };

    const unmasked = computeExposure(unmaskedScenario, 'user-1');
    const masked = computeExposure(maskedScenario, 'user-1');

    expect(masked.ei).toBeLessThan(unmasked.ei);
    expect(masked.cigEq).toBeLessThan(unmasked.cigEq);
  });

  // Test 3: Purifier on reduces indoor concentration and never goes below the clamp
  it('Purifier on reduces indoor concentration and never goes below the clamp (0.05 * C_out)', () => {
    const outdoorPm25 = 300;
    const withoutPurifier = computeIndoorHour({
      outdoorPm25,
      areaM2: 40,
      windows: 'closed',
      cadrM3h: 0,
      isPurifierActive: false,
    });

    const withPurifier = computeIndoorHour({
      outdoorPm25,
      areaM2: 40,
      windows: 'closed',
      cadrM3h: 400,
      isPurifierActive: true,
    });

    // Extreme purifier with massive CADR
    const extremePurifier = computeIndoorHour({
      outdoorPm25,
      areaM2: 40,
      windows: 'sealed',
      cadrM3h: 50000,
      isPurifierActive: true,
    });

    expect(withPurifier).toBeLessThan(withoutPurifier);
    // Must respect clamp of 0.05 * C_out = 15
    expect(extremePurifier).toBeGreaterThanOrEqual(0.05 * outdoorPm25);
  });

  // Test 4: Opening windows during a spike increases home exposure
  it('Opening windows during a spike increases home exposure', () => {
    const outdoorSpike = 400;
    const closed = computeIndoorHour({
      outdoorPm25: outdoorSpike,
      areaM2: 50,
      windows: 'closed',
    });

    const open = computeIndoorHour({
      outdoorPm25: outdoorSpike,
      areaM2: 50,
      windows: 'open',
    });

    expect(open).toBeGreaterThan(closed);
  });

  // Test 5: compareActions leaves the baseline scenario unmodified (purity)
  it('compareActions leaves the baseline scenario unmodified (purity)', () => {
    const initialClone = JSON.parse(JSON.stringify(baseScenario));
    const impacts = compareActions(baseScenario, ['n95_outdoor', 'purifier_bedroom']);

    expect(impacts.length).toBe(2);
    expect(baseScenario).toEqual(initialClone);
  });

  // Test 6: The Sharma persona produces stable snapshot numbers
  it('The Sharma persona produces stable snapshot numbers', () => {
    const sharma = DEMO_PERSONAS.find((p) => p.id === 'sharma-ghaziabad')!;
    expect(sharma).toBeDefined();

    const baseline = familyExposure(sharma.scenario);

    // Verifying stable snapshot numbers
    expect(baseline.totalCigEq).toBeGreaterThan(30);
    expect(baseline.totalCigEq).toBeLessThan(60);
    expect(baseline.averageEi).toBeGreaterThan(150);
    expect(baseline.maxBand).toBe('severe');

    // Specific member check for Dadaji (COPD, highest risk multiplier)
    const dadajiExp = baseline.perMember['m-dadaji'];
    expect(dadajiExp).toBeDefined();
    expect(dadajiExp.band).toBe('severe');
    expect(dadajiExp.riskScore).toBeGreaterThan(dadajiExp.ei);
  });

  // Test 7: Number guard accepts engine numbers and rejects invented ones
  it('Number guard accepts engine numbers and rejects invented ones', () => {
    const allowed = buildAllowedNumbers({
      aqi: 342,
      pm25: 185.4,
      cigEq: 8.4,
      familyCigEq: 42.1,
      deltas: [{ deltaEiPct: -25.5, deltaCigEq: -2.1 }],
    });

    // Valid text using approved engine numbers and hours
    const validText = 'At 14:00, with AQI 342 and PM2.5 at 185.4, your family inhaled 8.4 cigarettes.';
    const validation1 = validateTextNumbers(validText, allowed);
    expect(validation1.valid).toBe(true);
    expect(validation1.offendingNumbers.length).toBe(0);

    // Invalid text with hallucinated numbers
    const invalidText = 'This action cuts exposure by 999% and saves 73.8 cigarettes immediately.';
    const validation2 = validateTextNumbers(invalidText, allowed);
    expect(validation2.valid).toBe(false);
    expect(validation2.offendingNumbers).toContain(999);
    expect(validation2.offendingNumbers).toContain(73.8);

    // Sanitization replaces sentences containing unverified numbers
    const sanitized = sanitizeTextWithNumberGuard(invalidText, allowed, 'Impact verified by engine.');
    expect(sanitized).toContain('Impact verified by engine.');
    expect(sanitized).not.toContain('999');
  });
});
