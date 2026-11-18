import React from 'react';
import type { Action, ActionImpact } from '../engine/actions';
import { CheckIcon, SparklesIcon, AlertTriangleIcon } from './icons';

interface WhatIfActionCardProps {
  action: Action;
  isSelected: boolean;
  impact?: ActionImpact;
  explanation?: { explanation: string; soWhat: string };
  isLoadingExplanation: boolean;
  onToggle: (id: string) => void;
  onExplain: (id: string, title: string) => void;
}

export const WhatIfActionCard: React.FC<WhatIfActionCardProps> = ({
  action,
  isSelected,
  impact,
  explanation,
  isLoadingExplanation,
  onToggle,
  onExplain,
}) => {
  const isAdverse = impact && impact.deltaEiPct > 0;

  return (
    <div
      className={`p-4 rounded-xl border transition-all space-y-3 ${
        isSelected
          ? 'border-teal-600 bg-teal-50/30 shadow-xs'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      {/* Header: Checkbox + Title */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={isSelected}
          aria-label={`Toggle action: ${action.title}`}
          data-testid="what-if-toggle"
          onClick={() => onToggle(action.id)}
          className={`mt-0.5 min-w-[28px] min-h-[28px] w-7 h-7 rounded-lg border flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-teal-600 ${
            isSelected
              ? 'bg-teal-700 border-teal-700 text-white'
              : 'border-slate-300 bg-white hover:border-teal-600'
          }`}
        >
          {isSelected && <CheckIcon className="w-4 h-4" />}
        </button>

        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <h3 className="text-sm font-bold text-slate-900 leading-snug">{action.title}</h3>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
              {action.cost}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">{action.blurb}</p>
        </div>
      </div>

      {/* Impact badges row */}
      {impact && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span
              className={`px-2 py-0.5 rounded ${
                isAdverse
                  ? 'bg-rose-100 text-rose-900 font-bold'
                  : 'bg-emerald-100 text-emerald-900 font-bold'
              }`}
            >
              {impact.deltaEiPct > 0 ? '+' : ''}
              {impact.deltaEiPct}% Inhalation
            </span>

            {impact.deltaCigEq !== 0 && (
              <span className="text-slate-700 font-mono text-[11px] font-semibold">
                {impact.deltaCigEq < 0 ? '-' : '+'}
                {Math.abs(impact.deltaCigEq)} cigs
              </span>
            )}

            {impact.deltaCo2eKgWeek !== 0 && (
              <span className="text-teal-800 font-mono text-[11px] font-semibold">
                {impact.deltaCo2eKgWeek < 0 ? '-' : '+'}
                {Math.abs(impact.deltaCo2eKgWeek)} kg CO₂e
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onExplain(action.id, action.title)}
            className="text-xs font-semibold text-teal-800 hover:text-teal-950 flex items-center gap-1 min-h-[36px] px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <SparklesIcon className="w-3.5 h-3.5 text-teal-700" />
            <span>{isLoadingExplanation ? 'Thinking...' : 'Explain'}</span>
          </button>
        </div>
      )}

      {/* Honest adverse effect notice if any */}
      {isAdverse && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-1.5">
          <AlertTriangleIcon className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" />
          <span>
            Honest warning: Intense exertion during high ambient PM2.5 increases total minute-volume
            inhaled, resulting in higher deep-lung deposition.
          </span>
        </div>
      )}

      {/* AI Explanation Drawer */}
      {explanation && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-950 space-y-1 animate-in fade-in">
          <p className="font-medium">{explanation.explanation}</p>
          <p className="text-teal-900 italic font-bold">Takeaway: {explanation.soWhat}</p>
        </div>
      )}
    </div>
  );
};
