import React, { useState } from 'react';
import type { PlanTimelineItem } from '../store/useStore';
import type { ActionImpact } from '../engine/actions';
import { ImpactChip } from './ImpactChip';
import { fetchExplanation } from '../lib/groqClient';
import { SparklesIcon } from './icons';

interface PlanTimelineProps {
  timeline: PlanTimelineItem[];
  impactsMap: Record<string, ActionImpact>;
  language?: 'en' | 'hi' | 'hinglish';
}

export const PlanTimeline: React.FC<PlanTimelineProps> = ({
  timeline,
  impactsMap,
  language = 'en',
}) => {
  const [explanations, setExplanations] = useState<Record<string, { explanation: string; soWhat: string }>>({});
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleExplain = async (actionId: string, title: string) => {
    if (explanations[actionId]) {
      // Toggle off if already showing
      const copy = { ...explanations };
      delete copy[actionId];
      setExplanations(copy);
      return;
    }

    const impact = impactsMap[actionId];
    if (!impact) return;

    setLoadingAction(actionId);
    try {
      const res = await fetchExplanation(
        actionId,
        title,
        {
          deltaEiPct: impact.deltaEiPct,
          deltaCigEq: impact.deltaCigEq,
          deltaCo2eKgWeek: impact.deltaCo2eKgWeek,
        },
        language
      );
      setExplanations((prev) => ({ ...prev, [actionId]: res }));
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative border-l-2 border-teal-200 ml-3 sm:ml-4 pl-4 sm:pl-6 space-y-6">
        {timeline.map((item, idx) => {
          const impact = item.actionId ? impactsMap[item.actionId] : undefined;
          const timeRangeStr = `${item.startHour.toString().padStart(2, '0')}:00 – ${item.endHour
            .toString()
            .padStart(2, '0')}:00`;
          const explanation = item.actionId ? explanations[item.actionId] : null;

          return (
            <div
              key={`${item.startHour}-${idx}`}
              data-testid="plan-item"
              className="relative group bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-2.5 transition-all hover:border-teal-300"
            >
              {/* Timeline Node Dot */}
              <div className="absolute -left-[23px] sm:-left-[31px] top-5 w-4 h-4 rounded-full bg-teal-600 border-4 border-white shadow-sm" />

              {/* Header: Time & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                  {timeRangeStr}
                </span>

                {impact && (
                  <ImpactChip
                    deltaEiPct={impact.deltaEiPct}
                    deltaCigEq={impact.deltaCigEq}
                    costTier={impact.costTier}
                  />
                )}
              </div>

              {/* Title & Personalized Reason */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                  {item.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {item.why}
                </p>
              </div>

              {/* Explain Button & Drawer */}
              {item.actionId && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleExplain(item.actionId!, item.title)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50/80 hover:bg-teal-100 px-2.5 py-1 rounded-lg transition-colors border border-teal-200"
                  >
                    <SparklesIcon className="w-3.5 h-3.5 text-teal-600" />
                    <span>
                      {loadingAction === item.actionId
                        ? 'Analyzing...'
                        : explanations[item.actionId]
                        ? 'Hide Explanation'
                        : 'Explain this Impact'}
                    </span>
                  </button>

                  {explanation && (
                    <div className="mt-3 p-3.5 rounded-xl bg-teal-50/90 border border-teal-200 text-xs text-teal-950 space-y-1.5 animate-in fade-in duration-150">
                      <p className="font-medium">{explanation.explanation}</p>
                      <p className="text-teal-800 font-semibold italic">
                        Takeaway: {explanation.soWhat}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
