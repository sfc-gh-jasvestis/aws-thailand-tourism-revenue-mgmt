'use client';

interface CompSetProperty {
  name: string;
  destination: string;
  myRate: number;
  compAvg: number;
  compMin: number;
  compMax: number;
  index: number;
}

function generateCompSetData(): CompSetProperty[] {
  const properties = [
    { name: 'Anantara Riverside', dest: 'Bangkok', base: 5800 },
    { name: 'Banyan Tree Samui', dest: 'Koh Samui', base: 8200 },
    { name: 'Trisara Phuket', dest: 'Phuket', base: 12000 },
    { name: 'Four Seasons Chiang Mai', dest: 'Chiang Mai', base: 9500 },
    { name: 'Centara Grand Beach', dest: 'Phuket', base: 4200 },
    { name: 'Dusit Thani Hua Hin', dest: 'Hua Hin', base: 3800 },
    { name: 'Mandarin Oriental BKK', dest: 'Bangkok', base: 11000 },
    { name: 'Six Senses Yao Noi', dest: 'Phuket', base: 15000 },
    { name: 'W Koh Samui', dest: 'Koh Samui', base: 7600 },
    { name: 'Intercontinental Pattaya', dest: 'Pattaya', base: 4600 },
  ];

  return properties.map((p) => {
    const compAvg = p.base * (0.9 + Math.random() * 0.2);
    const myRate = p.base * (0.85 + Math.random() * 0.3);
    const spread = compAvg * 0.2;
    return {
      name: p.name,
      destination: p.dest,
      myRate: Math.round(myRate),
      compAvg: Math.round(compAvg),
      compMin: Math.round(compAvg - spread),
      compMax: Math.round(compAvg + spread),
      index: Math.round((myRate / compAvg) * 100),
    };
  }).sort((a, b) => a.index - b.index);
}

export function CompSetPosition() {
  const data = generateCompSetData();
  const avgIndex = Math.round(data.reduce((s, d) => s + d.index, 0) / data.length);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Competitive Rate Position (Top 10 Properties)</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${avgIndex >= 100 ? 'bg-emerald-100 text-emerald-800' : avgIndex >= 90 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
          Avg Index: {avgIndex}
        </span>
      </div>
      <div className="space-y-2">
        {data.map((row) => {
          const barWidth = 100;
          const range = row.compMax - row.compMin;
          const myPos = Math.min(100, Math.max(0, ((row.myRate - row.compMin) / range) * 100));
          const avgPos = ((row.compAvg - row.compMin) / range) * 100;

          return (
            <div key={row.name} className="flex items-center gap-3">
              <div className="w-40 shrink-0">
                <p className="truncate text-xs font-medium text-slate-700">{row.name}</p>
                <p className="text-[10px] text-slate-400">{row.destination}</p>
              </div>
              <div className="relative h-6 flex-1 rounded-full bg-slate-100">
                {/* Comp range bar */}
                <div className="absolute inset-y-1 rounded-full bg-slate-200" style={{ left: '5%', right: '5%' }} />
                {/* Comp avg marker */}
                <div
                  className="absolute top-0.5 h-5 w-0.5 bg-slate-400"
                  style={{ left: `${5 + avgPos * 0.9}%` }}
                  title={`Comp Avg: ฿${row.compAvg.toLocaleString()}`}
                />
                {/* My rate dot */}
                <div
                  className={`absolute top-0.5 h-5 w-5 rounded-full border-2 ${row.index >= 100 ? 'border-emerald-500 bg-emerald-100' : row.index >= 90 ? 'border-amber-500 bg-amber-100' : 'border-red-500 bg-red-100'}`}
                  style={{ left: `${Math.max(0, 5 + myPos * 0.9 - 2.5)}%` }}
                  title={`My Rate: ฿${row.myRate.toLocaleString()}`}
                />
              </div>
              <div className="w-20 shrink-0 text-right">
                <span className={`text-xs font-bold ${row.index >= 100 ? 'text-emerald-600' : row.index >= 90 ? 'text-amber-600' : 'text-red-600'}`}>
                  {row.index}
                </span>
                <span className="ml-0.5 text-[10px] text-slate-400">idx</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-400">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full border-2 border-emerald-500 bg-emerald-100" /> Above comp set (≥100)</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full border-2 border-amber-500 bg-amber-100" /> Near parity (90-99)</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full border-2 border-red-500 bg-red-100" /> Below comp set (&lt;90)</span>
        <span className="flex items-center gap-1"><span className="inline-block h-4 w-0.5 bg-slate-400" /> Comp set average</span>
      </div>
    </div>
  );
}
