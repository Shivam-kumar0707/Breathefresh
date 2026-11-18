import React from 'react';
import { STRINGS } from '../i18n/en';
import { useStore } from '../store/useStore';
import { ImpactChip } from './ImpactChip';
import { SparklesIcon, WindIcon } from './icons';
import {
  COMMUTE_OPTIONS,
  COOKING_OPTIONS,
  HEATING_OPTIONS,
  type AlternativeOption,
} from '../data/alternativesData';

export const AlternativesTab: React.FC = () => {
  const { profile, toggleAction, selectedActions } = useStore();

  const renderSection = (
    title: string,
    subtitle: string,
    icon: React.ReactNode,
    options: AlternativeOption[]
  ) => (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-teal-50 text-teal-800">{icon}</div>
        <div>
          <h3 className="font-bold text-slate-900 text-base">{title}</h3>
          <p className="text-xs text-slate-600">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((opt) => {
          const isSelected = selectedActions.includes(opt.id);

          return (
            <div
              key={opt.id}
              className={`p-4 rounded-xl border transition-all space-y-3 ${
                isSelected
                  ? 'border-teal-600 bg-teal-50/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 block w-fit mb-1">
                    {opt.mode}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{opt.title}</h4>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {opt.cost}
                </span>
              </div>

              <p className="text-xs text-slate-600">{opt.desc}</p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <ImpactChip deltaEiPct={opt.exposure} />
                  {opt.cigs !== 0 && (
                    <span className="text-xs font-mono font-semibold text-slate-700">
                      {opt.cigs < 0 ? '-' : '+'}
                      {Math.abs(opt.cigs)} cigs/day
                    </span>
                  )}
                  {opt.co2eWeek !== 0 && (
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {opt.co2eWeek < 0 ? '' : '+'}
                      {opt.co2eWeek} kg CO₂e/wk
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => toggleAction(opt.id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all min-h-[36px] ${
                    isSelected
                      ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                      : 'bg-white text-teal-800 border-teal-300 hover:bg-teal-50'
                  }`}
                >
                  {isSelected ? '✓ Active in Plan' : '+ Add to Plan'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">{STRINGS.alternatives.tabTitle}</h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Explore sustainable switches across daily commute, kitchen fuels, and space heating. Every
          switch displays deterministic exposure change and weekly carbon footprint reduction.
        </p>
      </div>

      {renderSection(
        STRINGS.alternatives.commuteTitle,
        `Current: ${profile.lifestyle.commuteMode.replace('_', ' ')} (${profile.lifestyle.commuteKm} km/day)`,
        <WindIcon className="w-5 h-5" />,
        COMMUTE_OPTIONS
      )}

      {renderSection(
        STRINGS.alternatives.cookingTitle,
        `Current fuel: ${profile.lifestyle.cookingFuel.toUpperCase()}`,
        <SparklesIcon className="w-5 h-5" />,
        COOKING_OPTIONS
      )}

      {renderSection(
        STRINGS.alternatives.heatingTitle,
        `Current heating: ${profile.lifestyle.heatingFuel.toUpperCase()}`,
        <SparklesIcon className="w-5 h-5" />,
        HEATING_OPTIONS
      )}
    </div>
  );
};
