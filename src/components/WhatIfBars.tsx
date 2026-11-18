import React from 'react';
import type { FamilyExposureResult } from '../engine/exposure';
import type { EmissionsBreakdown } from '../engine/emissions';

interface WhatIfBarsProps {
  baselineExposure: FamilyExposureResult;
  planExposure: FamilyExposureResult;
  baselineEmissions: EmissionsBreakdown;
  planEmissions: EmissionsBreakdown;
}

export const WhatIfBars: React.FC<WhatIfBarsProps> = ({
  baselineExposure,
  planExposure,
  baselineEmissions,
  planEmissions,
}) => {
  const eiDeltaPct =
    baselineExposure.averageEi > 0
      ? Math.round(
          ((planExposure.averageEi - baselineExposure.averageEi) / baselineExposure.averageEi) *
            1000
        ) / 10
      : 0;

  const cigDelta = Math.round((planExposure.totalCigEq - baselineExposure.totalCigEq) * 10) / 10;
  const co2eDelta =
    Math.round((planEmissions.totalCo2eKgWeek - baselineEmissions.totalCo2eKgWeek) * 10) / 10;

  // Real text summary for DOM agent
  const summaryText = `Under the selected action bundle, family Exposure Index changes from ${baselineExposure.averageEi} to ${planExposure.averageEi} µg/m³ (${eiDeltaPct}%), saving ${Math.abs(cigDelta)} cigarette equivalents per day and cutting ${Math.abs(co2eDelta)} kg CO2e per week.`;

  return (
    <div
      aria-label="What-If Baseline vs Plan Comparison"
      className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <h2 className="font-bold text-slate-900 text-base sm:text-lg">
          Live Impact Engine Comparison: Baseline vs. Active Plan
        </h2>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
          ⚡ Real-time client recompute (&lt;100ms)
        </span>
      </div>

      {/* Accessible Screen Reader Table */}
      <div className="sr-only">
        <h3 className="sr-only">Impact comparison summary</h3>
        <p>{summaryText}</p>
        <table>
          <caption>Comparison between Do Nothing baseline and Active Plan</caption>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">Baseline (Do Nothing)</th>
              <th scope="col">Active Plan</th>
              <th scope="col">Net Change</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Family Exposure Index</td>
              <td>{baselineExposure.averageEi} µg/m³</td>
              <td>{planExposure.averageEi} µg/m³</td>
              <td>{eiDeltaPct}%</td>
            </tr>
            <tr>
              <td>Daily Cigarettes Inhaled</td>
              <td>{baselineExposure.totalCigEq} cigs</td>
              <td>{planExposure.totalCigEq} cigs</td>
              <td>
                {cigDelta < 0 ? '-' : '+'}
                {Math.abs(cigDelta)} cigs
              </td>
            </tr>
            <tr>
              <td>Weekly CO2e Emissions</td>
              <td>{baselineEmissions.totalCo2eKgWeek} kg</td>
              <td>{planEmissions.totalCo2eKgWeek} kg</td>
              <td>
                {co2eDelta < 0 ? '-' : '+'}
                {Math.abs(co2eDelta)} kg
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3 Metric Comparison Blocks */}
      <div className="space-y-5" aria-hidden="true">
        {/* Metric 1: Family Exposure Index */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline text-xs sm:text-sm">
            <span className="font-bold text-slate-800">Family Exposure Index (EI)</span>
            <span className="font-extrabold text-emerald-800 font-mono">
              {eiDeltaPct}% Exposure
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            {/* Baseline Bar */}
            <div className="flex items-center gap-2">
              <span className="w-20 sm:w-24 text-slate-600 font-medium">Do Nothing</span>
              <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden relative">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-200"
                  style={{ width: `${Math.min(100, (baselineExposure.averageEi / 400) * 100)}%` }}
                />
              </div>
              <span className="w-16 font-mono font-bold text-right text-slate-900">
                {baselineExposure.averageEi} µg
              </span>
            </div>

            {/* Plan Bar */}
            <div className="flex items-center gap-2">
              <span className="w-20 sm:w-24 text-teal-800 font-bold">With Plan</span>
              <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden relative">
                <div
                  className="bg-teal-600 h-full rounded-full transition-all duration-200"
                  style={{ width: `${Math.min(100, (planExposure.averageEi / 400) * 100)}%` }}
                />
              </div>
              <span className="w-16 font-mono font-bold text-right text-teal-800">
                {planExposure.averageEi} µg
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Cumulative Cigarettes Inhaled / Day */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline text-xs sm:text-sm">
            <span className="font-bold text-slate-800">Daily Family Cigarette Equivalents</span>
            <span className="font-extrabold text-emerald-800 font-mono">
              {cigDelta < 0 ? '-' : '+'}
              {Math.abs(cigDelta)} cigs/day
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-20 sm:w-24 text-slate-600 font-medium">Do Nothing</span>
              <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden relative">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-200"
                  style={{ width: `${Math.min(100, (baselineExposure.totalCigEq / 60) * 100)}%` }}
                />
              </div>
              <span className="w-16 font-mono font-bold text-right text-slate-900">
                {baselineExposure.totalCigEq}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-20 sm:w-24 text-teal-800 font-bold">With Plan</span>
              <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden relative">
                <div
                  className="bg-teal-600 h-full rounded-full transition-all duration-200"
                  style={{ width: `${Math.min(100, (planExposure.totalCigEq / 60) * 100)}%` }}
                />
              </div>
              <span className="w-16 font-mono font-bold text-right text-teal-800">
                {planExposure.totalCigEq}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Weekly CO2e Emissions */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline text-xs sm:text-sm">
            <span className="font-bold text-slate-800">Weekly Household Emissions</span>
            <span className="font-extrabold text-teal-800 font-mono">
              {co2eDelta < 0 ? '-' : '+'}
              {Math.abs(co2eDelta)} kg CO₂e/week
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-20 sm:w-24 text-slate-600 font-medium">Baseline</span>
              <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden relative">
                <div
                  className="bg-slate-500 h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${Math.min(100, (baselineEmissions.totalCo2eKgWeek / 100) * 100)}%`,
                  }}
                />
              </div>
              <span className="w-16 font-mono font-bold text-right text-slate-900">
                {baselineEmissions.totalCo2eKgWeek} kg
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-20 sm:w-24 text-teal-800 font-bold">With Plan</span>
              <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden relative">
                <div
                  className="bg-teal-700 h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${Math.min(100, (planEmissions.totalCo2eKgWeek / 100) * 100)}%`,
                  }}
                />
              </div>
              <span className="w-16 font-mono font-bold text-right text-teal-800">
                {planEmissions.totalCo2eKgWeek} kg
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Accessible DOM-readable summary sentence */}
      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700">
        <strong>Summary: </strong>
        <span>{summaryText}</span>
      </div>
    </div>
  );
};
