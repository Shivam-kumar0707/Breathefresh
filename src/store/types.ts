import type { Scenario, Member } from '../engine/exposure';
import type { CookingFuel, HeatingFuel } from '../engine/emissions';
import type { AirState } from '../data/airApi';

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

export interface AppStore {
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
