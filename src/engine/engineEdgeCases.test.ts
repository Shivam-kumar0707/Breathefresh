import { describe, it, expect } from 'vitest';
import {
  computeExposure,
  getMemberRiskMultiplier,
  getRiskBand,
  type Scenario,
  type Member,
} from './exposure';
import { computeIndoorHour, computeIndoorProfile, type Home } from './indoor';
import { ACTION_CATALOG, applyAction, compareActions, smogOverride } from './actions';
import { buildAllowedNumbers, extractNumbers, sanitizeTextWithNumberGuard } from './numberGuard';
import { computeEmissions } from './emissions';
import { calculateNaqi } from './naqi';
import { estimateGrapStage, isNcrCity } from './grap';
import { generateRuleBasedPlan } from './plannerFallback';
import type { AirState } from '../data/airApi';

describe('Engine Edge Cases and Guardrails', () => {
  const dummyMember: Member = {
    id: 'm1',
    name: 'Edge User',
    ageGroup: 'adult',
    conditions: [],
    blocks: [],
  };

  const dummyHome: Home = {
    areaM2: 50,
    windows: 'closed',
    sources: {},
  };

  const dummyScenario: Scenario = {
    outdoorPm25: Array(24).fill(150),
    members: [dummyMember],
    home: dummyHome,
  };

  describe('Indoor mass-balance edge cases', () => {
    it('handles zero or negative outdoor PM2.5 and sources', () => {
      const zero = computeIndoorHour({
        outdoorPm25: 0,
        areaM2: 50,
        windows: 'closed',
        sourceAdd: 0,
      });
      expect(zero).toBe(0);

      const negative = computeIndoorHour({
        outdoorPm25: -20,
        areaM2: 50,
        windows: 'closed',
        sourceAdd: -10,
      });
      expect(negative).toBe(0);
    });

    it('handles zero or tiny room volume safely without division by zero', () => {
      const tiny = computeIndoorHour({
        outdoorPm25: 200,
        areaM2: 0,
        ceilingHeight: 0,
        windows: 'closed',
        cadrM3h: 500,
        isPurifierActive: true,
      });
      expect(tiny).toBeGreaterThan(0);
      expect(Number.isFinite(tiny)).toBe(true);
    });

    it('computes 24h indoor profile with sources and ventilation hours', () => {
      const homeWithSources: Home = {
        areaM2: 60,
        windows: 'closed',
        ventilationHours: [13, 14],
        purifier: {
          cadrM3h: 300,
          hours: [22, 23, 0, 1, 2, 3, 4, 5, 6],
        },
        sources: {
          cooking_no_hood: [8, 12, 19],
          incense: [7],
          indoor_smoking: [20],
        },
      };

      const profile = computeIndoorProfile(Array(24).fill(250), homeWithSources);
      expect(profile.length).toBe(24);
      // Hour 7 should include incense addition
      expect(profile[7]).toBeGreaterThan(profile[6]);
      // Hour 13 is ventilation window
      expect(profile[13]).toBeDefined();
    });
  });

  describe('Exposure calculation edge cases', () => {
    it('throws when requested memberId is not found', () => {
      expect(() => computeExposure(dummyScenario, 'non-existent')).toThrow();
    });

    it('applies default home rest behavior when member has no explicit schedule blocks', () => {
      const exp = computeExposure(dummyScenario, 'm1');
      expect(exp.hourly.length).toBe(24);
      expect(exp.byPlace.home).toBeGreaterThan(0);
      expect(exp.byPlace.outdoor).toBe(0);
    });

    it('computes exposure for complex multi-microenvironment schedules', () => {
      const complexMember: Member = {
        id: 'm-complex',
        name: 'Commuter',
        ageGroup: 'adult',
        conditions: ['heart'],
        blocks: [
          { startHour: 0, endHour: 8, place: 'home', activity: 'sleep', mask: 'none' },
          {
            startHour: 8,
            endHour: 9,
            place: 'commute',
            activity: 'rest',
            commuteMode: 'metro',
            mask: 'surgical',
          },
          { startHour: 9, endHour: 17, place: 'work_school', activity: 'light', mask: 'none' },
          {
            startHour: 17,
            endHour: 18,
            place: 'commute',
            activity: 'rest',
            commuteMode: 'two_wheeler',
            mask: 'n95',
          },
          { startHour: 18, endHour: 19, place: 'outdoor', activity: 'exercise', mask: 'none' },
          { startHour: 19, endHour: 24, place: 'home', activity: 'rest', mask: 'none' },
        ],
      };

      const scenario: Scenario = {
        outdoorPm25: Array(24).fill(180),
        members: [complexMember],
        home: dummyHome,
      };

      const exp = computeExposure(scenario, 'm-complex');
      expect(exp.byPlace.commute).toBeGreaterThan(0);
      expect(exp.byPlace.work_school).toBeGreaterThan(0);
      expect(exp.byPlace.outdoor).toBeGreaterThan(0);
      expect(exp.riskScore).toBeGreaterThan(exp.ei); // due to heart condition multiplier
    });

    it('correctly maps risk multipliers across age groups and conditions', () => {
      const childWithAsthma: Member = {
        id: 'c1',
        name: 'Child',
        ageGroup: 'child',
        conditions: ['asthma_copd', 'pregnant'],
        blocks: [],
      };
      const mult = getMemberRiskMultiplier(childWithAsthma);
      expect(mult).toBe(1.6); // highest of child (1.3), pregnant (1.3), asthma_copd (1.6)

      expect(getRiskBand(20)).toBe('low');
      expect(getRiskBand(50)).toBe('moderate');
      expect(getRiskBand(110)).toBe('high');
      expect(getRiskBand(300)).toBe('severe');
    });
  });

  describe('Emissions calculation edge cases', () => {
    it('handles zero members with default distance and custom fuels', () => {
      const emptyScenario: Scenario = {
        outdoorPm25: Array(24).fill(100),
        members: [],
        home: dummyHome,
        distanceKmPerDay: 25,
      };

      const em = computeEmissions(emptyScenario, 'biomass', 'coal_wood');
      expect(em.cookingKgWeek).toBe(24.0);
      expect(em.heatingKgWeek).toBe(48.0);
      expect(em.transportKgWeek).toBeGreaterThan(0);
      expect(em.totalCo2eKgWeek).toBe(em.transportKgWeek + em.cookingKgWeek + em.heatingKgWeek);
    });

    it('calculates zero transport emissions for pure walk/cycle commutes', () => {
      const activeCommuter: Member = {
        id: 'm-walk',
        name: 'Walker',
        ageGroup: 'adult',
        conditions: [],
        blocks: [
          {
            startHour: 8,
            endHour: 9,
            place: 'commute',
            activity: 'brisk',
            commuteMode: 'walk',
            mask: 'none',
          },
        ],
      };

      const scenario: Scenario = {
        outdoorPm25: Array(24).fill(50),
        members: [activeCommuter],
        home: dummyHome,
        distanceKmPerDay: 5,
      };

      const em = computeEmissions(scenario, 'induction', 'none');
      expect(em.transportKgWeek).toBe(0);
    });
  });

  describe('Action Catalog Transforms and compareActions', () => {
    it('transforms all 20 actions without mutating base scenario', () => {
      for (const action of ACTION_CATALOG) {
        const copy = JSON.parse(JSON.stringify(dummyScenario));
        const modified = action.transform(dummyScenario);
        expect(modified).toBeDefined();
        expect(dummyScenario).toEqual(copy);
      }
    });

    it('smogOverride correctly overrides all 24 hours', () => {
      const overridden = smogOverride(dummyScenario, 380);
      expect(overridden.outdoorPm25.length).toBe(24);
      expect(overridden.outdoorPm25.every((v) => v === 380)).toBe(true);
      expect(dummyScenario.outdoorPm25[0]).toBe(150);
    });

    it('applyAction returns original scenario for unknown action ID', () => {
      const res = applyAction(dummyScenario, 'unknown-action-id-999');
      expect(res).toBe(dummyScenario);
    });

    it('compares all actions in catalog with positive and negative deltas', () => {
      const allIds = ACTION_CATALOG.map((a) => a.id);
      const impacts = compareActions(dummyScenario, allIds, 'biomass', 'coal_wood');
      expect(impacts.length).toBe(ACTION_CATALOG.length);
      for (const imp of impacts) {
        expect(typeof imp.deltaEiPct).toBe('number');
        expect(typeof imp.deltaCigEq).toBe('number');
        expect(typeof imp.deltaCo2eKgWeek).toBe('number');
      }
    });
  });

  describe('NAQI and GRAP calculations', () => {
    it('calculates NAQI across all CPCB breakpoints', () => {
      expect(calculateNaqi(15).category).toBe('Good');
      expect(calculateNaqi(45).category).toBe('Satisfactory');
      expect(calculateNaqi(80).category).toBe('Moderate');
      expect(calculateNaqi(110).category).toBe('Poor');
      expect(calculateNaqi(180).category).toBe('Very Poor');
      expect(calculateNaqi(400).category).toBe('Severe');
      expect(calculateNaqi(800).category).toBe('Severe'); // extreme extrapolation capped at 500
      expect(calculateNaqi(0).aqi).toBe(0);
      expect(calculateNaqi(-10).aqi).toBe(0);

      // PM10 dominant case
      const pm10Dominant = calculateNaqi(20, 450);
      expect(pm10Dominant.responsiblePollutant).toBe('PM10');
      expect(pm10Dominant.category).toBe('Severe');
    });

    it('checks NCR cities accurately', () => {
      expect(isNcrCity('New Delhi')).toBe(true);
      expect(isNcrCity('Noida Sector 62')).toBe(true);
      expect(isNcrCity('Ghaziabad, Uttar Pradesh')).toBe(true);
      expect(isNcrCity('Gurugram')).toBe(true);
      expect(isNcrCity('Mumbai')).toBe(false);
      expect(isNcrCity('Krakow')).toBe(false);
      expect(isNcrCity('')).toBe(false);
    });

    it('estimates GRAP stage across boundaries', () => {
      expect(estimateGrapStage(100)).toBeNull();
      expect(estimateGrapStage(201)?.stage).toBe('Stage I');
      expect(estimateGrapStage(301)?.stage).toBe('Stage II');
      expect(estimateGrapStage(401)?.stage).toBe('Stage III');
      expect(estimateGrapStage(451)?.stage).toBe('Stage IV');
    });
  });

  describe('Number Guard Edge Cases', () => {
    it('extractNumbers handles empty, text-only, decimals, and multiple numbers', () => {
      expect(extractNumbers('')).toEqual([]);
      expect(extractNumbers('Pure text with no numbers')).toEqual([]);
      expect(extractNumbers('AQI 342 at 14:00 with 18.5 ug/m3')).toEqual([342, 14, 0, 18.5]);
    });

    it('buildAllowedNumbers includes clock hours, constants, and contextual deltas', () => {
      const allowed = buildAllowedNumbers({
        aqi: 280,
        pm25: 140.4,
        deltas: [{ deltaEiPct: -15.5 }],
        customAllowed: [42],
      });

      expect(allowed.has(0)).toBe(true);
      expect(allowed.has(24)).toBe(true);
      expect(allowed.has(280)).toBe(true);
      expect(allowed.has(140.4)).toBe(true);
      expect(allowed.has(140)).toBe(true); // integer variant
      expect(allowed.has(15.5)).toBe(true); // absolute variant
      expect(allowed.has(42)).toBe(true);
    });

    it('sanitizeTextWithNumberGuard handles clean text, multiple sentences, and violations', () => {
      const allowed = new Set([0, 10, 20]);
      const clean = 'At 10:00 stay inside. Air is fine.';
      expect(sanitizeTextWithNumberGuard(clean, allowed)).toContain('At 10:00 stay inside.');

      const contaminated = 'You will save 894 cigarettes. Stay inside.';
      const sanitized = sanitizeTextWithNumberGuard(
        contaminated,
        allowed,
        'Impact verified by engine.'
      );
      expect(sanitized).not.toContain('894');
      expect(sanitized).toContain('Impact verified by engine.');
    });
  });

  describe('Rule-based plan generator edge cases', () => {
    it('generates Hindi/Hinglish plans when requested', () => {
      const mockAir: AirState = {
        current: { time: '2026-11-19T10:00:00Z', pm2_5: 350, pm10: 480, us_aqi: 400 },
        naqi: {
          aqi: 420,
          category: 'Severe',
          color: '#9333ea',
          pm25SubIndex: 420,
          pm10SubIndex: 380,
          responsiblePollutant: 'PM2.5',
        },
        grapStage: estimateGrapStage(420),
        isNcr: true,
        bestWindow: { hour: 14, timeLabel: '14:00 – 16:00', pm25: 180, aqi: 240 },
        worstWindow: { hour: 7, timeLabel: '07:00 – 09:00', pm25: 420, aqi: 450 },
        inversionRisk: true,
        hourlySeries: [],
        today24hPm25: Array(24).fill(350),
        forecastDays: [],
        isSampleData: true,
        dataSourceLabel: 'Snapshot',
      };

      const impacts = compareActions(dummyScenario, ['n95_outdoor']);
      const planHi = generateRuleBasedPlan(dummyScenario, mockAir, impacts, 'hi');
      expect(planHi.headline).toContain('Family Air Plan');
      expect(planHi.summary).toContain('khidkiyan band rakhein');
      expect(planHi.riskLevel).toBe('severe');
    });
  });
});
