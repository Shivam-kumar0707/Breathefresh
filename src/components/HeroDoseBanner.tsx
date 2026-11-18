import React, { useState, useEffect } from 'react';
import { STRINGS } from '../i18n/en';
import { InfoIcon } from './icons';
import type { Band } from '../engine/constants';

interface HeroDoseBannerProps {
  totalCigEq: number;
  averageEi: number;
  maxBand: Band;
  memberCount: number;
  onOpenChat: () => void;
}

export const HeroDoseBanner: React.FC<HeroDoseBannerProps> = ({
  totalCigEq,
  averageEi,
  maxBand,
  memberCount,
  onOpenChat,
}) => {
  const [animatedCigEq, setAnimatedCigEq] = useState(0);
  const [showHeroAssumptions, setShowHeroAssumptions] = useState(false);

  // Animated count-up for cigarette equivalents with reduced-motion check
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setAnimatedCigEq(totalCigEq);
      return;
    }

    let current = 0;
    const step = totalCigEq / 25;
    const interval = setInterval(() => {
      current += step;
      if (current >= totalCigEq) {
        setAnimatedCigEq(totalCigEq);
        clearInterval(interval);
      } else {
        setAnimatedCigEq(Math.round(current * 10) / 10);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [totalCigEq]);

  return (
    <section
      aria-label="Family Cumulative Exposure Overview"
      className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-5 sm:p-7 shadow-lg relative overflow-hidden"
    >
      <div className="relative z-10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 bg-teal-900/50 px-2.5 py-0.5 rounded-full border border-teal-700/50">
            Daily Toxic Air Dose
          </span>
          <button
            type="button"
            onClick={() => setShowHeroAssumptions(!showHeroAssumptions)}
            className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-medium transition-colors"
          >
            <InfoIcon className="w-3.5 h-3.5 text-teal-400" />
            <span>How we estimate this</span>
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            {STRINGS.hero.inhaledLabel}
          </p>
          <div className="flex items-baseline gap-3">
            <span
              data-testid="cigarette-equivalent-number"
              className="text-4xl sm:text-6xl font-black tracking-tight text-white font-mono"
            >
              {animatedCigEq}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-amber-400">
              {STRINGS.hero.cigarettesToday}
            </span>
          </div>
          <p className="text-xs text-slate-400 pt-1">{STRINGS.hero.cigaretteApproxNote}</p>
        </div>

        {/* Key Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-slate-400 block">Avg. Exposure Index</span>
            <span className="text-lg font-bold text-teal-300">{averageEi} µg/m³</span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-slate-400 block">Family Risk Level</span>
            <span className="text-lg font-bold text-amber-300 capitalize">{maxBand}</span>
          </div>
          <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">Active Members</span>
              <span className="text-lg font-bold text-white">{memberCount} people</span>
            </div>
            <button
              type="button"
              onClick={onOpenChat}
              className="px-3 py-1.5 text-xs font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors"
            >
              Ask AI 💬
            </button>
          </div>
        </div>

        {/* Assumptions Dialog */}
        {showHeroAssumptions && (
          <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-slate-200 space-y-2 animate-in fade-in">
            <div className="font-bold text-teal-300">Scientific Model Assumptions:</div>
            <p>
              1. <strong>Berkeley Earth Heuristic</strong>: Equates 22 µg/m³ of 24h PM2.5 to roughly
              1 cigarette per day based on cardiovascular and pulmonary mortality hazard ratios
              (Muller & Rohde).
            </p>
            <p>
              2. <strong>Inhalation Volume</strong>: Adults breathe ~15 m³/day (rest: 1.0, light:
              1.4, exercise: 3.5 multipliers).
            </p>
            <p>
              3. <strong>Microenvironments</strong>: Calculates dose across Home, Work/School (0.7
              indoor factor), Commute (0.5–1.2 factor), and Outdoor.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
