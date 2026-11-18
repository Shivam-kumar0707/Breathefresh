import { create } from 'zustand';
import { getDeviceId } from '../lib/deviceId';
import { DEMO_PERSONAS } from '../data/personas';
import type { Scenario, Member } from '../engine/exposure';
import type { CookingFuel, HeatingFuel } from '../engine/emissions';
import { type AirState, fetchAirQuality } from '../data/airApi';
import { db, doc, setDoc } from '../lib/firebase';

export interface PlanTimelineItem {
  startHour: number;
  endHour: number;
  title: string;
  actionId: string | null;
  why: string;
}

export interface MemberPlanTips {
  memberId: string;
  name?: string;
  tips: string[];
  avoid: string[];
}

export interface DailyPlan {
  headline: string;
  summary: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  timeline: PlanTimelineItem[];
  members: MemberPlanTips[];
  topActions: string[];
  isFallback: boolean;
  generatedAt: string;
}

export interface UserProfile {
  deviceId: string;
  city: {
    name: string;
    displayName: string;
    lat: number;
    lon: number;
    country: string;
  };
  members: Member[];
  lifestyle: {
    homeAreaM2: number;
    hasPurifier: boolean;
    cadrM3h?: number;
    cookingFuel: CookingFuel;
    heatingFuel: HeatingFuel;
    commuteMode: 'car_petrol' | 'two_wheeler' | 'metro' | 'bus';
    commuteKm: number;
    budgetTier: 'zero' | 'low' | 'mid';
  };
  language: 'en' | 'hi' | 'hinglish';
  createdAt?: string;
  updatedAt?: string;
}

interface AppStore {
  profile: UserProfile;
  air: AirState | null;
  isLoadingAir: boolean;
  scenario: Scenario;
  plan: DailyPlan | null;
  isGeneratingPlan: boolean;
  isRuleBasedFallback: boolean;
  selectedActions: string[];
  smogOverride: number | null; // null means use live series
  isChatOpen: boolean;

  // Actions
  setProfile: (profile: Partial<UserProfile>) => void;
  loadPersona: (personaId: string) => Promise<void>;
  updateMember: (memberId: string, updates: Partial<Member>) => void;
  addMember: (member: Member) => void;
  removeMember: (memberId: string) => void;
  setLanguage: (lang: 'en' | 'hi' | 'hinglish') => void;
  setSmogOverride: (val: number | null) => void;
  toggleAction: (actionId: string) => void;
  setSelectedActions: (actions: string[]) => void;
  setPlan: (plan: DailyPlan, isFallback?: boolean) => void;
  setIsChatOpen: (open: boolean) => void;
  refreshAirData: () => Promise<void>;
  saveProfileToFirestore: () => Promise<void>;
}

const defaultPersona = DEMO_PERSONAS[0]; // The Sharma Family

// Load cached profile or default to Sharma
function getInitialProfile(): UserProfile {
  const deviceId = getDeviceId();
  try {
    const cached = localStorage.getItem('breathefresh_profile');
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...parsed, deviceId };
    }
  } catch {
    // ignore
  }

  return {
    deviceId,
    city: {
      name: defaultPersona.city.name,
      displayName: `${defaultPersona.city.name}, ${defaultPersona.city.country}`,
      lat: defaultPersona.city.lat,
      lon: defaultPersona.city.lon,
      country: defaultPersona.city.country,
    },
    members: defaultPersona.scenario.members,
    lifestyle: {
      homeAreaM2: defaultPersona.lifestyle.homeAreaM2,
      hasPurifier: defaultPersona.lifestyle.hasPurifier,
      cadrM3h: defaultPersona.lifestyle.cadrM3h,
      cookingFuel: defaultPersona.lifestyle.cookingFuel,
      heatingFuel: defaultPersona.lifestyle.heatingFuel,
      commuteMode: defaultPersona.lifestyle.commuteMode,
      commuteKm: defaultPersona.lifestyle.commuteKm,
      budgetTier: defaultPersona.lifestyle.budgetTier,
    },
    language: 'en',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const initialProfile = getInitialProfile();

export const useStore = create<AppStore>((set, get) => ({
  profile: initialProfile,
  air: null,
  isLoadingAir: false,
  scenario: defaultPersona.scenario,
  plan: null,
  isGeneratingPlan: false,
  isRuleBasedFallback: false,
  selectedActions: ['n95_outdoor', 'purifier_bedroom'],
  smogOverride: null,
  isChatOpen: false,

  setProfile: (updates) => {
    set((state) => {
      const updatedProfile = {
        ...state.profile,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem('breathefresh_profile', JSON.stringify(updatedProfile));
      } catch {
        // ignore
      }
      return { profile: updatedProfile };
    });
  },

  loadPersona: async (personaId: string) => {
    const target = DEMO_PERSONAS.find((p) => p.id === personaId) ?? DEMO_PERSONAS[0];
    const deviceId = get().profile.deviceId;

    const newProfile: UserProfile = {
      deviceId,
      city: {
        name: target.city.name,
        displayName: `${target.city.name}, ${target.city.country}`,
        lat: target.city.lat,
        lon: target.city.lon,
        country: target.city.country,
      },
      members: target.scenario.members,
      lifestyle: {
        homeAreaM2: target.lifestyle.homeAreaM2,
        hasPurifier: target.lifestyle.hasPurifier,
        cadrM3h: target.lifestyle.cadrM3h,
        cookingFuel: target.lifestyle.cookingFuel,
        heatingFuel: target.lifestyle.heatingFuel,
        commuteMode: target.lifestyle.commuteMode,
        commuteKm: target.lifestyle.commuteKm,
        budgetTier: target.lifestyle.budgetTier,
      },
      language: target.lifestyle.language,
      updatedAt: new Date().toISOString(),
    };

    set({
      profile: newProfile,
      scenario: target.scenario,
      selectedActions: ['n95_outdoor', 'purifier_bedroom'],
      smogOverride: null,
    });

    try {
      localStorage.setItem('breathefresh_profile', JSON.stringify(newProfile));
    } catch {
      // ignore
    }

    await get().refreshAirData();
    get().saveProfileToFirestore();
  },

  updateMember: (memberId, updates) => {
    set((state) => {
      const updatedMembers = state.profile.members.map((m) =>
        m.id === memberId ? { ...m, ...updates } : m
      );
      const updatedProfile = {
        ...state.profile,
        members: updatedMembers,
        updatedAt: new Date().toISOString(),
      };
      const updatedScenario: Scenario = {
        ...state.scenario,
        members: updatedMembers,
      };
      try {
        localStorage.setItem('breathefresh_profile', JSON.stringify(updatedProfile));
      } catch {
        // ignore
      }
      return { profile: updatedProfile, scenario: updatedScenario };
    });
  },

  addMember: (member) => {
    set((state) => {
      if (state.profile.members.length >= 6) return state;
      const updatedMembers = [...state.profile.members, member];
      const updatedProfile = {
        ...state.profile,
        members: updatedMembers,
        updatedAt: new Date().toISOString(),
      };
      const updatedScenario: Scenario = {
        ...state.scenario,
        members: updatedMembers,
      };
      try {
        localStorage.setItem('breathefresh_profile', JSON.stringify(updatedProfile));
      } catch {
        // ignore
      }
      return { profile: updatedProfile, scenario: updatedScenario };
    });
  },

  removeMember: (memberId) => {
    set((state) => {
      if (state.profile.members.length <= 1) return state;
      const updatedMembers = state.profile.members.filter((m) => m.id !== memberId);
      const updatedProfile = {
        ...state.profile,
        members: updatedMembers,
        updatedAt: new Date().toISOString(),
      };
      const updatedScenario: Scenario = {
        ...state.scenario,
        members: updatedMembers,
      };
      try {
        localStorage.setItem('breathefresh_profile', JSON.stringify(updatedProfile));
      } catch {
        // ignore
      }
      return { profile: updatedProfile, scenario: updatedScenario };
    });
  },

  setLanguage: (lang) => {
    set((state) => ({
      profile: { ...state.profile, language: lang },
    }));
  },

  setSmogOverride: (val) => {
    set({ smogOverride: val });
  },

  toggleAction: (actionId) => {
    set((state) => {
      const exists = state.selectedActions.includes(actionId);
      const nextActions = exists
        ? state.selectedActions.filter((id) => id !== actionId)
        : [...state.selectedActions, actionId];
      return { selectedActions: nextActions };
    });
  },

  setSelectedActions: (actions) => {
    set({ selectedActions: actions });
  },

  setPlan: (plan, isFallback = false) => {
    set({ plan, isRuleBasedFallback: isFallback, isGeneratingPlan: false });
  },

  setIsChatOpen: (open) => {
    set({ isChatOpen: open });
  },

  refreshAirData: async () => {
    const { profile } = get();
    set({ isLoadingAir: true });
    try {
      const airData = await fetchAirQuality(
        profile.city.lat,
        profile.city.lon,
        profile.city.name
      );

      set((state) => {
        // Update scenario outdoor series from airData today24hPm25
        const updatedScenario: Scenario = {
          ...state.scenario,
          outdoorPm25: airData.today24hPm25,
          home: {
            ...state.scenario.home,
            areaM2: profile.lifestyle.homeAreaM2,
            purifier: profile.lifestyle.hasPurifier
              ? { cadrM3h: profile.lifestyle.cadrM3h ?? 250, hours: [22, 23, 0, 1, 2, 3, 4, 5, 6] }
              : undefined,
          },
          distanceKmPerDay: profile.lifestyle.commuteKm,
        };

        return {
          air: airData,
          scenario: updatedScenario,
          isLoadingAir: false,
        };
      });
    } catch (err) {
      console.warn('refreshAirData failed, continuing with scenario:', err);
      set({ isLoadingAir: false });
    }
  },

  saveProfileToFirestore: async () => {
    const { profile } = get();
    if (!db) return; // Silent fallback if no Firebase configured

    try {
      const profileDoc = doc(db, 'profiles', profile.deviceId);
      await setDoc(
        profileDoc,
        {
          city: profile.city,
          members: profile.members,
          lifestyle: profile.lifestyle,
          language: profile.language,
          createdAt: profile.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore profile sync failed silently:', err);
    }
  },
}));
