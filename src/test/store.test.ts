import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';
import { getDeviceId } from '../lib/deviceId';
import { searchCities, DEFAULT_POPULAR_CITIES } from '../data/geocode';
import { fetchExplanation, uploadRoomScan } from '../lib/groqClient';
import type { Member } from '../engine/exposure';

describe('Store, Identity & Service Helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('Zustand App Store Actions', () => {
    it('updates profile and updates localStorage', () => {
      const store = useStore.getState();
      store.setProfile({ language: 'hi' });

      expect(useStore.getState().profile.language).toBe('hi');
      const saved = JSON.parse(localStorage.getItem('breathefresh_profile') || '{}');
      expect(saved.language).toBe('hi');
    });

    it('loads demo persona Sharma Ghaziabad', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          current: { time: '2026-11-19T10:00:00Z', pm2_5: 220, pm10: 340, us_aqi: 270 },
          hourly: {
            time: new Array(48).fill('2026-11-19T10:00:00Z'),
            pm2_5: new Array(48).fill(220),
            pm10: new Array(48).fill(340),
            us_aqi: new Array(48).fill(270),
          },
        }),
      });

      const store = useStore.getState();
      await store.loadPersona('sharma-ghaziabad');

      const state = useStore.getState();
      expect(state.profile.city.name).toContain('Ghaziabad');
      expect(state.scenario.members.length).toBeGreaterThan(0);
    });

    it('manages member additions, updates, and removal boundaries', () => {
      const store = useStore.getState();
      expect(store.profile.members.length).toBeGreaterThan(0);

      const newMember: Member = {
        id: 'new_m1',
        name: 'Grandpa',
        ageGroup: 'senior',
        conditions: ['heart'],
        blocks: [{ startHour: 0, endHour: 24, place: 'home', activity: 'rest', mask: 'none' }],
      };

      store.addMember(newMember);
      expect(useStore.getState().profile.members.some((m) => m.id === 'new_m1')).toBe(true);

      // Update member
      store.updateMember('new_m1', { name: 'Grandpa Om' });
      expect(useStore.getState().profile.members.find((m) => m.id === 'new_m1')?.name).toBe(
        'Grandpa Om'
      );

      // Remove member
      store.removeMember('new_m1');
      expect(useStore.getState().profile.members.some((m) => m.id === 'new_m1')).toBe(false);

      // Cannot remove below 1 member
      const remaining = useStore.getState().profile.members;
      for (const m of remaining) {
        store.removeMember(m.id);
      }
      expect(useStore.getState().profile.members.length).toBeGreaterThanOrEqual(1);
    });

    it('manages toggle actions and selection sets', () => {
      const store = useStore.getState();
      store.setSelectedActions(['n95_commute']);
      expect(useStore.getState().selectedActions).toEqual(['n95_commute']);

      // Toggle action on
      store.toggleAction('hepa_purifier_bedroom');
      expect(useStore.getState().selectedActions).toContain('hepa_purifier_bedroom');

      // Toggle action off
      store.toggleAction('n95_commute');
      expect(useStore.getState().selectedActions).not.toContain('n95_commute');
    });

    it('manages language, smog override, and chat open states', () => {
      const store = useStore.getState();
      store.setLanguage('hinglish');
      expect(useStore.getState().profile.language).toBe('hinglish');

      store.setSmogOverride(420);
      expect(useStore.getState().smogOverride).toBe(420);
      store.setSmogOverride(null);
      expect(useStore.getState().smogOverride).toBeNull();

      store.setIsChatOpen(true);
      expect(useStore.getState().isChatOpen).toBe(true);
    });
  });

  describe('Device ID Generation', () => {
    it('returns a persistent 36-character UUID from localStorage', () => {
      const id1 = getDeviceId();
      expect(id1).toHaveLength(36);

      const id2 = getDeviceId();
      expect(id2).toBe(id1);
    });
  });

  describe('Geocoding City Search', () => {
    it('returns popular cities if query is shorter than 2 chars', async () => {
      const res = await searchCities('D');
      expect(res).toEqual(DEFAULT_POPULAR_CITIES);
    });

    it('parses geocoding api response for valid query', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              id: 12345,
              name: 'Kanpur',
              latitude: 26.4499,
              longitude: 80.3319,
              country: 'India',
              admin1: 'Uttar Pradesh',
            },
          ],
        }),
      } as Response);

      const res = await searchCities('Kanpur');
      expect(res.length).toBe(1);
      expect(res[0].name).toBe('Kanpur');
      expect(res[0].displayName).toBe('Kanpur, Uttar Pradesh, India');
    });

    it('falls back to filtered default popular cities on fetch failure', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const res = await searchCities('Delhi');
      expect(res.length).toBeGreaterThan(0);
      expect(res[0].name).toBe('Delhi');
    });
  });

  describe('Groq Client AI Helpers & Fallbacks', () => {
    it('fetches explanation with deterministic engine fallback when server returns 500', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const exp = await fetchExplanation(
        'n95_commute',
        'Wear N95 Mask',
        { deltaEiPct: -18, deltaCigEq: -3.5, deltaCo2eKgWeek: 0 },
        'en'
      );

      expect(exp).toBeDefined();
      expect(exp.explanation).toContain('18%');
      expect(exp.soWhat).toBeDefined();
    });

    it('rejects when vision api fails', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      await expect(uploadRoomScan('data:image/jpeg;base64,...')).rejects.toThrow(
        'Room Scan service unavailable'
      );
    });
  });
});
