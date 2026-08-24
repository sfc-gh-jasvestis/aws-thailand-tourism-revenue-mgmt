'use client';

import { useState, useRef } from 'react';

interface ActionMemoProps {
  persona: { name: string; role: string };
  context: Record<string, any>;
  onGenerate: (persona: string, context: Record<string, any>) => Promise<{ subject: string; body: string; urgency: string; actions: string[] }>;
  onSend?: (memo: { subject: string; body: string }) => Promise<void>;
}

const MEMO_VARIANTS = [
  {
    subject: 'Revenue Optimization — Immediate Rate Adjustment Required',
    urgency: 'HIGH',
    riskAmount: '฿18.2M',
    actions: [
      'Approve +8-12% BAR increase for 14 Phuket Luxury properties (India demand surge)',
      'Correct rate parity for 12 Koh Samui properties (direct channel -14% vs OTA)',
      'Initiate Chiang Mai midweek promotion (Tue-Thu, -15% for 30 days)',
      'Schedule follow-up review in 72h to assess booking pace response',
    ],
    body: `REVENUE AT RISK: ฿18.2M over the next 30 days from sub-optimal pricing

KEY FINDINGS:
• 34 properties priced below competitive set — potential ฿12.4M/month uplift
• India market demand surging (+24% WoW) — Phuket luxury segment under-capitalizing
• Chiang Mai pace index at 88.1 vs target 95 — low season starting 2 weeks early

RECOMMENDED ACTIONS:
1. Phuket Luxury: +8-12% effective immediately → projected +฿5.6M/30d
2. Koh Samui Parity Fix: align direct channel to OTA → projected +฿2.1M/30d
3. Chiang Mai Promo: -15% midweek → projected +8pp occupancy lift

AUTOMATION: EventBridge rate push ready (pending approval). Time to market: 2h.
Confidence: 92% (ML.FORECAST + 3yr pattern match)`,
  },
  {
    subject: 'Weekend Demand Alert — Capacity Optimization Needed',
    urgency: 'MEDIUM',
    riskAmount: '฿6.8M',
    actions: [
      'Release 340 held rooms across Phuket cluster (group block expired)',
      'Increase weekend BAR +5% for properties at >85% OTB',
      'Activate last-minute direct-booking incentive for Koh Samui (Fri-Sun)',
      'Push length-of-stay discount (3+ nights) to capture shoulder demand',
    ],
    body: `OPPORTUNITY: ฿6.8M additional revenue from weekend capacity optimization

KEY FINDINGS:
• 340 rooms held under expired group blocks — not yet released to transient
• 18 properties above 85% OTB for this weekend — rate increase justified
• Koh Samui weekend pace +12% vs last week but ADR flat — leaving money on table
• Length-of-stay mix declining: avg 2.1 nights vs 2.8 STLY

RECOMMENDED ACTIONS:
1. Release expired blocks immediately → estimated 78% pickup within 48h
2. Weekend BAR +5% for high-OTB properties → projected +฿1.2M
3. Direct channel incentive for Koh Samui → capture +฿800K from OTA shift
4. LOS discount (3+ nights -8%) → increase avg stay, improve total RevPAR

AUTOMATION: Channel manager sync queued. Block release requires manual confirmation.
Confidence: 88% (booking curve analysis + comp set movement)`,
  },
  {
    subject: 'Competitive Threat — 3 Properties Losing Share to New Entrants',
    urgency: 'HIGH',
    riskAmount: '฿4.1M',
    actions: [
      'Immediate rate repositioning for Patong Beach cluster (-8% to match new supply)',
      'Activate loyalty member exclusive rates for direct channel',
      'Launch "Stay Longer, Save More" package for affected properties',
      'Review distribution strategy — increase metasearch bid for target dates',
    ],
    body: `COMPETITIVE THREAT: ฿4.1M annual revenue at risk from new market entrants

KEY FINDINGS:
• 2 new luxury properties opened in Patong (combined 280 keys) — pulling share
• Our 3 Patong properties dropped from 96 to 82 comp index in 14 days
• New entrants pricing 12% below our BAR with aggressive OTA positioning
• Guest review scores competitive (4.6 vs our 4.7) — price becoming tiebreaker

RECOMMENDED ACTIONS:
1. Tactical rate reduction -8% for next 60 days to maintain share → stabilize bookings
2. Loyalty rates: additional -5% for members → shift mix to direct (lower commission)
3. Value-add packaging to justify premium vs new entrants
4. Metasearch bid increase +20% for Patong dates → protect visibility

RISK: Maintaining current rates risks occupancy dropping below 60% breakeven.
Confidence: 85% (STR data + OTA scrape + booking curve deviation)`,
  },
  {
    subject: 'Seasonal Transition — Proactive Low Season Strategy Required',
    urgency: 'MEDIUM',
    riskAmount: '฿22.5M',
    actions: [
      'Pre-approve tiered rate reductions: -10% (May), -15% (Jun-Jul) for Chiang Mai & Hua Hin',
      'Activate domestic market campaign (฿500K media spend pre-approved)',
      'Launch F&B inclusive packages for properties below 55% forward occupancy',
      'Negotiate group rates for MICE segment (Q3 conference pipeline: 12 RFPs pending)',
    ],
    body: `SEASONAL RISK: ฿22.5M revenue gap between current trajectory and budget target (May-Jul)

KEY FINDINGS:
• Forward bookings for May-Jul running -18% vs budget across 4 destinations
• Domestic market showing resilience (+12% YoY) — international soft
• MICE pipeline strong: 12 RFPs received but conversion rate only 35%
• Historical pattern: properties activating promotions >45 days early outperform by 11%

RECOMMENDED ACTIONS:
1. Tiered rate strategy: gradual reduction protects brand perception
2. Domestic campaign activation: target Bangkok weekend getaway segment
3. F&B packages: ฿1,500-3,000 credit included drives ฿400/night effective rate premium
4. MICE conversion: authorize 15% group discount + 1 comp per 20 rooms

TIMING: Acting now (45+ days before low season) gives 11% uplift vs reactive pricing.
Confidence: 90% (5yr seasonal pattern + forward booking curve + MICE pipeline)`,
  },
];

export function ActionMemo({ persona, context, onGenerate, onSend }: ActionMemoProps) {
  const variantIndex = useRef(0);
  const [memo, setMemo] = useState(MEMO_VARIANTS[0]);
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);

  const handleRegenerate = async () => {
    setLoading(true);
    setApproved(false);
    // Simulate AI generation delay
    await new Promise((r) => setTimeout(r, 800));
    variantIndex.current = (variantIndex.current + 1) % MEMO_VARIANTS.length;
    setMemo(MEMO_VARIANTS[variantIndex.current]);
    setLoading(false);
  };

  const urgencyColors = {
    HIGH: 'bg-red-100 text-red-700 border-red-200',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
    LOW: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Executive Action Memo</h3>
          <p className="text-xs text-slate-500">For {persona.name} ({persona.role})</p>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="rounded bg-snowflake-blue px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate New Memo'}
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={`rounded border px-2 py-0.5 text-xs font-medium ${urgencyColors[memo.urgency as keyof typeof urgencyColors] || urgencyColors.MEDIUM}`}>
            {memo.urgency} URGENCY
          </span>
          <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs text-blue-700">
            {memo.riskAmount} at risk
          </span>
        </div>

        <div className="rounded border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">Subject</p>
          <p className="text-sm font-semibold text-slate-800">{memo.subject}</p>
        </div>

        <div className="rounded border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">Recommended Actions</p>
          <ul className="mt-1 space-y-1.5">
            {memo.actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-blue-100 text-[9px] font-bold text-blue-700">{i + 1}</span>
                {action}
              </li>
            ))}
          </ul>
        </div>

        <details className="rounded border border-slate-200 bg-slate-50">
          <summary className="cursor-pointer p-3 text-xs font-medium text-slate-500 hover:text-slate-700">
            Full Memo Analysis (click to expand)
          </summary>
          <div className="border-t border-slate-200 p-3">
            <p className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-600">{memo.body}</p>
          </div>
        </details>

        <div className="flex gap-2">
          <button
            onClick={() => setApproved(true)}
            disabled={approved}
            className={`flex-1 rounded py-2 text-xs font-medium ${approved ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
          >
            {approved ? '✓ Approved — Rate push queued' : 'Approve & Push Rates'}
          </button>
          {!approved && (
            <button className="rounded border border-slate-300 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
              Defer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
