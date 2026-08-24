'use client';

interface CalendarHeatmapProps {
  data: { DATE: string; OCCUPANCY: number }[];
  title?: string;
}

function getColor(occ: number): string {
  if (occ >= 85) return 'bg-emerald-500 text-white';
  if (occ >= 70) return 'bg-emerald-300 text-emerald-900';
  if (occ >= 60) return 'bg-amber-300 text-amber-900';
  if (occ >= 45) return 'bg-orange-300 text-orange-900';
  return 'bg-red-400 text-white';
}

export function CalendarHeatmap({ data, title = 'Occupancy Calendar — Next 30 Days' }: CalendarHeatmapProps) {
  const sorted = [...data].sort((a, b) => a.DATE.localeCompare(b.DATE));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
      <div className="grid grid-cols-7 gap-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-slate-400">{d}</div>
        ))}
        {sorted.map((day) => {
          const date = new Date(day.DATE);
          const dayOfWeek = date.getDay();
          const startPad = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          return null; // handled below
        })}
      </div>
      <div className="grid grid-cols-7 gap-1 mt-1">
        {(() => {
          if (sorted.length === 0) return null;
          const firstDate = new Date(sorted[0].DATE);
          const dow = firstDate.getDay();
          const offset = dow === 0 ? 6 : dow - 1;
          const cells = [];
          for (let i = 0; i < offset; i++) {
            cells.push(<div key={`pad-${i}`} className="h-9" />);
          }
          sorted.forEach((day) => {
            const occ = Math.round(day.OCCUPANCY);
            cells.push(
              <div
                key={day.DATE}
                className={`flex h-9 flex-col items-center justify-center rounded text-[10px] font-medium ${getColor(occ)}`}
                title={`${day.DATE}: ${occ}%`}
              >
                <span>{new Date(day.DATE).getDate()}</span>
                <span className="text-[8px] opacity-80">{occ}%</span>
              </div>
            );
          });
          return cells;
        })()}
      </div>
      <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-emerald-500" /> 85%+</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-emerald-300" /> 70-84%</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-amber-300" /> 60-69%</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-orange-300" /> 45-59%</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-red-400" /> &lt;45%</span>
      </div>
    </div>
  );
}
