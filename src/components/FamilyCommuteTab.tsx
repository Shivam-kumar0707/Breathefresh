import React from 'react';
import type { UserProfile } from '../store/types';
import type { CookingFuel, HeatingFuel } from '../engine/emissions';

interface FamilyCommuteTabProps {
  lifestyle: UserProfile['lifestyle'];
  onUpdateLifestyle: (updates: Partial<UserProfile['lifestyle']>) => void;
}

export const FamilyCommuteTab: React.FC<FamilyCommuteTabProps> = ({
  lifestyle,
  onUpdateLifestyle,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label
          htmlFor="commute-mode-select"
          className="text-xs font-semibold text-slate-800 block mb-1"
        >
          Primary Commute Mode
        </label>
        <select
          id="commute-mode-select"
          value={lifestyle.commuteMode}
          onChange={(e) =>
            onUpdateLifestyle({
              commuteMode: e.target.value as 'car_petrol' | 'two_wheeler' | 'metro' | 'bus',
            })
          }
          className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white font-medium min-h-[44px]"
        >
          <option value="car_petrol">Personal Car (AC / Cabin Filter)</option>
          <option value="two_wheeler">Two-Wheeler / Motorcycle (Direct Exhaust)</option>
          <option value="metro">Metro (Underground / Filtered AC)</option>
          <option value="bus">Public Bus (Semi-Open)</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="commute-km-input"
          className="text-xs font-semibold text-slate-800 block mb-1"
        >
          Daily Travel Distance (km round-trip)
        </label>
        <input
          id="commute-km-input"
          type="number"
          min={1}
          max={120}
          value={lifestyle.commuteKm}
          onChange={(e) =>
            onUpdateLifestyle({
              commuteKm: parseInt(e.target.value) || 15,
            })
          }
          className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white font-medium min-h-[44px]"
        />
      </div>

      <div>
        <label
          htmlFor="cooking-fuel-select"
          className="text-xs font-semibold text-slate-800 block mb-1"
        >
          Kitchen Cooking Fuel
        </label>
        <select
          id="cooking-fuel-select"
          value={lifestyle.cookingFuel}
          onChange={(e) =>
            onUpdateLifestyle({
              cookingFuel: e.target.value as CookingFuel,
            })
          }
          className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white font-medium min-h-[44px]"
        >
          <option value="lpg">LPG Cylinder / Piped Gas</option>
          <option value="induction">Electric Induction Cooktop</option>
          <option value="biomass">Biomass / Chulha (Solid Fuel)</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="heating-fuel-select"
          className="text-xs font-semibold text-slate-800 block mb-1"
        >
          Winter Heating Source
        </label>
        <select
          id="heating-fuel-select"
          value={lifestyle.heatingFuel}
          onChange={(e) =>
            onUpdateLifestyle({
              heatingFuel: e.target.value as HeatingFuel,
            })
          }
          className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white font-medium min-h-[44px]"
        >
          <option value="none">No Space Heating Needed</option>
          <option value="electric">Electric Radiator / Heat Pump</option>
          <option value="coal_wood">Coal / Wood Angithi (Indoor Combustion)</option>
        </select>
      </div>
    </div>
  );
};
