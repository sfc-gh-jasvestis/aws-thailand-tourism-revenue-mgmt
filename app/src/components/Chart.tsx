'use client';

import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart,
} from 'recharts';

const COLORS = ['#29B5E8', '#FF6B35', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6366F1', '#EC4899'];

interface ChartProps {
  data: Record<string, any>[];
  type: 'bar' | 'line' | 'area' | 'pie' | 'dual-axis';
  xKey: string;
  yKeys: { key: string; name: string; color?: string; yAxisId?: string; type?: 'bar' | 'line' }[];
  title?: string;
  height?: number;
  stacked?: boolean;
  rightAxisLabel?: string;
  leftAxisLabel?: string;
}

export function Chart({ data, type, xKey, yKeys, title, height = 300, stacked = false, rightAxisLabel, leftAxisLabel }: ChartProps) {
  const renderChart = () => {
    switch (type) {
      case 'dual-axis':
        return (
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} label={leftAxisLabel ? { value: leftAxisLabel, angle: -90, position: 'insideLeft', style: { fontSize: 11 } } : undefined} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} label={rightAxisLabel ? { value: rightAxisLabel, angle: 90, position: 'insideRight', style: { fontSize: 11 } } : undefined} />
            <Tooltip />
            <Legend />
            {yKeys.map((y, i) => {
              const axisId = y.yAxisId || 'left';
              if (y.type === 'line') {
                return <Line key={y.key} yAxisId={axisId} type="monotone" dataKey={y.key} name={y.name} stroke={y.color || COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />;
              }
              return <Bar key={y.key} yAxisId={axisId} dataKey={y.key} name={y.name} fill={y.color || COLORS[i % COLORS.length]} />;
            })}
          </ComposedChart>
        );
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {yKeys.map((y, i) => (
              <Bar key={y.key} dataKey={y.key} name={y.name} fill={y.color || COLORS[i % COLORS.length]} stackId={stacked ? 'stack' : undefined} />
            ))}
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {yKeys.map((y, i) => (
              <Line key={y.key} type="monotone" dataKey={y.key} name={y.name} stroke={y.color || COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {yKeys.map((y, i) => (
              <Area key={y.key} type="monotone" dataKey={y.key} name={y.name} fill={y.color || COLORS[i % COLORS.length]} stroke={y.color || COLORS[i % COLORS.length]} fillOpacity={0.3} />
            ))}
          </AreaChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie data={data} dataKey={yKeys[0].key} nameKey={xKey} cx="50%" cy="50%" outerRadius={100} label>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      {title && <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
