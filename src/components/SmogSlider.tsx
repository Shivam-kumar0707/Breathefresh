import React from 'react';
import { useStore } from '../store/useStore';
import { STRINGS } from '../i18n/en';
import { SlidersIcon } from './icons';

export const SmogSlider: React.FC = () => {
  const { smogOverride, setSmogOverride, air } = useStore();

  const currentAmbient = air?.current.pm2_5 ?? 150;
  const activeValue = smogOverride !== null ? smogOverride : Math.round(currentAmbient);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
            <SlidersIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              {STRINGS.whatIf.smogSliderTitle}
            </h3>
            <p className="text-xs text-slate-500">
              {STRINGS.whatIf.smogSliderSub}
            </p>
          </div>
        </div>

        {smogOverride !== null && (
          <button
            type="button"
            onClick={() => setSmogOverride(null)}
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200"
          >
            Reset to Live ({Math.round(currentAmbient)} µg/m³)
          </button>
        )}
      </div>

      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>Clean Day (50 µg/m³)</span>
          <span className="text-lg font-black font-mono text-teal-800 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
            {activeValue} µg/m³
          </span>
          <span className="text-rose-700">Severe Smog (500 µg/m³)</span>
        </div>

        <input
          type="range"
          data-testid="smog-slider"
          min={50}
          max={500}
          step={10}
          value={activeValue}
          onChange={(e) => setSmogOverride(parseInt(e.target.value))}
          className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 focus:outline-none"
        />

        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
          <span>Good / Moderate</span>
          <span>Poor</span>
          <span>Very Poor</span>
          <span>Severe / Emergency</span>
        </div>
      </div>
    </div>
  );
};
