import React from 'react';
import type { UserProfile } from '../store/types';

interface FamilyHomeTabProps {
  lifestyle: UserProfile['lifestyle'];
  onUpdateLifestyle: (updates: Partial<UserProfile['lifestyle']>) => void;
}

export const FamilyHomeTab: React.FC<FamilyHomeTabProps> = ({ lifestyle, onUpdateLifestyle }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label
          htmlFor="home-area-input"
          className="text-xs font-semibold text-slate-800 block mb-1"
        >
          Floor Area (m²)
        </label>
        <input
          id="home-area-input"
          type="number"
          min={20}
          max={600}
          value={lifestyle.homeAreaM2}
          onChange={(e) =>
            onUpdateLifestyle({
              homeAreaM2: Math.max(20, parseInt(e.target.value) || 50),
            })
          }
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white min-h-[44px]"
        />
        <p className="text-[11px] text-slate-600 mt-1">
          Approx. {Math.round(lifestyle.homeAreaM2 * 10.76)} sq. ft. Ceiling default: 2.7m.
        </p>
      </div>

      <div>
        <span className="text-xs font-semibold text-slate-800 block mb-1">
          Air Purifier at Home
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onUpdateLifestyle({ hasPurifier: false })}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl border min-h-[44px] ${
              !lifestyle.hasPurifier
                ? 'bg-teal-700 text-white border-teal-700'
                : 'bg-white text-slate-700 border-slate-300'
            }`}
          >
            No Purifier
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdateLifestyle({
                hasPurifier: true,
                cadrM3h: lifestyle.cadrM3h ?? 300,
              })
            }
            className={`flex-1 py-2 text-xs font-semibold rounded-xl border min-h-[44px] ${
              lifestyle.hasPurifier
                ? 'bg-teal-700 text-white border-teal-700'
                : 'bg-white text-slate-700 border-slate-300'
            }`}
          >
            Have Purifier
          </button>
        </div>
        {lifestyle.hasPurifier && (
          <div className="mt-2">
            <label htmlFor="home-cadr-input" className="sr-only">
              Purifier CADR in cubic meters per hour
            </label>
            <input
              id="home-cadr-input"
              type="number"
              placeholder="CADR in m³/h (e.g. 300)"
              value={lifestyle.cadrM3h || ''}
              onChange={(e) =>
                onUpdateLifestyle({
                  cadrM3h: parseInt(e.target.value) || 250,
                })
              }
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white min-h-[40px]"
            />
          </div>
        )}
      </div>
    </div>
  );
};
