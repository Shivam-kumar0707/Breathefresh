import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { useStore } from '../store/useStore';
import { STRINGS } from '../i18n/en';

export const HourlyChart: React.FC = () => {
  const { air } = useStore();

  if (!air || !air.hourlySeries || air.hourlySeries.length === 0) {
    return null;
  }

  // Format 48h series for Recharts
  const chartData = air.hourlySeries.map((item) => {
    const d = new Date(item.time);
    const dayLabel = d.toLocaleDateString([], { weekday: 'short' });
    const hourLabel = `${item.hour.toString().padStart(2, '0')}:00`;
    return {
      label: `${dayLabel} ${hourLabel}`,
      time: item.time,
      hour: item.hour,
      pm2_5: item.pm2_5,
      aqi: item.aqi,
      isBest: item.isBestWindow,
      isWorst: item.isWorstWindow,
    };
  });

  const bestHour = air.bestWindow.hour;
  const worstHour = air.worstWindow.hour;

  // Real visible text summary for DOM-reading agent and accessibility
  const summaryText = `48-hour PM2.5 forecast: values range from ${air.bestWindow.pm25} µg/m³ during the cleanest window (${air.bestWindow.timeLabel}) up to ${air.worstWindow.pm25} µg/m³ during peak inversion (${air.worstWindow.timeLabel}).`;

  return (
    <section
      aria-label="48-Hour PM2.5 and AQI Exposure Forecast Chart"
      className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            48-Hour PM2.5 Forecast & Diurnal Pattern
          </h3>
          <p className="text-xs text-slate-500">
            Hourly ambient concentrations with highlighted clean ventilation and peak inversion windows
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500" />
            <span className="text-slate-600 font-medium">Clean Window</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500" />
            <span className="text-slate-600 font-medium">Peak Smog</span>
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="pm25Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
              interval={5}
            />
            <YAxis
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
              domain={[0, 'auto']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-lg space-y-1">
                      <p className="font-semibold">{data.label}</p>
                      <p className="text-teal-300 font-mono">
                        PM2.5: {data.pm2_5} {STRINGS.air.unit}
                      </p>
                      <p className="text-slate-300">AQI: {data.aqi}</p>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Clean window reference area */}
            <ReferenceArea
              x1={chartData[bestHour]?.label}
              x2={chartData[Math.min(chartData.length - 1, bestHour + 2)]?.label}
              fill="#10b981"
              fillOpacity={0.15}
              stroke="#10b981"
              strokeDasharray="2 2"
            />

            {/* Peak smog reference area */}
            <ReferenceArea
              x1={chartData[worstHour]?.label}
              x2={chartData[Math.min(chartData.length - 1, worstHour + 2)]?.label}
              fill="#ef4444"
              fillOpacity={0.15}
              stroke="#ef4444"
              strokeDasharray="2 2"
            />

            <Area
              type="monotone"
              dataKey="pm2_5"
              stroke="#0d9488"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#pm25Gradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Accessible DOM-readable summary sentence */}
      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700">
        <strong>Forecast Summary: </strong>
        <span>{summaryText}</span>
      </div>
    </section>
  );
};
