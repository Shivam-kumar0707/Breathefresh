import React, { useState } from 'react';
import type { MemberExposure } from '../engine/exposure';
import type { MemberPlanTips } from '../store/useStore';
import { InfoIcon, ShieldIcon } from './icons';

interface MemberCardProps {
  exposure: MemberExposure;
  tips?: MemberPlanTips;
  ageGroup: string;
  conditions: string[];
}

export const MemberCard: React.FC<MemberCardProps> = ({ exposure, tips, ageGroup, conditions }) => {
  const [showInfo, setShowInfo] = useState(false);

  const bandColors = {
    low: { bg: 'bg-emerald-100 text-emerald-950 border-emerald-400' },
    moderate: { bg: 'bg-amber-100 text-amber-950 border-amber-400' },
    high: { bg: 'bg-orange-100 text-orange-950 border-orange-400' },
    severe: { bg: 'bg-purple-100 text-purple-950 border-purple-400' },
  };

  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">{exposure.name}</h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
              {ageGroup}
            </span>
          </div>
          {conditions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {conditions.map((c) => (
                <span
                  key={c}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-300"
                >
                  {c === 'asthma_copd' ? 'Asthma / COPD' : c}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Risk Band Badge */}
        <span
          className={`px-2.5 py-1 text-xs font-bold rounded-lg border capitalize ${
            bandColors[exposure.band].bg
          }`}
        >
          {exposure.band} Risk
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
        <div className="p-2.5 bg-slate-50 rounded-lg">
          <span className="text-[11px] text-slate-500 block">Personal Cig-Equiv</span>
          <span className="text-xl font-extrabold text-slate-800">
            {exposure.cigEq} <span className="text-xs font-normal text-slate-500">cigs/day</span>
          </span>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-lg relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Risk-Adjusted Score</span>
            <button
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              className="text-slate-400 hover:text-teal-600 p-0.5"
              aria-label="How risk score is computed"
            >
              <InfoIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-xl font-extrabold text-teal-700">{exposure.riskScore}</span>
        </div>
      </div>

      {/* Assumptions popup */}
      {showInfo && (
        <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900 space-y-1">
          <p className="font-semibold">Calculation Breakdown:</p>
          <p>
            Exposure Index (EI): <strong>{exposure.ei} µg/m³</strong>.
          </p>
          <p>
            Cigarette equivalence: {exposure.ei} ÷ 22 ≈ <strong>{exposure.cigEq}</strong> cigs/day
            (Berkeley Earth heuristic).
          </p>
          <p>
            Vulnerability multiplier applied for {ageGroup}
            {conditions.length ? ` + ${conditions.join(', ')}` : ''}.
          </p>
        </div>
      )}

      {/* Plan Tips */}
      {tips && (
        <div className="space-y-1.5 pt-1 text-xs">
          {tips.tips.map((tip, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-slate-700">
              <ShieldIcon className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
              <span>{tip}</span>
            </div>
          ))}
          {tips.avoid.map((item, idx) => (
            <div
              key={`avoid-${idx}`}
              className="flex items-start gap-1.5 text-rose-700 font-medium"
            >
              <span className="text-rose-500 font-bold">✕</span>
              <span>Avoid: {item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
