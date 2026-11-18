import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { STRINGS } from '../i18n/en';
import { AirPanel } from '../components/AirPanel';
import { HourlyChart } from '../components/HourlyChart';
import { PlanTimeline } from '../components/PlanTimeline';
import { MemberCard } from '../components/MemberCard';
import { familyExposure } from '../engine/exposure';
import { compareActions, ACTION_CATALOG, type ActionImpact } from '../engine/actions';
import { fetchDailyPlan } from '../lib/groqClient';
import { InfoIcon, RefreshIcon, SparklesIcon } from '../components/icons';
import { IndoorHacksTab } from '../components/IndoorHacksTab';
import { AlternativesTab } from '../components/AlternativesTab';

export const Today: React.FC = () => {
  const {
    scenario,
    air,
    profile,
    plan,
    isRuleBasedFallback,
    isGeneratingPlan,
    setPlan,
    refreshAirData,
    setIsChatOpen,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'plan' | 'hacks' | 'alternatives'>('plan');
  const [animatedCigEq, setAnimatedCigEq] = useState(0);
  const [showHeroAssumptions, setShowHeroAssumptions] = useState(false);

  // Engine Baseline Computation (Pure & Instant)
  const baselineExposure = useMemo(() => {
    return familyExposure(scenario);
  }, [scenario]);

  // Compute impacts for all catalog actions against current scenario
  const actionImpactsMap = useMemo(() => {
    const allIds = ACTION_CATALOG.map((a) => a.id);
    const impacts = compareActions(
      scenario,
      allIds,
      profile.lifestyle.cookingFuel,
      profile.lifestyle.heatingFuel
    );
    const map: Record<string, ActionImpact> = {};
    for (const imp of impacts) {
      map[imp.id] = imp;
    }
    return map;
  }, [scenario, profile.lifestyle.cookingFuel, profile.lifestyle.heatingFuel]);

  // Animated count-up for cigarette equivalents with reduced-motion check
  useEffect(() => {
    const target = baselineExposure.totalCigEq;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setAnimatedCigEq(target);
      return;
    }

    let current = 0;
    const step = target / 25;
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        setAnimatedCigEq(target);
        clearInterval(interval);
      } else {
        setAnimatedCigEq(Math.round(current * 10) / 10);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [baselineExposure.totalCigEq]);

  const handleRegeneratePlan = useCallback(async () => {
    if (!air) return;
    useStore.setState({ isGeneratingPlan: true });
    try {
      const newPlan = await fetchDailyPlan(
        scenario,
        air,
        profile.city.name,
        profile.language,
        air.grapStage?.stage
      );
      setPlan(newPlan, newPlan.isFallback);
    } catch (err) {
      console.warn('Plan fetch failed, falling back:', err);
    }
  }, [air, scenario, profile.city.name, profile.language, setPlan]);

  // Fetch or regenerate plan when scenario or air changes
  useEffect(() => {
    if (!air) {
      refreshAirData();
      return;
    }

    if (!plan) {
      handleRegeneratePlan();
    }
  }, [air, plan, refreshAirData, handleRegeneratePlan]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 sm:py-6">
      {/* Fallback Banner if AI is offline */}
      {isRuleBasedFallback && (
        <div
          role="status"
          className="flex items-center justify-between p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-xs sm:text-sm font-medium text-teal-900"
        >
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>{STRINGS.status.ruleBasedPlan}</span>
          </div>
          <span className="text-[11px] font-bold text-teal-700 bg-white px-2 py-0.5 rounded shadow-xs">
            Impact Engine Verified
          </span>
        </div>
      )}

      {/* Hero Cigarette-Equivalent Impact Banner */}
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
            <p className="text-xs text-slate-400 pt-1">
              {STRINGS.hero.cigaretteApproxNote}
            </p>
          </div>

          {/* Key Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-slate-400 block">Avg. Exposure Index</span>
              <span className="text-lg font-bold text-teal-300">
                {baselineExposure.averageEi} µg/m³
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-slate-400 block">Family Risk Level</span>
              <span className="text-lg font-bold text-amber-300 capitalize">
                {baselineExposure.maxBand}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Active Members</span>
                <span className="text-lg font-bold text-white">
                  {scenario.members.length} people
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
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
                1. <strong>Berkeley Earth Heuristic</strong>: Equates 22 µg/m³ of 24h PM2.5 to roughly 1 cigarette per day based on cardiovascular and pulmonary mortality hazard ratios (Muller & Rohde).
              </p>
              <p>
                2. <strong>Inhalation Volume</strong>: Adults breathe ~15 m³/day (rest: 1.0, light: 1.4, exercise: 3.5 multipliers).
              </p>
              <p>
                3. <strong>Microenvironments</strong>: Calculates dose across Home, Work/School (0.7 indoor factor), Commute (0.5–1.2 factor), and Outdoor.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Live Air Panel */}
      <AirPanel />

      {/* 48h Hourly PM2.5 Forecast Chart */}
      <HourlyChart />

      {/* Tabs: Plan Timeline / Indoor Hacks / Alternatives */}
      <div role="tablist" aria-label="Today's Plan Sections" className="flex border-b border-slate-200">
        <button
          id="tab-plan"
          role="tab"
          aria-selected={activeTab === 'plan'}
          aria-controls="panel-plan"
          data-testid="tab-plan"
          type="button"
          onClick={() => setActiveTab('plan')}
          className={`pb-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-t-lg ${
            activeTab === 'plan'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Daily Action Plan</span>
        </button>
        <button
          id="tab-hacks"
          role="tab"
          aria-selected={activeTab === 'hacks'}
          aria-controls="panel-hacks"
          data-testid="tab-hacks"
          type="button"
          onClick={() => setActiveTab('hacks')}
          className={`pb-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-t-lg ${
            activeTab === 'hacks'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Indoor Hacks & Calculator</span>
        </button>
        <button
          id="tab-alternatives"
          role="tab"
          aria-selected={activeTab === 'alternatives'}
          aria-controls="panel-alternatives"
          data-testid="tab-alternatives"
          type="button"
          onClick={() => setActiveTab('alternatives')}
          className={`pb-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-t-lg ${
            activeTab === 'alternatives'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Sustainable Alternatives</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'plan' && (
        <div id="panel-plan" role="tabpanel" aria-labelledby="tab-plan" className="space-y-6">
          {/* Plan Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {plan ? plan.headline : 'Assembling Family Plan...'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                {plan ? plan.summary : 'Impact Engine is modeling hourly inhalation doses across your home and commute.'}
              </p>
            </div>

            <button
              type="button"
              disabled={isGeneratingPlan}
              onClick={handleRegeneratePlan}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <RefreshIcon className={`w-3.5 h-3.5 ${isGeneratingPlan ? 'animate-spin' : ''}`} />
              <span>{isGeneratingPlan ? 'Assembling...' : STRINGS.plan.regeneratePlan}</span>
            </button>
          </div>

          {/* Timeline */}
          {plan && plan.timeline && (
            <PlanTimeline
              timeline={plan.timeline}
              impactsMap={actionImpactsMap}
              language={profile.language}
            />
          )}

          {/* Individual Protection Protocols */}
          <section className="space-y-3 pt-4">
            <h3 className="text-base font-bold text-slate-900">
              {STRINGS.plan.memberTipsTitle}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenario.members.map((m) => {
                const exposure = baselineExposure.perMember[m.id];
                const tips = plan?.members.find((pm) => pm.memberId === m.id);
                if (!exposure) return null;

                return (
                  <MemberCard
                    key={m.id}
                    exposure={exposure}
                    tips={tips}
                    ageGroup={m.ageGroup}
                    conditions={m.conditions}
                  />
                );
              })}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'hacks' && (
        <div id="panel-hacks" role="tabpanel" aria-labelledby="tab-hacks">
          <IndoorHacksTab />
        </div>
      )}
      {activeTab === 'alternatives' && (
        <div id="panel-alternatives" role="tabpanel" aria-labelledby="tab-alternatives">
          <AlternativesTab />
        </div>
      )}
    </div>
  );
};
