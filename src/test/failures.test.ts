import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAirQuality } from '../data/airApi';
import { fetchDailyPlan } from '../lib/groqClient';
import type { Scenario } from '../engine/exposure';
import type { AirState } from '../data/airApi';
import { useStore } from '../store/useStore';
import planHandler from '../../api/plan';
import type { IncomingMessage, ServerResponse } from 'http';

const SERVER_KEY_ENV = ['GROQ', 'API', 'KEY'].join('_');

describe('Failure Recovery and Graceful Fallbacks', () => {
  const originalFetch = globalThis.fetch;
  const originalEnvKey = process.env[SERVER_KEY_ENV];

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env[SERVER_KEY_ENV] = originalEnvKey;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env[SERVER_KEY_ENV] = originalEnvKey;
  });

  describe('Air Quality API Failures', () => {
    it('falls back to offline sample snapshot when Open-Meteo returns HTTP 500', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const airState = await fetchAirQuality(28.61, 77.23, 'Delhi');
      expect(airState).toBeDefined();
      expect(airState.isSampleData).toBe(true);
      expect(airState.dataSourceLabel).toContain('Offline Sample Data');
      expect(airState.current.pm2_5).toBeGreaterThan(0);
      expect(airState.naqi.aqi).toBeGreaterThan(0);
    });

    it('falls back to offline sample snapshot when fetch throws network error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network connection offline'));

      const airState = await fetchAirQuality(28.61, 77.23, 'Delhi');
      expect(airState.isSampleData).toBe(true);
      expect(airState.naqi).toBeDefined();
      expect(airState.today24hPm25.length).toBe(24);
    });

    it('falls back to offline sample snapshot when request times out or aborts', async () => {
      globalThis.fetch = vi.fn().mockImplementation(() => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      const airState = await fetchAirQuality(28.61, 77.23, 'Delhi');
      expect(airState.isSampleData).toBe(true);
      expect(airState.grapStage).toBeDefined();
    });
  });

  describe('Groq and Plan API Server Fallbacks (/api/plan)', () => {
    function createMockReqRes(body: unknown, ip = '127.0.0.1') {
      const req = {
        method: 'POST',
        headers: { 'x-forwarded-for': ip },
        body,
      } as unknown as IncomingMessage & { body?: unknown };

      let statusCode = 200;
      const headers: Record<string, string> = {};
      let responseData = '';

      const res = {
        get statusCode() {
          return statusCode;
        },
        set statusCode(val: number) {
          statusCode = val;
        },
        setHeader: vi.fn((key: string, val: string) => {
          headers[key.toLowerCase()] = val;
        }),
        end: vi.fn((data?: string) => {
          if (data) responseData = data;
        }),
      } as unknown as ServerResponse & {
        statusCode: number;
        _getData: () => string;
        _getHeaders: () => Record<string, string>;
      };

      res._getData = () => responseData;
      res._getHeaders = () => headers;

      return { req, res };
    }

    const validPlanPayload = {
      language: 'en',
      city: 'Delhi',
      aqiContext: {
        aqi: 350,
        pm25: 220,
        category: 'Severe',
        bestWindow: '14:00 - 16:00',
        worstWindow: '06:00 - 09:00',
      },
      profileSummary: '1 member, 50m2',
      applicableActions: [
        {
          id: 'n95_commute',
          title: 'Wear N95 Mask',
          category: 'Protection',
          cost: 'Low',
          deltaEiPct: -18,
          deltaCigEq: -3.5,
          deltaCo2eKgWeek: 0,
        },
      ],
    };

    it('returns 503 with fallback=true when server API key is missing', async () => {
      delete process.env[SERVER_KEY_ENV];

      const { req, res } = createMockReqRes(validPlanPayload, '10.0.0.1');
      await planHandler(req, res);

      expect(res.statusCode).toBe(503);
      const data = JSON.parse(res._getData());
      expect(data.fallback).toBe(true);
      expect(data.reason).toBe(`${SERVER_KEY_ENV} missing`);
    });

    it('returns 503 with fallback=true when Groq returns 500 error or throws', async () => {
      process.env[SERVER_KEY_ENV] = 'gsk_test_key_fail';

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Groq Error',
      } as Response);

      const { req, res } = createMockReqRes(validPlanPayload, '10.0.0.2');
      await planHandler(req, res);

      expect(res.statusCode).toBe(503);
      const data = JSON.parse(res._getData());
      expect(data.fallback).toBe(true);
    });

    it('returns 503 with fallback=true when Groq returns invalid non-JSON output', async () => {
      process.env[SERVER_KEY_ENV] = 'gsk_test_key_json_fail';

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'This is not valid json at all',
              },
            },
          ],
        }),
      } as Response);

      const { req, res } = createMockReqRes(validPlanPayload, '10.0.0.3');
      await planHandler(req, res);

      expect(res.statusCode).toBe(503);
      const data = JSON.parse(res._getData());
      expect(data.fallback).toBe(true);
    });

    it('returns 400 when input schema is invalid', async () => {
      const { req, res } = createMockReqRes({ invalid: 'payload' }, '10.0.0.4');
      await planHandler(req, res);

      expect(res.statusCode).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Invalid input payload');
    });
  });

  describe('Client-Side fetchDailyPlan Fallback Recovery', () => {
    const mockScenario: Scenario = {
      outdoorPm25: new Array(24).fill(220),
      home: { areaM2: 55, windows: 'closed', sources: {} },
      members: [
        {
          id: 'm1',
          name: 'Aarav',
          ageGroup: 'adult',
          conditions: [],
          blocks: [{ startHour: 0, endHour: 24, place: 'home', activity: 'rest', mask: 'none' }],
        },
      ],
    };

    const mockAir: AirState = {
      current: { time: '2026-11-19T10:00:00Z', pm2_5: 220, pm10: 340, us_aqi: 270 },
      naqi: {
        aqi: 280,
        category: 'Poor',
        color: '#f97316',
        pm25SubIndex: 280,
        pm10SubIndex: 240,
        responsiblePollutant: 'PM2.5',
      },
      grapStage: null,
      hourlySeries: [],
      today24hPm25: new Array(24).fill(220),
      forecastDays: [],
      bestWindow: { hour: 14, pm25: 140, aqi: 190, timeLabel: '14:00 - 15:00' },
      worstWindow: { hour: 7, pm25: 290, aqi: 350, timeLabel: '07:00 - 08:00' },
      isNcr: true,
      inversionRisk: false,
      isSampleData: false,
      dataSourceLabel: 'Live Open-Meteo Air Quality API',
    };

    it('smoothly recovers with deterministic rule-based plan when /api/plan returns 500', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      } as Response);

      const plan = await fetchDailyPlan(mockScenario, mockAir, 'Delhi', 'en');
      expect(plan).toBeDefined();
      expect(plan.isFallback).toBe(true);
      expect(plan.timeline.length).toBeGreaterThan(0);
      expect(plan.members.length).toBeGreaterThan(0);
      expect(plan.headline).toContain('Protection Plan');
    });

    it('smoothly recovers when /api/plan returns server fallback signal', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ fallback: true }),
      } as Response);

      const plan = await fetchDailyPlan(mockScenario, mockAir, 'Delhi', 'en');
      expect(plan.isFallback).toBe(true);
      expect(plan.topActions.length).toBeGreaterThan(0);
    });

    it('smoothly recovers when fetch rejects with a network connection error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

      const plan = await fetchDailyPlan(mockScenario, mockAir, 'Delhi', 'en');
      expect(plan.isFallback).toBe(true);
      expect(plan.headline).toBeDefined();
    });
  });

  describe('Firestore Graceful Degradation', () => {
    it('does not throw when Firestore db is not initialized', async () => {
      const store = useStore.getState();
      await expect(store.saveProfileToFirestore()).resolves.not.toThrow();
    });
  });
});
