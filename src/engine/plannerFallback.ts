import type { DailyPlan, PlanTimelineItem, MemberPlanTips } from '../store/useStore';
import type { Scenario } from './exposure';
import type { ActionImpact } from './actions';
import type { AirState } from '../data/airApi';

/**
 * Generates an instant, deterministic, rule-based daily air protection plan.
 * Used whenever the remote LLM API is unavailable, times out, rate limits, or returns invalid schema.
 * Constructs structured hourly timeline events, per-member vulnerability guidance, and localized headlines.
 *
 * @param scenario - The family schedule and building parameters.
 * @param air - Live or snapshot air quality state with peak/cleanest window metrics.
 * @param applicableImpacts - Evaluated actions sorted by exposure reduction.
 * @param language - Target locale (en, hi, hinglish).
 * @returns A fully validated DailyPlan with isFallback: true.
 */
export function generateRuleBasedPlan(
  scenario: Scenario,
  air: AirState,
  applicableImpacts: ActionImpact[],
  language: string = 'en'
): DailyPlan {
  // Sort actions by impact on exposure reduction
  const sorted = [...applicableImpacts].sort(
    (a, b) => Math.abs(b.deltaEiPct) - Math.abs(a.deltaEiPct)
  );

  const topActionIds = sorted.slice(0, 5).map((a) => a.id);

  const bestWin = air.bestWindow;
  const worstWin = air.worstWindow;

  // Language adaptations for headlines
  let headline = `Protection Plan: Cleanest Window ${bestWin.timeLabel}`;
  let summary = `Ambient air peaks at ${worstWin.pm25} µg/m³ during ${worstWin.timeLabel}. Keep living spaces sealed and run purifiers during morning/night inversion peaks.`;

  if (language === 'hi' || language === 'hinglish') {
    headline = `Family Air Plan: Sabse saaf samay ${bestWin.timeLabel}`;
    summary = `Smog peak ${worstWin.timeLabel} par ${worstWin.pm25} µg/m³ tak rahega. Subah khidkiyan band rakhein aur purifier chalayein.`;
  }

  // Construct structured timeline items
  const timeline: PlanTimelineItem[] = [
    {
      startHour: 6,
      endHour: 9,
      title: 'Morning Peak Smog: Keep Windows Latched & Avoid Outdoor Cardio',
      actionId: 'indoor_workout_swap',
      why: `Ground-level inversion traps cold vehicle fumes (${worstWin.pm25} µg/m³). Move all workouts indoors.`,
    },
    {
      startHour: 8,
      endHour: 10,
      title: 'Commute Protocol: N95 Mask & AC Recirculation',
      actionId: 'n95_outdoor',
      why: 'Roadside vehicle exhaust contains high black carbon and ultrafine particulates.',
    },
    {
      startHour: bestWin.hour,
      endHour: Math.min(24, bestWin.hour + 2),
      title: 'Filtered Afternoon Flush & Essential Errands',
      actionId: 'ventilate_best_window_only',
      why: `Afternoon solar heating lifts the thermal boundary layer, reducing ambient PM2.5 to ${bestWin.pm25} µg/m³.`,
    },
    {
      startHour: 18,
      endHour: 20,
      title: 'Evening Return: Run Range Hood During Cooking',
      actionId: 'cook_with_hood_or_window',
      why: 'Traps indoor cooking oils and prevent particulate spikes across bedrooms.',
    },
    {
      startHour: 21,
      endHour: 24,
      title: 'Nighttime Sleep Cleanse: Run Bedroom HEPA Purifier',
      actionId: 'purifier_bedroom',
      why: 'Maintains low particulate levels throughout 8 hours of restorative rest.',
    },
  ];

  // Generate per-member tips
  const members: MemberPlanTips[] = scenario.members.map((m) => {
    const tips: string[] = [];
    const avoid: string[] = [];

    if (m.conditions.includes('asthma_copd')) {
      tips.push(
        'Keep emergency rescue inhaler accessible; remain in air-purified room during peak morning hours.'
      );
      avoid.push('Avoid morning outdoor walking before 11:00 AM.');
    } else if (m.ageGroup === 'child') {
      tips.push('Engage in indoor creative play during after-school smog hours.');
      avoid.push('Avoid strenuous playground sports when AQI exceeds 200.');
    } else if (m.ageGroup === 'senior') {
      tips.push(
        'Hydrate with warm fluids; do gentle indoor stretching instead of early morning park walks.'
      );
      avoid.push('Avoid dry-brooming dust or burning incense in closed rooms.');
    } else {
      tips.push('Wear a well-fitted N95 mask on all outdoor errands and commutes.');
      avoid.push('Avoid idling in heavy road traffic with open vehicle windows.');
    }

    return {
      memberId: m.id,
      name: m.name,
      tips,
      avoid,
    };
  });

  return {
    headline,
    summary,
    riskLevel: air.naqi.aqi > 400 ? 'severe' : air.naqi.aqi > 300 ? 'high' : 'moderate',
    timeline,
    members,
    topActions: topActionIds,
    isFallback: true,
    generatedAt: new Date().toISOString(),
  };
}
