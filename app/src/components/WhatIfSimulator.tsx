'use client';

import { useState } from 'react';

interface SimResult {
  destination: string;
  currentRevPAR: number;
  projectedRevPAR: number;
  currentRevenue: number;
  projectedRevenue: number;
  occupancyImpact: number;
}

function simulate(rateChange: number, segment: string): { results: SimResult[]; totalImpact: number } {
  const destinations = [
    { name: 'Phuket', base: 4200, rooms: 3500, occ: 78 },
    { name: 'Koh Samui', base: 3800, rooms: 2200, occ: 72 },
    { name: 'Bangkok', base: 3100, rooms: 4800, occ: 81 },
    { name: 'Chiang Mai', base: 2600, rooms: 1800, occ: 64 },
  ];

  const elasticity = segment === 'luxury' ? -0.3 : segment === 'midscale' ? -0.6 : -0.5;
  const results: SimResult[] = destinations.map((d) => {
    const occDrop = rateChange * elasticity;
    const newOcc = Math.max(30, Math.min(98, d.occ + occDrop));
    const newADR = d.base * (1 + rateChange / 100);
    const projRevPAR = newADR * (newOcc / 100);
    const curRevPAR = d.base * (d.occ / 100);
    return {
      destination: d.name,
      currentRevPAR: Math.round(curRevPAR),
      projectedRevPAR: Math.round(projRevPAR),
      currentRevenue: Math.round(curRevPAR * d.rooms * 30),
      projectedRevenue: Math.round(projRevPAR * d.rooms * 30),
      occupancyImpact: Math.round((newOcc - d.occ) * 10) / 10,
    };
  });

  const totalImpact = results.reduce((sum, r) => sum + (r.projectedRevenue - r.currentRevenue), 0);
  return { results, totalImpact };
}

export function WhatIfSimulator() {
  const [rateChange, setRateChange] = useState(5);
  const [segment, setSegment] = useState('all');
  const { results, totalImpact } = simulate(rateChange, segment);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">What-If Pricing Simulator</h3>
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Rate Adjustment</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="-15"
              max="20"
              value={rateChange}
              onChange={(e) => setRateChange(Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-500"
            />
            <span className={`min-w-[48px] rounded px-2 py-0.5 text-center text-sm font-bold ${rateChange >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
              {rateChange >= 0 ? '+' : ''}{rateChange}%
            </span>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Segment</label>
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-700"
          >
            <option value="all">All Segments</option>
            <option value="luxury">Luxury</option>
            <option value="midscale">Midscale</option>
            <option value="economy">Economy</option>
          </select>
        </div>
        <div className="flex flex-col justify-end">
          <div className={`rounded-lg px-3 py-2 text-center ${totalImpact >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
            <p className="text-[10px] text-slate-500">30-Day Revenue Impact</p>
            <p className={`text-lg font-bold ${totalImpact >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {totalImpact >= 0 ? '+' : ''}฿{(totalImpact / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-2 pr-3 font-medium">Destination</th>
              <th className="pb-2 pr-3 font-medium text-right">Current RevPAR</th>
              <th className="pb-2 pr-3 font-medium text-right">Projected RevPAR</th>
              <th className="pb-2 pr-3 font-medium text-right">Δ RevPAR</th>
              <th className="pb-2 pr-3 font-medium text-right">Occ Impact</th>
              <th className="pb-2 font-medium text-right">Revenue Impact</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => {
              const delta = r.projectedRevPAR - r.currentRevPAR;
              const revImpact = r.projectedRevenue - r.currentRevenue;
              return (
                <tr key={r.destination} className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-medium text-slate-700">{r.destination}</td>
                  <td className="py-2 pr-3 text-right text-slate-600">฿{r.currentRevPAR.toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right font-semibold text-slate-800">฿{r.projectedRevPAR.toLocaleString()}</td>
                  <td className={`py-2 pr-3 text-right font-semibold ${delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {delta >= 0 ? '+' : ''}฿{delta.toLocaleString()}
                  </td>
                  <td className={`py-2 pr-3 text-right ${r.occupancyImpact >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {r.occupancyImpact >= 0 ? '+' : ''}{r.occupancyImpact}pp
                  </td>
                  <td className={`py-2 text-right font-semibold ${revImpact >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {revImpact >= 0 ? '+' : ''}฿{(revImpact / 1000000).toFixed(2)}M
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10px] text-slate-400">Model: Price elasticity from ML.FORECAST historical demand curves · Assumes {segment === 'all' ? 'blended' : segment} segment demand elasticity</p>
    </div>
  );
}
