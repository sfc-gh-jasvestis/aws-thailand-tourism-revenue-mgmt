'use client';

interface DemandSignal {
  SOURCE_MARKET: string;
  DEMAND_CURRENT: number;
  DEMAND_PRIOR: number;
  WOW_CHANGE: number;
}

interface DemandSignalsProps {
  data: DemandSignal[];
  title?: string;
}

export function DemandSignals({ data, title = 'Forward Demand Signals — Next 90 Days (Flight + Hotel Searches)' }: DemandSignalsProps) {
  const maxDemand = Math.max(...data.map((d) => d.DEMAND_CURRENT), 1);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
          vs Prior Period
        </span>
      </div>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.SOURCE_MARKET} className="flex items-center gap-3">
            <span className="w-20 text-xs font-medium text-slate-700 truncate">{d.SOURCE_MARKET}</span>
            <div className="flex-1 relative h-6 rounded bg-slate-100">
              <div
                className="absolute inset-y-0 left-0 rounded bg-blue-400/70"
                style={{ width: `${(d.DEMAND_CURRENT / maxDemand) * 100}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded border-r-2 border-dashed border-slate-400"
                style={{ width: `${(d.DEMAND_PRIOR / maxDemand) * 100}%` }}
              />
              <span className="absolute inset-y-0 right-2 flex items-center text-[10px] font-medium text-slate-600">
                {d.DEMAND_CURRENT}
              </span>
            </div>
            <span className={`w-14 text-right text-xs font-bold ${d.WOW_CHANGE >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {d.WOW_CHANGE >= 0 ? '↑' : '↓'} {Math.abs(d.WOW_CHANGE)}%
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-slate-400">Demand Index based on flight searches + hotel search volume. Dashed line = prior period baseline.</p>
    </div>
  );
}
