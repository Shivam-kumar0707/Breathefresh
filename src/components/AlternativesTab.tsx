import React from 'react';
import { STRINGS } from '../i18n/en';
import { useStore } from '../store/useStore';
import { ImpactChip } from './ImpactChip';
import { SparklesIcon, WindIcon } from './icons';

export const AlternativesTab: React.FC = () => {
  const { profile, toggleAction, selectedActions } = useStore();

  const commuteOptions = [
    {
      id: 'metro_or_bus_instead_of_car',
      title: 'Shift Car Commute to Delhi Metro / AC Rapid Bus',
      mode: 'Metro vs. Personal Petrol Car',
      exposure: -50,
      cigs: -1.8,
      co2eWeek: -14.2,
      cost: 'free' as const,
      desc: 'Metro stations and coaches use commercial MERV-13 air filtration systems with positive pressurization. Slashes ~14 kg of CO2e per week while bypassing gridlocked exhaust fumes.',
    },
    {
      id: 'carpool',
      title: '3-Person Carpooling for Office Corridors',
      mode: 'Shared Ride vs. Single Occupant',
      exposure: 0,
      cigs: 0,
      co2eWeek: -12.0,
      cost: 'free' as const,
      desc: 'Splits tailpipe emissions across 3 commuters, cutting individual transportation carbon footprint by 66% with zero change in travel time.',
    },
    {
      id: 'cycle_short_trips',
      title: 'Cycling for Short Errands (< 3 km, Moderate Air Only)',
      mode: 'Bicycle vs. Auto/Motorcycle',
      exposure: 15, // Negative impact during smog honestly disclosed
      cigs: 0.4,
      co2eWeek: -4.5,
      cost: 'free' as const,
      desc: 'Zero-emission local transport. NOTE: Aerobic respiration increases minute ventilation by 3.5×. Only cycle when AQI is below 150.',
    },
  ];

  const cookingOptions = [
    {
      id: 'cooking_fuel_switch',
      title: 'Transition Cooking to Electric Induction Cooktop',
      mode: 'Electric Induction vs. Solid Biomass / LPG',
      exposure: -35,
      cigs: -2.4,
      co2eWeek: -20.2,
      cost: 'low' as const,
      desc: 'Biomass chulhas and unvented gas burners release significant particulate matter, carbon monoxide, and NOx indoors. Induction provides zero combustion emissions inside the home.',
    },
    {
      id: 'cook_with_hood_or_window',
      title: 'Install High-Suction Chimney Exhaust Hood',
      mode: 'Cooktop Range Hood with Vent Duct',
      exposure: -25,
      cigs: -1.2,
      co2eWeek: 0,
      cost: 'free' as const,
      desc: 'Venting frying fumes outside prevents greasy fine aerosol accumulation across adjacent bedrooms.',
    },
  ];

  const heatingOptions = [
    {
      id: 'electric_heating_switch',
      title: 'Electric Oil-Filled Radiator / Inverter Heat Pump',
      mode: 'Electric Radiator vs. Wood/Coal Brazier (Angithi)',
      exposure: -65,
      cigs: -4.2,
      co2eWeek: -34.0,
      cost: 'mid' as const,
      desc: 'Eliminates open glowing coal or charcoal braziers in sleeping areas, which are the leading cause of lethal winter carbon monoxide poisoning and acute severe indoor smog.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div>
        <h3 className="text-xl font-bold text-slate-900">
          {STRINGS.alternatives.tabTitle}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Explore sustainable switches across daily commute, kitchen fuels, and space heating. Every switch displays deterministic exposure change and weekly carbon footprint reduction.
        </p>
      </div>

      {/* Commute Alternatives */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
            <WindIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base">
              {STRINGS.alternatives.commuteTitle}
            </h4>
            <p className="text-xs text-slate-500">
              Current baseline: {profile.lifestyle.commuteMode.replace('_', ' ')} · {profile.lifestyle.commuteKm} km/day
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {commuteOptions.map((opt) => {
            const isPledged = selectedActions.includes(opt.id);
            return (
              <div
                key={opt.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all space-y-3 ${
                  isPledged
                    ? 'border-teal-500 bg-teal-50/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      {opt.mode}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      {opt.cost}
                    </span>
                  </div>

                  <h5 className="font-bold text-slate-900 text-sm leading-snug">
                    {opt.title}
                  </h5>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {opt.desc}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <ImpactChip
                    deltaEiPct={opt.exposure}
                    deltaCigEq={opt.cigs}
                    costTier={opt.cost}
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-mono font-bold text-teal-700">
                      {opt.co2eWeek < 0 ? opt.co2eWeek : `+${opt.co2eWeek}`} kg CO₂e/week
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleAction(opt.id)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                        isPledged
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-teal-800 border-teal-300 hover:bg-teal-50'
                      }`}
                    >
                      {isPledged ? '✓ Pledged' : '+ Add to Plan'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Cooking Alternatives */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
            <SparklesIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base">
              {STRINGS.alternatives.cookingTitle}
            </h4>
            <p className="text-xs text-slate-500">
              Current kitchen fuel: {profile.lifestyle.cookingFuel.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cookingOptions.map((opt) => {
            const isPledged = selectedActions.includes(opt.id);
            return (
              <div
                key={opt.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all space-y-3 ${
                  isPledged
                    ? 'border-teal-500 bg-teal-50/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      {opt.mode}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      {opt.cost}
                    </span>
                  </div>

                  <h5 className="font-bold text-slate-900 text-sm leading-snug">
                    {opt.title}
                  </h5>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {opt.desc}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <ImpactChip
                    deltaEiPct={opt.exposure}
                    deltaCigEq={opt.cigs}
                    costTier={opt.cost}
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-mono font-bold text-teal-700">
                      {opt.co2eWeek < 0 ? opt.co2eWeek : `+${opt.co2eWeek}`} kg CO₂e/week
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleAction(opt.id)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                        isPledged
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-teal-800 border-teal-300 hover:bg-teal-50'
                      }`}
                    >
                      {isPledged ? '✓ Pledged' : '+ Add to Plan'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Space Heating Alternatives */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
            <SparklesIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base">
              {STRINGS.alternatives.heatingTitle}
            </h4>
            <p className="text-xs text-slate-500">
              Current heating mode: {profile.lifestyle.heatingFuel.replace('_', ' ').toUpperCase()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {heatingOptions.map((opt) => {
            const isPledged = selectedActions.includes(opt.id);
            return (
              <div
                key={opt.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all space-y-3 ${
                  isPledged
                    ? 'border-teal-500 bg-teal-50/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      {opt.mode}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      {opt.cost}
                    </span>
                  </div>

                  <h5 className="font-bold text-slate-900 text-sm leading-snug">
                    {opt.title}
                  </h5>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {opt.desc}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <ImpactChip
                    deltaEiPct={opt.exposure}
                    deltaCigEq={opt.cigs}
                    costTier={opt.cost}
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-mono font-bold text-teal-700">
                      {opt.co2eWeek} kg CO₂e/week
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleAction(opt.id)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                        isPledged
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-teal-800 border-teal-300 hover:bg-teal-50'
                      }`}
                    >
                      {isPledged ? '✓ Pledged' : '+ Add to Plan'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
