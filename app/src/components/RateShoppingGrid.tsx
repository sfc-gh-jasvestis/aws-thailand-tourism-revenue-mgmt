'use client';

interface RateRow {
  STAY_DATE: string;
  PROPERTY_NAME: string;
  YOUR_RATE: number;
  BOOKING_COM: number;
  AGODA: number;
  EXPEDIA: number;
  DIRECT: number;
  COMP_AVG: number;
  RATE_POSITION: string;
}

interface RateShoppingGridProps {
  data: RateRow[];
  title?: string;
}

function positionBadge(position: string) {
  switch (position) {
    case 'UNDERPRICED':
      return <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">Below</span>;
    case 'OVERPRICED':
      return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">Above</span>;
    default:
      return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Parity</span>;
  }
}

function formatRate(v: number) {
  return v ? `฿${v.toLocaleString()}` : '—';
}

export function RateShoppingGrid({ data, title = 'Rate Shopping — Competitive Position by Channel' }: RateShoppingGridProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-3 font-medium">Date</th>
              <th className="py-2 pr-3 font-medium">Property</th>
              <th className="py-2 pr-2 font-medium text-right">Your Rate</th>
              <th className="py-2 pr-2 font-medium text-right">Booking.com</th>
              <th className="py-2 pr-2 font-medium text-right">Agoda</th>
              <th className="py-2 pr-2 font-medium text-right">Expedia</th>
              <th className="py-2 pr-2 font-medium text-right">Direct</th>
              <th className="py-2 pr-2 font-medium text-right">Comp Avg</th>
              <th className="py-2 font-medium text-center">Position</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2 pr-3 text-slate-600">{row.STAY_DATE}</td>
                <td className="py-2 pr-3 font-medium text-slate-800 max-w-[140px] truncate">{row.PROPERTY_NAME}</td>
                <td className="py-2 pr-2 text-right font-semibold text-slate-900">{formatRate(row.YOUR_RATE)}</td>
                <td className="py-2 pr-2 text-right text-slate-600">{formatRate(row.BOOKING_COM)}</td>
                <td className="py-2 pr-2 text-right text-slate-600">{formatRate(row.AGODA)}</td>
                <td className="py-2 pr-2 text-right text-slate-600">{formatRate(row.EXPEDIA)}</td>
                <td className="py-2 pr-2 text-right text-slate-600">{formatRate(row.DIRECT)}</td>
                <td className="py-2 pr-2 text-right font-medium text-slate-700">{formatRate(row.COMP_AVG)}</td>
                <td className="py-2 text-center">{positionBadge(row.RATE_POSITION)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-400">No rate data available</p>
      )}
    </div>
  );
}
