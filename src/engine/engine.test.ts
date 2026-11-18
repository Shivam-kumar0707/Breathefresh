import { describe, it, expect } from 'vitest';
import { computeExposure, familyExposure, type Scenario } from './exposure';
import { computeIndoorHour } from './indoor';
import { compareActions, ACTION_CATALOG } from './actions';
import {
  buildAllowedNumbers,
  validateTextNumbers,
  sanitizeTextWithNumberGuard,
} from './numberGuard';
import { DEMO_PERSONAS } from '../data/personas';
import { generateRuleBasedPlan } from './plannerFallback';
import { processAirData, type AirState, type RawAirData } from '../data/airApi';
import { calculateNaqi } from './naqi';
import { estimateGrapStage } from './grap';
import { computeEmissions } from './emissions';
import ghaziabadFallback from '../data/fallback/ghaziabad.json';
import { getDynamicChatFallback, hasRedFlagSymptoms } from '../../api/_lib/prompts';

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
          {
            startHour: 8,
            endHour: 9,
            place: 'commute',
            activity: 'rest',
            commuteMode: 'car_ac',
            mask: 'none',
          },
          { startHour: 9, endHour: 17, place: 'work_school', activity: 'light', mask: 'none' },
          {
            startHour: 17,
            endHour: 18,
            place: 'commute',
            activity: 'rest',
            commuteMode: 'car_ac',
            mask: 'none',
          },
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
    const validText =
      'At 14:00, with AQI 342 and PM2.5 at 185.4, your family inhaled 8.4 cigarettes.';
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
    const sanitized = sanitizeTextWithNumberGuard(
      invalidText,
      allowed,
      'Impact verified by engine.'
    );
    expect(sanitized).toContain('Impact verified by engine.');
    expect(sanitized).not.toContain('999');
  });

  // Test 8: compareActions immutability on Kraków coal-heating persona
  it('compareActions preserves Kraków persona immutability', () => {
    const krakow = DEMO_PERSONAS.find((p) => p.id === 'nowak-krakow')!;
    expect(krakow).toBeDefined();

    const cloneBefore = JSON.parse(JSON.stringify(krakow.scenario));
    const impacts = compareActions(
      krakow.scenario,
      ['electric_heating_switch', 'no_indoor_heater_burning'],
      krakow.lifestyle.cookingFuel,
      krakow.lifestyle.heatingFuel
    );

    expect(impacts.length).toBe(2);
    expect(krakow.scenario).toEqual(cloneBefore);
    const heatingImpact = impacts.find((i) => i.id === 'electric_heating_switch');
    expect(heatingImpact).toBeDefined();
    expect(heatingImpact!.deltaCo2eKgWeek).toBeLessThan(0); // cuts emissions
  });

  // Test 9: Rule-based planner fallback produces valid DailyPlan with isFallback: true
  it('generateRuleBasedPlan produces a structured plan with isFallback true and valid timeline', () => {
    const sharma = DEMO_PERSONAS.find((p) => p.id === 'sharma-ghaziabad')!;
    const mockAirState: AirState = {
      current: { time: '2026-11-18T10:00:00Z', pm2_5: 220, pm10: 340, us_aqi: 270 },
      naqi: {
        aqi: 380,
        category: 'Very Poor',
        color: '#dc2626',
        pm25SubIndex: 380,
        pm10SubIndex: 290,
        responsiblePollutant: 'PM2.5',
      },
      grapStage: estimateGrapStage(420),
      isNcr: true,
      bestWindow: { hour: 14, timeLabel: '14:00 – 16:00', pm25: 140, aqi: 190 },
      worstWindow: { hour: 7, timeLabel: '07:00 – 09:00', pm25: 350, aqi: 410 },
      inversionRisk: true,
      hourlySeries: [],
      today24hPm25: Array(24).fill(220),
      forecastDays: [],
      isSampleData: true,
      dataSourceLabel: 'Sample Data (Offline Snapshot)',
    };

    const impacts = compareActions(
      sharma.scenario,
      ACTION_CATALOG.map((a) => a.id)
    );
    const plan = generateRuleBasedPlan(sharma.scenario, mockAirState, impacts, 'en');

    expect(plan.isFallback).toBe(true);
    expect(plan.timeline.length).toBeGreaterThanOrEqual(4);
    expect(plan.topActions.length).toBeGreaterThan(0);
    expect(plan.members.length).toBe(sharma.scenario.members.length);
  });

  // Test 10: Performance benchmark - 100 iterations of familyExposure take well under 100ms
  it('Engine recompute performance: 100 iterations of familyExposure finish in < 100ms', () => {
    const sharma = DEMO_PERSONAS.find((p) => p.id === 'sharma-ghaziabad')!;
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      familyExposure(sharma.scenario);
    }
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(100); // 100 iterations in <100ms means <1ms per recompute!
  });

  // Test 11: Air API fallback processing correctly flags isSampleData and assigns label
  it('processAirData correctly labels fallback snapshots as sample data', () => {
    const airState = processAirData(ghaziabadFallback as RawAirData, 'Ghaziabad', true, true);
    expect(airState.isSampleData).toBe(true);
    expect(airState.dataSourceLabel).toContain('Sample Data');
    expect(airState.current.pm2_5).toBeGreaterThan(0);
    expect(airState.today24hPm25.length).toBe(24);
  });

  // Test 12: India NAQI sub-index calculation accuracy across CPCB breakpoints
  it('calculateNaqi correctly maps concentrations to official CPCB categories', () => {
    // Good: PM2.5 <= 30
    const good = calculateNaqi(25, 40);
    expect(good.category).toBe('Good');
    expect(good.aqi).toBeLessThanOrEqual(50);

    // Moderate: PM2.5 61-90
    const moderate = calculateNaqi(75, 120);
    expect(moderate.category).toBe('Moderate');
    expect(moderate.aqi).toBeGreaterThanOrEqual(100);

    // Severe: PM2.5 >= 250
    const severe = calculateNaqi(300, 450);
    expect(severe.category).toBe('Severe');
    expect(severe.aqi).toBeGreaterThanOrEqual(400);
  });

  // Test 13: CAQM GRAP stage estimation for Delhi NCR
  it('estimateGrapStage correctly identifies Stage I through Stage IV based on NAQI', () => {
    expect(estimateGrapStage(210)?.stage).toBe('Stage I');
    expect(estimateGrapStage(320)?.stage).toBe('Stage II');
    expect(estimateGrapStage(415)?.stage).toBe('Stage III');
    expect(estimateGrapStage(460)?.stage).toBe('Stage IV');
    expect(estimateGrapStage(150)).toBeNull(); // Below 201: No GRAP stage
  });

  // Test 14: Fuel switch emissions calculation
  it('computeEmissions calculates reductions from cooking and heating fuel transitions', () => {
    const sharma = DEMO_PERSONAS.find((p) => p.id === 'sharma-ghaziabad')!;
    const lpgEmissions = computeEmissions(sharma.scenario, 'lpg', 'none');
    const inductionEmissions = computeEmissions(sharma.scenario, 'induction', 'none');

    expect(inductionEmissions.cookingKgWeek).toBeLessThan(lpgEmissions.cookingKgWeek);
    expect(inductionEmissions.totalCo2eKgWeek).toBeLessThan(lpgEmissions.totalCo2eKgWeek);
  });

  // Test 15: Chat dynamic fallback generates question-specific answers
  it('getDynamicChatFallback generates question-specific answers for distinct user questions', () => {
    // Window question
    const windowAns = getDynamicChatFallback(
      'Can I open windows for 20 minutes right now?',
      '',
      'en'
    );
    expect(windowAns).toContain('windows');
    expect(windowAns).toContain('1:00 PM');

    // Dadaji morning walk question (Hinglish)
    const dadajiAns = getDynamicChatFallback(
      'Kya Dadaji subah walk par ja sakte hain?',
      '',
      'hinglish'
    );
    expect(dadajiAns.toLowerCase()).toContain('dadaji');
    expect(dadajiAns.toLowerCase()).toContain('walk');

    // Mask / commute question
    const maskAns = getDynamicChatFallback('Should I wear a mask to office?', '', 'en');
    expect(maskAns).toContain('N95');

    // Purifier question
    const purifierAns = getDynamicChatFallback('Where should I keep my purifier?', '', 'en');
    expect(purifierAns).toContain('purifier');

    // Red flag symptom detection
    expect(hasRedFlagSymptoms('I have severe chest pain and cannot breathe')).toBe(true);
    expect(hasRedFlagSymptoms('Can I open the window today?')).toBe(false);
  });
});
