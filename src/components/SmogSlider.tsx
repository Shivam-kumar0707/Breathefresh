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
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">
              {STRINGS.whatIf.smogSliderTitle}
            </h2>
            <p className="text-xs text-slate-500">{STRINGS.whatIf.smogSliderSub}</p>
          </div>
        </div>

        {smogOverride !== null && (
          <button
            type="button"
            onClick={() => setSmogOverride(null)}
            className="text-xs font-semibold text-teal-800 hover:text-teal-950 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-300 min-h-[36px]"
          >
            Reset to Live ({Math.round(currentAmbient)} µg/m³)
          </button>
        )}
      </div>

      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
          <span>Clean Day (50 µg/m³)</span>
          <span className="text-lg font-black font-mono text-teal-900 bg-teal-50 px-3 py-1 rounded-lg border border-teal-300">
            {activeValue} µg/m³
          </span>
          <span className="text-rose-800 font-bold">Severe Smog (500 µg/m³)</span>
        </div>

        <input
          type="range"
          role="slider"
          aria-label="Outdoor PM2.5 concentration level slider"
          aria-valuemin={50}
          aria-valuemax={500}
          aria-valuenow={activeValue}
          aria-valuetext={`${activeValue} micrograms per cubic meter, ${
            activeValue > 400
              ? 'Emergency Severe Plus'
              : activeValue > 300
                ? 'Severe'
                : activeValue > 200
                  ? 'Very Poor'
                  : activeValue > 100
                    ? 'Poor'
                    : 'Moderate'
          }`}
          data-testid="smog-slider"
          min={50}
          max={500}
          step={10}
          value={activeValue}
          onChange={(e) => setSmogOverride(parseInt(e.target.value))}
          className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600 min-h-[44px]"
        />

        <div className="flex justify-between text-[11px] text-slate-600 font-mono font-medium">
          <span>Good / Moderate</span>
          <span>Poor</span>
          <span>Very Poor</span>
          <span>Severe / Emergency</span>
        </div>
      </div>
    </div>
  );
};
