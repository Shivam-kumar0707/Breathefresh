import type { DailyPlan } from '../store/useStore';
import type { Scenario } from '../engine/exposure';
import { familyExposure } from '../engine/exposure';
import { compareActions, ACTION_CATALOG } from '../engine/actions';
import type { AirState } from '../data/airApi';
import { generateRuleBasedPlan } from '../engine/plannerFallback';
import { buildAllowedNumbers, sanitizeTextWithNumberGuard } from '../engine/numberGuard';
import type { ExplainOutput, VisionOutput } from '../../api/_lib/schemas';

export interface PlanApiRequest {
  language: 'en' | 'hi' | 'hinglish';
  city: string;
  aqiContext: {
    aqi: number;
    pm25: number;
    category: string;
    bestWindow: string;
    worstWindow: string;
  };
  profileSummary: string;
  applicableActions: {
    id: string;
    title: string;
    category: string;
    cost: string;
    deltaEiPct: number;
    deltaCigEq: number;
    deltaCo2eKgWeek: number;
  }[];
  grapStage?: string;
}

/**
 * Requests a personalized plan from /api/plan or immediately falls back to the deterministic engine planner.
 * Enforces the Number Guard on all textual outputs.
 */
export async function fetchDailyPlan(
  scenario: Scenario,
  air: AirState,
  cityName: string,
  language: 'en' | 'hi' | 'hinglish' = 'en',
  grapStage?: string
): Promise<DailyPlan> {
  // Compute applicable action impacts from pure deterministic engine
  const allActionIds = ACTION_CATALOG.map((a) => a.id);
  const impacts = compareActions(scenario, allActionIds);

  const applicableImpacts = impacts.filter((impact) => {
    const act = ACTION_CATALOG.find((a) => a.id === impact.id);
    if (!act) return false;
    return act.applicable(
      {
        hasPurifier: Boolean(scenario.home.purifier),
        cookingFuel: 'lpg',
        heatingFuel: 'none',
        hasCar: true,
        hasKids: scenario.members.some((m) => m.ageGroup === 'child'),
        hasVulnerable: scenario.members.some((m) => m.conditions.length > 0),
      },
      {
        aqi: air.naqi.aqi,
        currentPm25: air.current.pm2_5,
        bestHour: air.bestWindow.hour,
        worstHour: air.worstWindow.hour,
        isSevere: air.naqi.aqi > 300,
      }
    );
  });

  const payload: PlanApiRequest = {
    language,
    city: cityName,
    aqiContext: {
      aqi: air.naqi.aqi,
      pm25: air.current.pm2_5,
      category: air.naqi.category,
      bestWindow: air.bestWindow.timeLabel,
      worstWindow: air.worstWindow.timeLabel,
    },
    profileSummary: `${scenario.members.length} members (${scenario.members
      .map(
        (m) =>
          `${m.name} [${m.ageGroup}${m.conditions.length ? `, ${m.conditions.join('/')}` : ''}]`
      )
      .join(', ')}), ${scenario.home.areaM2}m² home, windows: ${scenario.home.windows}.`,
    applicableActions: applicableImpacts.map((i) => ({
      id: i.id,
      title: i.title,
      category: i.category,
      cost: i.costTier,
      deltaEiPct: i.deltaEiPct,
      deltaCigEq: i.deltaCigEq,
      deltaCo2eKgWeek: i.deltaCo2eKgWeek,
    })),
    grapStage,
  };

  // Build the strict allowed numbers set for the Number Guard
  const baseline = familyExposure(scenario);
  const allowedNumbers = buildAllowedNumbers({
    aqi: air.naqi.aqi,
    pm25: air.current.pm2_5,
    pm10: air.current.pm10,
    cigEq: baseline.averageEi / 22,
    familyCigEq: baseline.totalCigEq,
    deltas: applicableImpacts.map((i) => ({
      deltaEiPct: i.deltaEiPct,
      deltaCigEq: i.deltaCigEq,
      deltaCo2eKgWeek: i.deltaCo2eKgWeek,
    })),
  });

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);

    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    if (data.fallback) {
      throw new Error('Fallback signaled by server');
    }

    // Apply the Number Guard on all text fields from LLM
    const guardedTimeline = data.timeline.map(
      (item: {
        startHour: number;
        endHour: number;
        title: string;
        actionId: string | null;
        why: string;
      }) => ({
        ...item,
        why: sanitizeTextWithNumberGuard(item.why, allowedNumbers),
      })
    );

    const guardedMembers = data.members.map(
      (m: { memberId: string; tips: string[]; avoid: string[] }) => ({
        ...m,
        tips: m.tips.map((t: string) => sanitizeTextWithNumberGuard(t, allowedNumbers)),
        avoid: m.avoid.map((a: string) => sanitizeTextWithNumberGuard(a, allowedNumbers)),
      })
    );

    return {
      headline: sanitizeTextWithNumberGuard(data.headline, allowedNumbers),
      summary: sanitizeTextWithNumberGuard(data.summary, allowedNumbers),
      riskLevel: data.riskLevel,
      timeline: guardedTimeline,
      members: guardedMembers,
      topActions: data.topActions,
      isFallback: false,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.info('Using rule-based plan generator:', (err as Error).message);
    return generateRuleBasedPlan(scenario, air, applicableImpacts, language);
  }
}

/**
 * Calls /api/explain or returns engine explanation.
 */
export async function fetchExplanation(
  actionId: string,
  actionTitle: string,
  deltas: { deltaEiPct: number; deltaCigEq: number; deltaCo2eKgWeek: number },
  language: 'en' | 'hi' | 'hinglish' = 'en'
): Promise<ExplainOutput> {
  try {
    const res = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId, actionTitle, deltas, language }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {
    // ignore
  }

  return {
    explanation: `"${actionTitle}" changes household fine-particle exposure by ${deltas.deltaEiPct}% and saves ${Math.abs(
      deltas.deltaCigEq
    )} cigarette equivalents daily.`,
    soWhat: 'Calculated directly by physical mass balance and infiltration modeling.',
  };
}

/**
 * Uploads a base64 image to /api/vision for room analysis.
 */
export async function uploadRoomScan(imageBase64: string): Promise<VisionOutput> {
  const res = await fetch('/api/vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64 }),
  });

  if (!res.ok) {
    throw new Error('Room Scan service unavailable');
  }

  return await res.json();
}
