import React from 'react';
import { SparklesIcon, WindIcon } from './icons';

interface ShareCardProps {
  cityName: string;
  aqi: number;
  cigsAvoided: number;
  co2eSaved: number;
  pledgeCount: number;
  communityName?: string;
}

export const ShareCard: React.FC<ShareCardProps> = ({
  cityName,
  aqi,
  cigsAvoided,
  co2eSaved,
  pledgeCount,
  communityName,
}) => {
  return (
    <div
      id="breathefresh-share-card"
      className="w-[420px] bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white p-7 rounded-3xl shadow-2xl border border-teal-500/30 space-y-5"
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-slate-950 font-black">
            <WindIcon className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-white leading-none">
              BreatheFresh
            </h2>
            <p className="text-[11px] text-teal-300 font-medium mt-0.5">
              Know your air. Plan your day.
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-900/80 text-teal-200 border border-teal-700/60">
          Clean Air Collective
        </span>
      </div>

      {/* Hero Impact Statement */}
      <div className="space-y-1">
        <span className="text-xs font-semibold text-slate-400">
          {communityName ? `${communityName} Impact` : `${cityName} Family Air Plan`}
        </span>
        <div className="text-3xl font-black text-amber-400 font-mono tracking-tight">
          {cigsAvoided} Cigarettes Avoided
        </div>
        <p className="text-xs text-slate-300">
          Prevented through timed window ventilation, snug N95 masks, and HEPA air purification.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2.5 pt-1">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
          <span className="text-[10px] text-slate-400 block">Current AQI</span>
          <span className="text-xl font-black text-white font-mono">{aqi}</span>
        </div>
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
          <span className="text-[10px] text-slate-400 block">CO₂e Slashed</span>
          <span className="text-xl font-black text-teal-300 font-mono">{co2eSaved} kg</span>
        </div>
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
          <span className="text-[10px] text-slate-400 block">Actions</span>
          <span className="text-xl font-black text-emerald-400 font-mono">{pledgeCount}</span>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10">
        <div className="flex items-center gap-1">
          <SparklesIcon className="w-3.5 h-3.5 text-teal-400" />
          <span>breathefresh.app</span>
        </div>
        <span>Not medical advice</span>
      </div>
    </div>
  );
};
