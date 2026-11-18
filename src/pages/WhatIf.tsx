import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { STRINGS } from '../i18n/en';
import { SmogSlider } from '../components/SmogSlider';
import { WhatIfBars } from '../components/WhatIfBars';
import { WhatIfForecastChart } from '../components/WhatIfForecastChart';
import { WhatIfActionCard } from '../components/WhatIfActionCard';
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

export const WhatIf: React.FC = () => {
  const {
    scenario,
    air,
    profile,
    selectedActions,
    toggleAction,
    smogOverride: overrideVal,
  } = useStore();

  const [activeCategory, setActiveCategory] = useState<
    'all' | 'routine' | 'indoor' | 'alternative'
  >('all');
  const [explanations, setExplanations] = useState<
    Record<string, { explanation: string; soWhat: string }>
  >({});
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
    () =>
      computeEmissions(
        baselineScenario,
        profile.lifestyle.cookingFuel,
        profile.lifestyle.heatingFuel
      ),
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
        <p className="text-xs sm:text-sm text-slate-600 mt-1">{STRINGS.whatIf.subtitle}</p>
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
      <WhatIfForecastChart
        data={forecastChartData}
        planAverageEi={planExposure.averageEi}
        baselineAverageEi={baselineExposure.averageEi}
      />

      {/* Action Toggles Catalog */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Interactive Action Catalog ({selectedActions.length} active)
            </h2>
            <p className="text-xs text-slate-600">
              Check actions to assemble your custom protection protocol. Deliberately honest:
              negative impacts during severe smog are transparently noted.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
            {(['all', 'routine', 'indoor', 'alternative'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all min-h-[36px] ${
                  activeCategory === cat
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Action Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filteredCatalog.map((action) => (
            <WhatIfActionCard
              key={action.id}
              action={action}
              isSelected={selectedActions.includes(action.id)}
              impact={catalogImpacts[action.id]}
              explanation={explanations[action.id]}
              isLoadingExplanation={loadingActionId === action.id}
              onToggle={toggleAction}
              onExplain={handleExplain}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
