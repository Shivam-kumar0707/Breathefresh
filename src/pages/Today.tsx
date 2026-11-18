import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { STRINGS } from '../i18n/en';
import { AirPanel } from '../components/AirPanel';
import { HourlyChart } from '../components/HourlyChart';
import { PlanTimeline } from '../components/PlanTimeline';
import { MemberCard } from '../components/MemberCard';
import { HeroDoseBanner } from '../components/HeroDoseBanner';
import { familyExposure } from '../engine/exposure';
import { compareActions, ACTION_CATALOG, type ActionImpact } from '../engine/actions';
import { fetchDailyPlan } from '../lib/groqClient';
import { RefreshIcon, SparklesIcon } from '../components/icons';
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
    } catch {
      // Handled inside fetchDailyPlan with deterministic rule fallback
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
      <h1 className="sr-only">Today&apos;s Family Clean Air Action Plan</h1>

      {/* Fallback Banner if AI is offline */}
      {isRuleBasedFallback && (
        <div
          role="status"
          aria-live="polite"
          data-testid="fallback-banner"
          className="flex items-center justify-between p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-xs sm:text-sm font-medium text-teal-900"
        >
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-teal-700 flex-shrink-0" />
            <span>{STRINGS.status.ruleBasedPlan}</span>
          </div>
          <span className="text-[11px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded shadow-xs">
            Impact Engine Verified
          </span>
        </div>
      )}

      {/* Hero Cigarette-Equivalent Impact Banner */}
      <HeroDoseBanner
        totalCigEq={baselineExposure.totalCigEq}
        averageEi={baselineExposure.averageEi}
        maxBand={baselineExposure.maxBand}
        memberCount={scenario.members.length}
        onOpenChat={() => setIsChatOpen(true)}
      />

      {/* Live Air Panel */}
      <AirPanel />

      {/* 48h Hourly PM2.5 Forecast Chart */}
      <HourlyChart />

      {/* Tabs: Plan Timeline / Indoor Hacks / Alternatives */}
      <div
        role="tablist"
        aria-label="Today's Plan Sections"
        className="flex border-b border-slate-200"
      >
        <button
          id="tab-plan"
          role="tab"
          aria-selected={activeTab === 'plan'}
          aria-controls="panel-plan"
          data-testid="tab-plan"
          type="button"
          onClick={() => setActiveTab('plan')}
          className={`pb-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-t-lg min-h-[44px] ${
            activeTab === 'plan'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-600 hover:text-slate-900'
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
          className={`pb-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-t-lg min-h-[44px] ${
            activeTab === 'hacks'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-600 hover:text-slate-900'
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
          className={`pb-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-t-lg min-h-[44px] ${
            activeTab === 'alternatives'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-600 hover:text-slate-900'
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
              <h2 className="text-xl font-bold text-slate-900">
                {plan ? plan.headline : 'Assembling Family Plan...'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                {plan
                  ? plan.summary
                  : 'Impact Engine is modeling hourly inhalation doses across your home and commute.'}
              </p>
            </div>

            <button
              type="button"
              disabled={isGeneratingPlan}
              onClick={handleRegeneratePlan}
              className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-xs flex items-center gap-1.5 min-h-[44px]"
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
            <h3 className="text-base font-bold text-slate-900">{STRINGS.plan.memberTipsTitle}</h3>
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
