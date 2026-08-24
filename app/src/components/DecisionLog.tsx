'use client';

import { useState } from 'react';

interface Decision {
  id: string;
  timestamp: string;
  type: 'rate_increase' | 'rate_decrease' | 'hold' | 'promotion';
  destination: string;
  segment: string;
  action: string;
  rationale: string;
  approvedBy: string;
  status: 'approved' | 'pending' | 'executed' | 'rejected';
  impact?: string;
}

function generateDecisionLog(): Decision[] {
  const now = new Date();
  return [
    {
      id: 'DEC-001',
      timestamp: new Date(now.getTime() - 2 * 3600000).toISOString(),
      type: 'rate_increase',
      destination: 'Phuket',
      segment: 'Luxury',
      action: '+12% BAR increase for 14 properties',
      rationale: 'Chinese demand surge detected (+24% WoW). ML.FORECAST confidence 92%. Comp set already adjusted +8%.',
      approvedBy: 'Siriporn C.',
      status: 'executed',
      impact: '+฿2.4M projected 30-day impact',
    },
    {
      id: 'DEC-002',
      timestamp: new Date(now.getTime() - 5 * 3600000).toISOString(),
      type: 'hold',
      destination: 'Bangkok',
      segment: 'Midscale',
      action: 'Hold current rates — no adjustment',
      rationale: 'Demand stable at 81% occ. Comp index at 102. No signal justifying change.',
      approvedBy: 'AI Agent',
      status: 'approved',
    },
    {
      id: 'DEC-003',
      timestamp: new Date(now.getTime() - 8 * 3600000).toISOString(),
      type: 'promotion',
      destination: 'Chiang Mai',
      segment: 'All',
      action: 'Midweek promo: -15% Tue-Thu for 30 days',
      rationale: 'Pace index 88.1 vs STLY target 95. Low season starting 2 weeks early. Need to stimulate midweek demand.',
      approvedBy: 'Siriporn C.',
      status: 'executed',
      impact: '+8pp occupancy projected',
    },
    {
      id: 'DEC-004',
      timestamp: new Date(now.getTime() - 12 * 3600000).toISOString(),
      type: 'rate_increase',
      destination: 'Koh Samui',
      segment: 'Luxury',
      action: '+8% BAR for beachfront villas',
      rationale: 'Rate parity violation corrected — OTA channels were 14% above direct. Aligning direct channel upward.',
      approvedBy: 'Revenue Bot',
      status: 'executed',
      impact: '+฿890K monthly revenue gain',
    },
    {
      id: 'DEC-005',
      timestamp: new Date(now.getTime() - 1 * 3600000).toISOString(),
      type: 'rate_increase',
      destination: 'Phuket',
      segment: 'Economy',
      action: '+5% BAR for 8 properties near Patong',
      rationale: 'Spillover demand from luxury segment. Economy comp set index dropped to 94 — opportunity to capture.',
      approvedBy: 'Pending',
      status: 'pending',
    },
  ];
}

const typeIcons: Record<string, string> = {
  rate_increase: '↑',
  rate_decrease: '↓',
  hold: '═',
  promotion: '🎯',
};

const typeColors: Record<string, string> = {
  rate_increase: 'text-emerald-600 bg-emerald-50',
  rate_decrease: 'text-red-600 bg-red-50',
  hold: 'text-slate-600 bg-slate-50',
  promotion: 'text-purple-600 bg-purple-50',
};

const statusColors: Record<string, string> = {
  approved: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700',
  executed: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

export function DecisionLog() {
  const [decisions] = useState(generateDecisionLog);

  const pendingCount = decisions.filter((d) => d.status === 'pending').length;
  const executedToday = decisions.filter((d) => d.status === 'executed').length;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Revenue Decision Audit Log</h3>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              {pendingCount} pending
            </span>
          )}
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
            {executedToday} executed today
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {decisions.map((dec) => {
          const time = new Date(dec.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          const hoursAgo = Math.round((Date.now() - new Date(dec.timestamp).getTime()) / 3600000);
          return (
            <div key={dec.id} className="rounded-lg border border-slate-100 p-3 hover:bg-slate-50/50">
              <div className="flex items-start gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${typeColors[dec.type]}`}>
                  {typeIcons[dec.type]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-slate-800">{dec.action}</p>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusColors[dec.status]}`}>
                      {dec.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-500">{dec.destination} · {dec.segment} · {time} ({hoursAgo}h ago)</p>
                  <p className="mt-1 text-[11px] text-slate-600">{dec.rationale}</p>
                  <div className="mt-1 flex items-center gap-3 text-[10px]">
                    <span className="text-slate-400">Approved: <span className="font-medium text-slate-600">{dec.approvedBy}</span></span>
                    {dec.impact && <span className="font-medium text-emerald-600">{dec.impact}</span>}
                    <span className="text-slate-300">{dec.id}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] text-slate-400">All decisions logged to Snowflake EVENT_TABLE for compliance audit · Cortex Agent auto-approves if confidence ≥ 95% and impact ≤ ฿500K</p>
    </div>
  );
}
