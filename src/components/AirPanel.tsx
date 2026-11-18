import React from 'react';
import { useStore } from '../store/useStore';
import { STRINGS } from '../i18n/en';
import { CAQM_OFFICIAL_URL } from '../engine/grap';
import { AlertTriangleIcon, WindIcon } from './icons';

export const AirPanel: React.FC = () => {
  const { air, profile, isLoadingAir } = useStore();

  if (isLoadingAir || !air) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="h-20 bg-slate-100 rounded-xl"></div>
          <div className="h-20 bg-slate-100 rounded-xl"></div>
          <div className="h-20 bg-slate-100 rounded-xl"></div>
          <div className="h-20 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const { naqi, current, grapStage, isNcr, bestWindow, worstWindow, inversionRisk, isSampleData } = air;

  return (
    <section
      aria-label="Current Air Quality and Health Risk Panel"
      className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-5"
    >
      {/* Sample Data Fallback Banner */}
      {isSampleData && (
        <div
          role="status"
          className="flex items-center gap-2 p-3 text-xs sm:text-sm font-medium bg-amber-50 text-amber-900 border border-amber-200 rounded-xl"
        >
          <AlertTriangleIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>{STRINGS.status.sampleData}:</strong> {STRINGS.status.sampleDataDesc}
          </span>
        </div>
      )}

      {/* Header: City & DataSource */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full">
            {profile.city.name}
          </span>
          <h2 className="text-lg font-bold text-slate-800 mt-1 flex items-center gap-1.5">
            <WindIcon className="w-5 h-5 text-teal-600" />
            Live Ambient Air Quality
          </h2>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 font-mono">
            {new Date(current.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <p className="text-[11px] text-slate-400">{air.dataSourceLabel}</p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* India NAQI Card */}
        <div
          className="rounded-xl p-4 border transition-all"
          style={{ borderColor: `${naqi.color}40`, backgroundColor: `${naqi.color}0d` }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">{STRINGS.air.naqiTitle}</span>
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: naqi.color }}
              aria-hidden="true"
            />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              data-testid="aqi-value"
              className="text-3xl sm:text-4xl font-extrabold tracking-tight"
              style={{ color: naqi.color }}
            >
              {naqi.aqi}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded text-white" style={{ backgroundColor: naqi.color }}>
              {naqi.category}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">24h Rolling CPCB sub-index</p>
        </div>

        {/* PM2.5 Card */}
        <div className="rounded-xl p-4 bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">PM2.5 (Fine Dust)</span>
            <span className="text-[11px] text-slate-500">{STRINGS.air.unit}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
              {current.pm2_5}
            </span>
            <span className="text-xs text-slate-500">{STRINGS.air.unit}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">WHO 24h Guide: 15 µg/m³</p>
        </div>

        {/* PM10 Card */}
        <div className="rounded-xl p-4 bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">PM10 (Coarse)</span>
            <span className="text-[11px] text-slate-500">{STRINGS.air.unit}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
              {current.pm10}
            </span>
            <span className="text-xs text-slate-500">{STRINGS.air.unit}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Road dust & construction</p>
        </div>

        {/* US AQI Card */}
        <div className="rounded-xl p-4 bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">{STRINGS.air.usAqiTitle}</span>
            <span className="text-[11px] font-mono text-slate-500">EPA</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
              {current.us_aqi}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Hourly real-time index</p>
        </div>
      </div>

      {/* Best & Peak Smog Timing Windows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Cleanest Window */}
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold text-sm">
            ☀️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                {STRINGS.air.cleanWindow}
              </h4>
              <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                {bestWindow.timeLabel}
              </span>
            </div>
            <p className="text-xs text-emerald-800 mt-1">
              Lowest PM2.5 dips to <strong>{bestWindow.pm25} µg/m³</strong>. Best time for short cross-ventilation or necessary outdoor errands.
            </p>
          </div>
        </div>

        {/* Peak Smog Window */}
        <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 font-bold text-sm">
            ⚠️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                {STRINGS.air.worstWindow}
              </h4>
              <span className="text-xs font-mono font-semibold text-rose-800 bg-rose-100/70 px-1.5 py-0.2 rounded">
                {worstWindow.timeLabel}
              </span>
            </div>
            <p className="text-xs text-rose-800 mt-1">
              Smog peaks at <strong>{worstWindow.pm25} µg/m³</strong>. Seal doors, keep indoor HEPA purifiers running, and avoid outdoor exercise.
            </p>
          </div>
        </div>
      </div>

      {/* Inversion Warning (if detected) */}
      {inversionRisk && (
        <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 flex items-start gap-2.5 text-xs text-purple-900">
          <AlertTriangleIcon className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">{STRINGS.air.inversionAlert}:</span> {STRINGS.air.inversionDesc}
          </div>
        </div>
      )}

      {/* GRAP Stage Badge (Delhi NCR only) */}
      {isNcr && grapStage && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-bold bg-amber-400 text-slate-950 rounded">
                CAQM NCR
              </span>
              <span className="text-sm font-bold text-slate-100">
                {STRINGS.air.grapStageBadge}: {grapStage.stage} ({grapStage.name})
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Active measures: {grapStage.keyMeasures.slice(0, 2).join(' • ')}
            </p>
          </div>
          <a
            href={CAQM_OFFICIAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-300 hover:text-amber-200 underline font-medium flex-shrink-0 inline-flex items-center gap-1"
          >
            {STRINGS.air.caqmOfficialLink} →
          </a>
        </div>
      )}
    </section>
  );
};
