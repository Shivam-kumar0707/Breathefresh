import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { STRINGS } from '../i18n/en';
import { CitySearch } from '../components/CitySearch';
import { FamilyBuilder } from '../components/FamilyBuilder';
import { DEMO_PERSONAS } from '../data/personas';
import { SparklesIcon, WindIcon } from '../components/icons';

export const Onboard: React.FC = () => {
  const navigate = useNavigate();
  const { loadPersona, refreshAirData, saveProfileToFirestore } = useStore();

  useEffect(() => {
    // Refresh air data on load
    refreshAirData();
  }, [refreshAirData]);

  const handleTryDemo = async (personaId: string = 'sharma-ghaziabad') => {
    await loadPersona(personaId);
    navigate('/plan');
  };

  const handleBuildPlan = async () => {
    await saveProfileToFirestore();
    navigate('/plan');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 sm:py-8">
      {/* Above the Fold Hero Section */}
      <section className="text-center space-y-4 pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
          <SparklesIcon className="w-3.5 h-3.5 text-teal-600" />
          <span>{STRINGS.app.scienceBadge}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
          BreatheFresh
        </h1>

        <p className="text-lg sm:text-xl font-medium text-teal-700">{STRINGS.app.tagline}</p>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
          {STRINGS.app.heroValue}
        </p>

        {/* Big Try Demo Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            data-testid="demo-button"
            onClick={() => handleTryDemo('sharma-ghaziabad')}
            className="w-full sm:w-auto px-6 py-3.5 text-base font-bold text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-900 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <SparklesIcon className="w-5 h-5" />
            {STRINGS.app.tryDemoBtn}
          </button>

          <button
            type="button"
            data-testid="build-plan-button"
            onClick={handleBuildPlan}
            className="w-full sm:w-auto px-6 py-3.5 text-base font-bold text-teal-800 bg-white hover:bg-slate-50 border border-teal-700 rounded-xl transition-colors min-h-[44px]"
          >
            {STRINGS.app.buildPlanBtn} →
          </button>
        </div>
      </section>

      {/* Preset Demo Personas Carousel / Selector */}
      <section className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            One-Tap Demo Personas (Sample Profiles)
          </span>
          <span className="text-xs text-slate-600">Zero config needed</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DEMO_PERSONAS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleTryDemo(p.id)}
              className="p-3.5 text-left rounded-xl bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 transition-all space-y-1 shadow-xs group min-h-[44px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 group-hover:text-teal-800">
                  {p.name}
                </span>
                <span className="text-xs text-teal-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Load →
                </span>
              </div>
              <p className="text-[11px] text-slate-600 line-clamp-2">{p.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* City Search */}
      <section className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <WindIcon className="w-4 h-4 text-teal-700" />
          Location & Smog Zone
        </label>
        <CitySearch />
      </section>

      {/* Family Profile Builder */}
      <section className="space-y-2">
        <FamilyBuilder />
      </section>

      {/* Action Footer */}
      <div className="flex justify-center pb-8">
        <button
          type="button"
          onClick={handleBuildPlan}
          className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-md hover:shadow-lg transition-all min-h-[44px]"
        >
          {STRINGS.app.buildPlanBtn} →
        </button>
      </div>
    </div>
  );
};
