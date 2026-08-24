'use client';

interface PickupRow {
  ARRIVAL_DATE: string;
  OTB_TODAY: number;
  OTB_YESTERDAY: number;
  PICKUP: number;
  OTB_STLY: number;
  PACE_VS_STLY: number;
}

function generatePickupData(): PickupRow[] {
  const today = new Date();
  const rows: PickupRow[] = [];
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const baseOTB = isWeekend ? 85 + Math.floor(Math.random() * 12) : 55 + Math.floor(Math.random() * 25);
    const pickup = Math.floor(Math.random() * 8) - 2;
    const stly = baseOTB - 5 + Math.floor(Math.random() * 10);
    rows.push({
      ARRIVAL_DATE: d.toISOString().split('T')[0],
      OTB_TODAY: baseOTB,
      OTB_YESTERDAY: baseOTB - pickup,
      PICKUP: pickup,
      OTB_STLY: stly,
      PACE_VS_STLY: Math.round(((baseOTB - stly) / stly) * 100),
    });
  }
  return rows;
}

export function PickupReport() {
  const data = generatePickupData();
  const totalPickup = data.reduce((sum, r) => sum + r.PICKUP, 0);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Daily Pickup Report — Next 14 Days</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${totalPickup >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          Net Pickup: {totalPickup >= 0 ? '+' : ''}{totalPickup} rooms
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-2 pr-3 font-medium">Arrival Date</th>
              <th className="pb-2 pr-3 font-medium text-right">OTB Today</th>
              <th className="pb-2 pr-3 font-medium text-right">OTB Yesterday</th>
              <th className="pb-2 pr-3 font-medium text-right">Pickup</th>
              <th className="pb-2 pr-3 font-medium text-right">OTB STLY</th>
              <th className="pb-2 font-medium text-right">vs STLY</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const day = new Date(row.ARRIVAL_DATE).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              const isWeekend = new Date(row.ARRIVAL_DATE).getDay() === 0 || new Date(row.ARRIVAL_DATE).getDay() === 6;
              return (
                <tr key={row.ARRIVAL_DATE} className={`border-b border-slate-100 ${isWeekend ? 'bg-blue-50/40' : ''}`}>
                  <td className="py-1.5 pr-3 font-medium text-slate-700">{day}</td>
                  <td className="py-1.5 pr-3 text-right font-semibold text-slate-800">{row.OTB_TODAY}%</td>
                  <td className="py-1.5 pr-3 text-right text-slate-500">{row.OTB_YESTERDAY}%</td>
                  <td className={`py-1.5 pr-3 text-right font-semibold ${row.PICKUP > 0 ? 'text-emerald-600' : row.PICKUP < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                    {row.PICKUP > 0 ? '+' : ''}{row.PICKUP}
                  </td>
                  <td className="py-1.5 pr-3 text-right text-slate-500">{row.OTB_STLY}%</td>
                  <td className={`py-1.5 text-right font-medium ${row.PACE_VS_STLY >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {row.PACE_VS_STLY >= 0 ? '+' : ''}{row.PACE_VS_STLY}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10px] text-slate-400">Source: BOOKING_PACE Dynamic Table · Refreshed: {new Date().toLocaleTimeString()}</p>
    </div>
  );
}
