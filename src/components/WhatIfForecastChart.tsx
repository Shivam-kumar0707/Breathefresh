import React from 'react';
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
import { STRINGS } from '../i18n/en';

export interface ForecastPoint {
  day: string;
  doNothingCig: number;
  withPlanCig: number;
  doNothingEi: number;
  withPlanEi: number;
}

interface WhatIfForecastChartProps {
  data: ForecastPoint[];
  planAverageEi: number;
  baselineAverageEi: number;
}

export const WhatIfForecastChart: React.FC<WhatIfForecastChartProps> = ({
  data,
  planAverageEi,
  baselineAverageEi,
}) => {
  return (
    <section
      aria-label="7-Day Exposure Outlook Chart"
      className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-bold text-slate-900 text-base">{STRINGS.whatIf.forecast7Day}</h2>
          <p className="text-xs text-slate-600">
            Projected daily family cigarette equivalents across the upcoming 7-day weather outlook
          </p>
        </div>
      </div>

      {/* Screen reader text summary for accessibility */}
      <div className="sr-only">
        <h3 className="sr-only">Accessible summary of 7-day exposure forecast</h3>
        <p>
          Following the active plan maintains family exposure at approximately {planAverageEi} µg/m³
          compared to {baselineAverageEi} µg/m³ without intervention.
        </p>
        <table>
          <caption>Daily cigarette equivalent comparison</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Do Nothing (cigs/day)</th>
              <th scope="col">With Plan (cigs/day)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.day}>
                <td>{point.day}</td>
                <td>{point.doNothingCig}</td>
                <td>{point.withPlanCig}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="h-60 sm:h-64 w-full pt-2" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#475569' }} />
            <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as ForecastPoint;
                  return (
                    <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-lg space-y-1">
                      <p className="font-semibold">{item.day}</p>
                      <p className="text-rose-300">
                        Do Nothing: {item.doNothingCig} cigs/day ({item.doNothingEi} µg/m³)
                      </p>
                      <p className="text-teal-300">
                        With Plan: {item.withPlanCig} cigs/day ({item.withPlanEi} µg/m³)
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
              stroke="#e11d48"
              strokeWidth={2.5}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="withPlanCig"
              name="With Active Plan (cigs/day)"
              stroke="#0f766e"
              strokeWidth={2.5}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800">
        <strong>7-Day Projection Summary: </strong>
        Following the active plan maintains family exposure at approximately {planAverageEi} µg/m³
        compared to {baselineAverageEi} µg/m³ without intervention.
      </div>
    </section>
  );
};
