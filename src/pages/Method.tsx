import React from 'react';
import {
  ACH,
  CIG_PM25,
  CONSTANT_DOCS,
  DEPOSITION,
  MIN_INDOOR_FRACTION,
  PENETRATION,
} from '../engine/constants';
import { STRINGS } from '../i18n/en';
import { AlertTriangleIcon, ShieldIcon, SparklesIcon } from '../components/icons';

export const Method: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 sm:py-8">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-2">
          <ShieldIcon className="w-3.5 h-3.5 text-teal-600" />
          <span>Scientific Transparency & Purity</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {STRINGS.method.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
          {STRINGS.method.subtitle}
        </p>
      </div>

      {/* Prominent Medical Disclaimer */}
      <section className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangleIcon className="w-5 h-5 text-amber-700 flex-shrink-0" />
          <h2 className="font-bold text-sm sm:text-base text-amber-900">
            {STRINGS.method.disclaimerHeader}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
          {STRINGS.app.notMedicalAdvice}
        </p>
        <p className="text-xs text-amber-800">
          Always consult licensed medical practitioners for persistent respiratory discomfort, cough, or underlying cardiopulmonary conditions. If you experience severe symptoms such as chest tightness or acute shortness of breath, seek emergency medical care immediately.
        </p>
      </section>

      {/* The Number Guard Feature */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-bold text-slate-900">
            {STRINGS.method.numberGuardTitle}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          {STRINGS.method.numberGuardDesc}
        </p>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 space-y-1">
          <p>
            <strong>Enforcement Pipeline:</strong>
          </p>
          <p>1. Engine computes verified metrics (AQI, PM2.5, CigEq, Action Deltas).</p>
          <p>2. Allowed number set constructed: allowedNumbers = Set[...engineValues, hours(0..24)].</p>
          <p>3. Groq LLM text passes through sanitizeTextWithNumberGuard() prior to React render.</p>
          <p>4. Any unapproved or hallucinated numeric values are stripped and replaced with verified fallback statements.</p>
        </div>
      </section>

      {/* Mathematical Models */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">
          Core Mathematical & Physical Models
        </h2>

        {/* Model 1: Indoor PM2.5 Concentration */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-base text-slate-900">
            1. Indoor PM2.5 Mass Balance Model (LBNL Steady-State)
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Calculates indoor fine particulate concentration as an aerosol balance between ambient penetration, building air change rates, indoor deposition, air purifier CADR, and indoor sources:
          </p>
          <div className="p-4 bg-slate-900 text-teal-300 font-mono text-xs sm:text-sm rounded-xl overflow-x-auto">
            C_in = (PENETRATION × a × C_out) / (a + DEPOSITION + CADR / V) + sourceAdd
          </div>
          <ul className="text-xs text-slate-700 space-y-1 pl-4 list-disc">
            <li><strong>PENETRATION:</strong> {PENETRATION} (fraction entering through structural cracks)</li>
            <li><strong>a (ACH):</strong> Air changes/hr by window state ({ACH.closed} closed, {ACH.sealed} sealed, {ACH.open} open)</li>
            <li><strong>DEPOSITION:</strong> {DEPOSITION} h⁻¹ (surface settling velocity)</li>
            <li><strong>CADR:</strong> Clean Air Delivery Rate (m³/h) of active HEPA air cleaner</li>
            <li><strong>V:</strong> Room volume (m³) = Area (m²) × 2.7m ceiling height</li>
            <li><strong>Clamp:</strong> C_in is physically bounded to at least {MIN_INDOOR_FRACTION * 100}% of outdoor concentration ({MIN_INDOOR_FRACTION} × C_out) to account for filter bypass.</li>
          </ul>
        </div>

        {/* Model 2: Inhalation Dose & Exposure Index */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-base text-slate-900">
            2. Personal Inhalation Dose & Exposure Index (EI)
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Calculates the breathing-weighted particulate intake across each 24-hour microenvironment block:
          </p>
          <div className="p-4 bg-slate-900 text-teal-300 font-mono text-xs sm:text-sm rounded-xl overflow-x-auto space-y-1">
            <p>dose(h) = C_microenv(h) × BREATHING[activity] × (1 − MASK[mask])</p>
            <p>EI = Σ dose(h) for h=0..23 ÷ 24 (breathing-weighted 24h µg/m³)</p>
          </div>
          <p className="text-xs text-slate-600">
            Where <code>C_microenv(h)</code> is assigned based on location (Home: C_in, Work/School: 0.7 × C_out, Outdoor: C_out, Commute: C_out × CommuteFactor).
          </p>
        </div>

        {/* Model 3: Berkeley Earth Cigarette Heuristic */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-base text-slate-900">
            3. Berkeley Earth Cigarette Equivalence Heuristic
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Used as an intuitive communication metric to translate abstract air quality measurements into relatable impact:
          </p>
          <div className="p-4 bg-slate-900 text-amber-300 font-mono text-xs sm:text-sm rounded-xl">
            Cigarette Equivalents = Exposure Index (EI) ÷ {CIG_PM25}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Formulated by Richard & Elizabeth Muller (Berkeley Earth). Based on epidemiological cohort studies showing that inhaling 22 µg/m³ of PM2.5 continuously for 24 hours imparts cardiopulmonary hazard equivalent to smoking approximately 1 cigarette per day.
          </p>
        </div>

        {/* Model 4: Weekly Greenhouse Gas Emissions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-base text-slate-900">
            4. Weekly Household CO₂e Greenhouse Gas Accounting
          </h3>
          <div className="p-4 bg-slate-900 text-teal-300 font-mono text-xs sm:text-sm rounded-xl overflow-x-auto">
            CO2e_kg_week = Σ (distanceKm × CO2E_G_PER_PKM[mode] ÷ occupancy) × 5 ÷ 1000 + Fuel_Cooking + Fuel_Heating
          </div>
          <p className="text-xs text-slate-600">
            Follows IPCC emission factors for urban mobility and residential fuels.
          </p>
        </div>
      </section>

      {/* Engine Constants Table */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">
          Engine Constants & Source Verification
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          All values live exclusively in <code>src/engine/constants.ts</code> and are verified against peer-reviewed atmospheric and building science publications:
        </p>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Constant</th>
                  <th className="p-3">Assumed Value</th>
                  <th className="p-3">Scientific Source</th>
                  <th className="p-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CONSTANT_DOCS.map((c) => (
                  <tr key={c.name} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-teal-800">{c.name}</td>
                    <td className="p-3 font-semibold text-slate-800">{c.value}</td>
                    <td className="p-3 text-slate-600 italic">{c.source}</td>
                    <td className="p-3 text-slate-600">{c.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
