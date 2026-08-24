'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart,
} from 'recharts';

interface ForecastChartProps {
  data: { DATE: string; ACTUAL: number | null; FORECAST: number | null; STLY: number | null; UPPER?: number | null; LOWER?: number | null }[];
  title?: string;
  height?: number;
  yLabel?: string;
}

export function ForecastChart({ data, title = 'Booking Pace vs Forecast', height = 350, yLabel }: ForecastChartProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-slate-700">{title}</h3>
      <p className="mb-3 text-[11px] text-slate-400">Solid = Actual | Dashed = ML.FORECAST | Dotted = Same-Time-Last-Year</p>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="DATE" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 11 } } : undefined} />
          <Tooltip />
          <Legend />
          {data.some((d) => d.UPPER != null) && (
            <Area type="monotone" dataKey="UPPER" stroke="none" fill="#29B5E8" fillOpacity={0.08} name="Confidence Band" />
          )}
          {data.some((d) => d.LOWER != null) && (
            <Area type="monotone" dataKey="LOWER" stroke="none" fill="#29B5E8" fillOpacity={0.08} legendType="none" />
          )}
          <Line type="monotone" dataKey="ACTUAL" name="Actual Pace" stroke="#29B5E8" strokeWidth={2.5} dot={false} connectNulls={false} />
          <Line type="monotone" dataKey="FORECAST" name="ML.FORECAST" stroke="#FF6B35" strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls={false} />
          <Line type="monotone" dataKey="STLY" name="Same-Time-Last-Year" stroke="#8B5CF6" strokeWidth={1.5} strokeDasharray="2 2" dot={false} connectNulls={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
