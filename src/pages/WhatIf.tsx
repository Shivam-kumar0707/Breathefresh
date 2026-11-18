import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useStore } from '../store/useStore';
import { STRINGS } from '../i18n/en';
import { SmogSlider } from '../components/SmogSlider';
import { WhatIfBars } from '../components/WhatIfBars';
import {
  ACTION_CATALOG,
  applyAction,
  compareActions,
  smogOverride,
  type ActionImpact,
} from '../engine/actions';
import { familyExposure } from '../engine/exposure';
import { computeEmissions } from '../engine/emissions';
import { fetchExplanation } from '../lib/groqClient';
import { SparklesIcon, CheckIcon, AlertTriangleIcon } from '../components/icons';

export const WhatIf: React.FC = () => {
  const {
    scenario,
    air,
    profile,
    selectedActions,
    toggleAction,
    smogOverride: overrideVal,
  } = useStore();

  const [activeCategory, setActiveCategory] = useState<'all' | 'routine' | 'indoor' | 'alternative'>('all');
  const [explanations, setExplanations] = useState<Record<string, { explanation: string; soWhat: string }>>({});
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  // 1. Compute effective baseline scenario (applying Smog Simulator override if set)
  const baselineScenario = useMemo(() => {
    if (overrideVal !== null) {
      return smogOverride(scenario, overrideVal);
    }
    return scenario;
  }, [scenario, overrideVal]);

  // 2. Apply bundle of selected actions to baseline
  const planScenario = useMemo(() => {
    let current = baselineScenario;
    for (const actId of selectedActions) {
      current = applyAction(current, actId);
    }
    return current;
  }, [baselineScenario, selectedActions]);

  // 3. Compute Exposure & Emissions for Baseline & Plan
  const baselineExposure = useMemo(() => familyExposure(baselineScenario), [baselineScenario]);
  const planExposure = useMemo(() => familyExposure(planScenario), [planScenario]);

  let effCooking = profile.lifestyle.cookingFuel;
  let effHeating = profile.lifestyle.heatingFuel;
  if (selectedActions.includes('cooking_fuel_switch')) effCooking = 'induction';
  if (selectedActions.includes('electric_heating_switch')) effHeating = 'electric';

  const baselineEmissions = useMemo(
    () => computeEmissions(baselineScenario, profile.lifestyle.cookingFuel, profile.lifestyle.heatingFuel),
    [baselineScenario, profile.lifestyle.cookingFuel, profile.lifestyle.heatingFuel]
  );
  const planEmissions = useMemo(
    () => computeEmissions(planScenario, effCooking, effHeating),
    [planScenario, effCooking, effHeating]
  );

  // 4. Compute impact for each catalog action in isolation
  const catalogImpacts = useMemo(() => {
    const allIds = ACTION_CATALOG.map((a) => a.id);
    const impacts = compareActions(
      baselineScenario,
      allIds,
      profile.lifestyle.cookingFuel,
      profile.lifestyle.heatingFuel
    );
    const map: Record<string, ActionImpact> = {};
    for (const imp of impacts) {
      map[imp.id] = imp;
    }
    return map;
  }, [baselineScenario, profile.lifestyle.cookingFuel, profile.lifestyle.heatingFuel]);

  // 5. 7-Day Forecast Projection: Do Nothing vs. With Active Plan
  const forecastChartData = useMemo(() => {
    const days = air?.forecastDays ?? [];
    const points = [];

    for (let i = 0; i < 7; i++) {
      const forecastDay = days[i % Math.max(1, days.length)];
      const dateLabel = `Day ${i + 1}`;

      // Simulate day scenario with forecast day hourly PM2.5
      const dayHourly = forecastDay ? forecastDay.hourlyPm25 : baselineScenario.outdoorPm25;
      const dayBase = { ...baselineScenario, outdoorPm25: dayHourly };
      let dayPlan = dayBase;
      for (const actId of selectedActions) {
        dayPlan = applyAction(dayPlan, actId);
      }

      const baseExp = familyExposure(dayBase);
      const planExp = familyExposure(dayPlan);

      points.push({
        day: dateLabel,
        doNothingCig: baseExp.totalCigEq,
        withPlanCig: planExp.totalCigEq,
        doNothingEi: baseExp.averageEi,
        withPlanEi: planExp.averageEi,
      });
    }

    return points;
  }, [air, baselineScenario, selectedActions]);

  const handleExplain = async (actionId: string, title: string) => {
    if (explanations[actionId]) {
      const copy = { ...explanations };
      delete copy[actionId];
      setExplanations(copy);
      return;
    }

    const imp = catalogImpacts[actionId];
    if (!imp) return;

    setLoadingActionId(actionId);
    try {
      const res = await fetchExplanation(
        actionId,
        title,
        {
          deltaEiPct: imp.deltaEiPct,
          deltaCigEq: imp.deltaCigEq,
          deltaCo2eKgWeek: imp.deltaCo2eKgWeek,
        },
        profile.language
      );
      setExplanations((prev) => ({ ...prev, [actionId]: res }));
    } finally {
      setLoadingActionId(null);
    }
  };

  const filteredCatalog = ACTION_CATALOG.filter((a) => {
    if (activeCategory === 'all') return true;
    return a.category === activeCategory;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 sm:py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          {STRINGS.whatIf.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          {STRINGS.whatIf.subtitle}
        </p>
      </div>

      {/* Smog Simulator Slider */}
      <SmogSlider />

      {/* Live Impact Comparison Bars */}
      <WhatIfBars
        baselineExposure={baselineExposure}
        planExposure={planExposure}
        baselineEmissions={baselineEmissions}
        planEmissions={planEmissions}
      />

      {/* 7-Day Cumulative Inhalation Chart */}
      <section
        aria-label="7-Day Exposure Outlook Chart"
        className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {STRINGS.whatIf.forecast7Day}
            </h3>
            <p className="text-xs text-slate-500">
              Projected daily family cigarette equivalents across the upcoming 7-day weather outlook
            </p>
          </div>
        </div>

        <div className="h-60 sm:h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-lg space-y-1">
                        <p className="font-semibold">{data.day}</p>
                        <p className="text-rose-300">
                          Do Nothing: {data.doNothingCig} cigs/day ({data.doNothingEi} µg/m³)
                        </p>
                        <p className="text-teal-300">
                          With Plan: {data.withPlanCig} cigs/day ({data.withPlanEi} µg/m³)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Line
                type="monotone"
                dataKey="doNothingCig"
                name="Do Nothing (cigs/day)"
                stroke="#f43f5e"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="withPlanCig"
                name="With Active Plan (cigs/day)"
                stroke="#0d9488"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700">
          <strong>7-Day Projection Summary: </strong>
          Following the active plan maintains family exposure at approximately {planExposure.averageEi} µg/m³ compared to {baselineExposure.averageEi} µg/m³ without intervention.
        </div>
      </section>

      {/* Action Toggles Catalog */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Interactive Action Catalog ({selectedActions.length} active)
            </h3>
            <p className="text-xs text-slate-500">
              Check actions to assemble your custom protection protocol. Deliberately honest: negative impacts during severe smog are transparently noted.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-1.5 text-xs bg-slate-100 p-1 rounded-xl">
            {(['all', 'routine', 'indoor', 'alternative'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                  activeCategory === cat
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Action Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filteredCatalog.map((action) => {
            const isSelected = selectedActions.includes(action.id);
            const imp = catalogImpacts[action.id];
            const explanation = explanations[action.id];
            const isAdverse = imp && imp.deltaEiPct > 0;

            return (
              <div
                key={action.id}
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Header: Checkbox + Title */}
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    data-testid="what-if-toggle"
                    onClick={() => toggleAction(action.id)}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'border-slate-300 bg-white hover:border-teal-500'
                    }`}
                  >
                    {isSelected && <CheckIcon className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {action.title}
                      </h4>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {action.cost}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {action.blurb}
                    </p>
                  </div>
                </div>

                {/* Impact badges row */}
                {imp && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <span
                        className={`px-2 py-0.5 rounded ${
                          isAdverse
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {imp.deltaEiPct > 0 ? '+' : ''}{imp.deltaEiPct}% Inhalation
                      </span>

                      {imp.deltaCigEq !== 0 && (
                        <span className="text-slate-600 font-mono text-[11px]">
                          {imp.deltaCigEq < 0 ? '-' : '+'}{Math.abs(imp.deltaCigEq)} cigs
                        </span>
                      )}

                      {imp.deltaCo2eKgWeek !== 0 && (
                        <span className="text-teal-700 font-mono text-[11px]">
                          {imp.deltaCo2eKgWeek < 0 ? '-' : '+'}{Math.abs(imp.deltaCo2eKgWeek)} kg CO₂e
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleExplain(action.id, action.title)}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                    >
                      <SparklesIcon className="w-3.5 h-3.5 text-teal-600" />
                      <span>{loadingActionId === action.id ? 'Thinking...' : 'Explain'}</span>
                    </button>
                  </div>
                )}

                {/* Honest adverse effect notice if any */}
                {isAdverse && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-1.5">
                    <AlertTriangleIcon className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span>
                      Honest warning: Intense exertion during high ambient PM2.5 increases total minute-volume inhaled, resulting in higher deep-lung deposition.
                    </span>
                  </div>
                )}

                {/* AI Explanation Drawer */}
                {explanation && (
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-950 space-y-1 animate-in fade-in">
                    <p className="font-medium">{explanation.explanation}</p>
                    <p className="text-teal-800 italic font-semibold">
                      Takeaway: {explanation.soWhat}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
