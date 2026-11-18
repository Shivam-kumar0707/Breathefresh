import React from 'react';
import type { CostTier } from '../engine/actions';

interface ImpactChipProps {
  deltaEiPct: number;
  deltaCigEq?: number;
  costTier?: CostTier;
  className?: string;
}

export const ImpactChip: React.FC<ImpactChipProps> = ({
  deltaEiPct,
  deltaCigEq,
  costTier,
  className = '',
}) => {
  const isPositive = deltaEiPct < 0; // Negative delta means reduction in exposure = GOOD!
  const isNeutral = deltaEiPct === 0;

  let bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  const badgeText = `${deltaEiPct > 0 ? '+' : ''}${deltaEiPct}% Exposure`;

  if (!isPositive && !isNeutral) {
    bgClass = 'bg-rose-50 text-rose-800 border-rose-200';
  } else if (isNeutral) {
    bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      <span
        data-testid="plan-item-impact"
        className={`px-2 py-0.5 text-xs font-bold rounded-md border ${bgClass}`}
      >
        {badgeText}
      </span>
      {deltaCigEq !== undefined && deltaCigEq !== 0 && (
        <span className="px-2 py-0.5 text-xs font-semibold rounded-md border bg-teal-50 text-teal-800 border-teal-200">
          {deltaCigEq < 0 ? '-' : '+'}
          {Math.abs(deltaCigEq)} cigs/day
        </span>
      )}
      {costTier && (
        <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold rounded bg-slate-100 text-slate-600 border border-slate-200">
          {costTier}
        </span>
      )}
    </div>
  );
};
