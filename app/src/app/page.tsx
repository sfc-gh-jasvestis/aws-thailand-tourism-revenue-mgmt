'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { KPICard } from '@/components/KPICard';
import { Chart } from '@/components/Chart';
import { DataTable } from '@/components/DataTable';
import { AskAI } from '@/components/AskAI';
import { ActionMemo } from '@/components/ActionMemo';
import { CalendarHeatmap } from '@/components/CalendarHeatmap';
import { RateShoppingGrid } from '@/components/RateShoppingGrid';
import { ForecastChart } from '@/components/ForecastChart';
import { AnomalyAlerts } from '@/components/AnomalyAlerts';
import { ArchitectureDiagram } from '@/components/ArchitectureDiagram';
import { DemandSignals } from '@/components/DemandSignals';
import { PickupReport } from '@/components/PickupReport';
import { WhatIfSimulator } from '@/components/WhatIfSimulator';
import { CompSetPosition } from '@/components/CompSetPosition';
import { EventCalendar } from '@/components/EventCalendar';
import { DecisionLog } from '@/components/DecisionLog';

interface DemoNarrative {
  title: string;
  duration: string;
  thesis: string;
  tabs: any[];
}

export default function HomePage() {
  const [narrative, setNarrative] = useState<DemoNarrative | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/demo_narrative.json')
      .then((r) => r.json())
      .then(setNarrative)
      .catch(() => {});
    fetch('/api/data')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const kpis = data?.kpis || {};

  // Static anomalies (in production these would come from ML.ANOMALY_DETECTION)
  const anomalies = [
    {
      SEVERITY: 'high' as const,
      TITLE: 'Demand Surge — Phuket (India Market)',
      DESCRIPTION: 'Direct flight capacity from Mumbai/Delhi to Phuket increased +30%. Google Flights search volume surged +24% WoW. Booking intent crossed 85th percentile.',
      METRIC: 'DEMAND_INDEX',
      VALUE: '892 (+24% WoW)',
      ACTION: 'Recommend +8-12% BAR increase for Phuket Luxury properties effective immediately',
    },
    {
      SEVERITY: 'medium' as const,
      TITLE: 'Rate Parity Violation — Koh Samui',
      DESCRIPTION: '12 properties showing >10% rate disparity vs OTA channels. Direct channel significantly underpriced vs Booking.com and Agoda.',
      METRIC: 'RATE_DISPARITY',
      VALUE: '12 properties, avg -14% vs OTA',
      ACTION: 'Review channel manager sync for Koh Samui cluster — potential mapping error',
    },
    {
      SEVERITY: 'medium' as const,
      TITLE: 'RevPAR Underperformance — 8 Properties Below Index 85',
      DESCRIPTION: '8 properties across Chiang Mai and Koh Samui consistently underperforming comp set by 15%+. Combination of low occupancy and conservative pricing.',
      METRIC: 'REVPAR_INDEX',
      VALUE: '8 properties, avg index 79.4',
      ACTION: 'Initiate rate strategy review with cluster GMs — consider repositioning or promotional packages',
    },
    {
      SEVERITY: 'low' as const,
      TITLE: 'Booking Pace Slowdown — Chiang Mai',
      DESCRIPTION: 'Pace index dropped below 90 STLY for 5 consecutive days. Low season pattern but starting 2 weeks earlier than historical norm.',
      METRIC: 'PACE_INDEX',
      VALUE: '88.1 (target: 95+)',
      ACTION: 'Consider promotional rate for Chiang Mai midweek stays (Tue-Thu)',
    },
  ];

  // Tab 1: Revenue Cockpit
  const revenueCockpit = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Portfolio RevPAR"
          value={`฿${kpis.AVG_REVPAR?.toLocaleString() || '—'}`}
          subtitle="Revenue per available room (30-day avg)"
          status={kpis.AVG_REVPAR > 3000 ? 'success' : 'warning'}
          trend={{ direction: 'up', value: '+4.2% vs prior month' }}
        />
        <KPICard
          title="Average Daily Rate"
          value={`฿${kpis.AVG_ADR?.toLocaleString() || '—'}`}
          subtitle="Across 120 properties"
          status="neutral"
        />
        <KPICard
          title="Occupancy"
          value={`${kpis.AVG_OCC || '—'}%`}
          subtitle="Portfolio average"
          status={kpis.AVG_OCC > 70 ? 'success' : kpis.AVG_OCC > 55 ? 'warning' : 'danger'}
        />
        <KPICard
          title="Comp Set Index"
          value={kpis.AVG_INDEX || '—'}
          subtitle="100 = at parity with competitive set"
          status={kpis.AVG_INDEX >= 100 ? 'success' : kpis.AVG_INDEX > 90 ? 'warning' : 'danger'}
          trend={{ direction: kpis.AVG_INDEX >= 100 ? 'up' : 'down', value: `${kpis.AVG_INDEX >= 100 ? 'Above' : 'Below'} market` }}
        />
      </div>
      <AnomalyAlerts anomalies={anomalies} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Chart
          data={data?.revparTrend || []}
          type="line"
          xKey="DATE"
          yKeys={[{ key: 'REVPAR', name: 'RevPAR (฿)' }]}
          title="RevPAR Trend — Last 30 Days"
        />
        <Chart
          data={data?.destinations || []}
          type="dual-axis"
          xKey="DESTINATION"
          yKeys={[
            { key: 'AVG_REVPAR', name: 'RevPAR (฿)', color: '#29B5E8', yAxisId: 'left' },
            { key: 'AVG_OCC', name: 'Occupancy %', color: '#10B981', yAxisId: 'right', type: 'line' },
          ]}
          title="Destination Performance"
          leftAxisLabel="RevPAR (฿)"
          rightAxisLabel="Occupancy %"
        />
      </div>
      <CalendarHeatmap data={data?.occupancyCalendar || []} />
      <CompSetPosition />
      <DataTable
        columns={[
          { key: 'PROPERTY_NAME', header: 'Property' },
          { key: 'DESTINATION', header: 'Destination' },
          { key: 'CATEGORY', header: 'Category' },
          { key: 'REVPAR', header: 'RevPAR (฿)' },
          { key: 'REVPAR_INDEX', header: 'Comp Index' },
          { key: 'OCCUPANCY', header: 'Occ %' },
        ]}
        data={data?.propertiesAtRisk || []}
        title="Properties Requiring Attention (RevPAR Index < 90)"
      />
    </div>
  );

  // Tab 2: Demand & Pace
  const demandPace = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(data?.pace || []).map((p: any) => (
          <KPICard
            key={p.DESTINATION}
            title={`${p.DESTINATION} Pace`}
            value={`${p.AVG_PACE_INDEX}%`}
            subtitle="vs Same-Time-Last-Year"
            status={p.AVG_PACE_INDEX >= 110 ? 'success' : p.AVG_PACE_INDEX >= 95 ? 'neutral' : 'danger'}
            trend={{ direction: p.AVG_PACE_INDEX >= 100 ? 'up' : 'down', value: `${p.AVG_PACE_INDEX >= 100 ? '+' : ''}${(p.AVG_PACE_INDEX - 100).toFixed(1)}% vs STLY` }}
          />
        ))}
      </div>
      <ForecastChart
        data={data?.paceTrend || []}
        title="Booking Pace — Actual vs ML.FORECAST vs STLY"
        yLabel="Pace Index"
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Chart
          data={data?.demandByMarket || []}
          type="bar"
          xKey="SOURCE_MARKET"
          yKeys={[
            { key: 'AVG_DEMAND', name: 'Demand Index', color: '#29B5E8' },
            { key: 'AVG_INTENT', name: 'Booking Intent', color: '#FF6B35' },
          ]}
          title="Demand by Source Market — Last 14 Days"
          height={300}
        />
        <DemandSignals data={data?.demandSignals || []} />
      </div>
      <EventCalendar />
      <PickupReport />
    </div>
  );

  // Tab 3: Pricing & Rates
  const pricingRates = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(data?.ratePosition || []).map((r: any) => (
          <KPICard
            key={r.RATE_POSITION}
            title={r.RATE_POSITION.replace('_', ' ')}
            value={`${r.PROPERTY_COUNT} properties`}
            status={r.RATE_POSITION === 'UNDERPRICED' ? 'danger' : r.RATE_POSITION === 'OVERPRICED' ? 'warning' : 'success'}
          />
        ))}
      </div>
      <WhatIfSimulator />
      <RateShoppingGrid data={data?.rateShopping || []} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Chart
          data={data?.ratePosition || []}
          type="pie"
          xKey="RATE_POSITION"
          yKeys={[{ key: 'PROPERTY_COUNT', name: 'Properties' }]}
          title="Rate Position Distribution (Next 14 Days)"
          height={280}
        />
        <ActionMemo
          persona={{ name: 'Siriporn Chaiyaporn', role: 'VP Revenue & Distribution' }}
          context={{ properties: 120, underpriced: data?.ratePosition?.find((r: any) => r.RATE_POSITION === 'UNDERPRICED')?.PROPERTY_COUNT || 0 }}
          onGenerate={async () => ({
            subject: 'Revenue Optimization — Rate Adjustment Recommendations',
            body: `${data?.ratePosition?.find((r: any) => r.RATE_POSITION === 'UNDERPRICED')?.PROPERTY_COUNT || 34} properties are currently priced below OTA market by 10%+. Recommend immediate BAR increase for Phuket Luxury segment (demand surge detected). EventBridge trigger will auto-push approved rates to channel managers within 2-hour cycle.`,
            urgency: 'HIGH',
            actions: [
              'Review 34 underpriced properties in Phuket & Koh Samui',
              'Approve +8-12% rate increase for Luxury segment',
              'Monitor booking pace post-adjustment (24h)',
            ],
          })}
        />
      </div>
    </div>
  );

  // Tab 4: Ask AI (Cortex Agent)
  const askAiTab = (
    <div className="space-y-6">
      <div className="h-[500px]">
      <AskAI
        title="Revenue Intelligence Agent"
        placeholder="Ask about RevPAR, demand forecasts, pricing, or strategy..."
        sampleQuestions={[
          "What's our portfolio RevPAR vs competitive set this month?",
          "Which properties should increase rates this week?",
          "Show me the demand forecast for Phuket next 30 days",
          "What's the booking pace for Koh Samui vs last year?",
          "How should we respond to the Chinese demand surge?",
          "What rate parity violations exist across OTA channels?",
          "Recommend a pricing strategy for low-occupancy properties",
          "Which properties have anomalous booking patterns?",
        ]}
        onSubmit={async (question) => {
          try {
            const res = await fetch('/api/ask', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ question }),
            });
            const result = await res.json();
            return { answer: result.answer, sql: result.sql, source: result.source };
          } catch {
            return {
              answer: `[Demo Mode] Response to: "${question}". Connect to Snowflake for live Cortex Agent responses.`,
            };
          }
        }}
      />
      </div>
      <DecisionLog />
    </div>
  );

  // Tab 5: Architecture
  const architectureTab = (
    <div className="space-y-6">
      <ArchitectureDiagram />
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Technical Components</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded border border-blue-200 bg-blue-50 p-4">
            <h3 className="text-sm font-bold text-blue-800">Snowflake</h3>
            <ul className="mt-2 space-y-1 text-sm text-blue-700">
              <li>Dynamic Tables (PROPERTY_REVPAR, DEMAND_TIMESERIES, RATE_RECOMMENDATIONS, BOOKING_PACE)</li>
              <li>ML.FORECAST (demand by source market, 14-day horizon)</li>
              <li>ML.ANOMALY_DETECTION (booking pace anomalies)</li>
              <li>Cortex Search (600 strategy documents)</li>
              <li>Cortex Agent (REVENUE_INTELLIGENCE_AGENT)</li>
              <li>Semantic View (REVENUE_MANAGEMENT_ANALYTICS)</li>
              <li>Alerts + Notification Integration</li>
              <li>Task DAG (ingest → recommend → push rates)</li>
            </ul>
          </div>
          <div className="rounded border border-orange-200 bg-orange-50 p-4">
            <h3 className="text-sm font-bold text-orange-800">AWS Services</h3>
            <ul className="mt-2 space-y-1 text-sm text-orange-700">
              <li>Amazon Kinesis — Real-time OTA rate feed ingestion (500K feeds)</li>
              <li>Amazon SageMaker — Demand forecasting model by source market</li>
              <li>Amazon EventBridge — Trigger automated rate adjustments</li>
              <li>Amazon Bedrock — Strategy playbook generation (content indexed by Cortex Search)</li>
              <li>Amazon SNS — Alert revenue managers on pricing opportunities</li>
              <li>Amazon QuickSight + Q — RevPAR performance dashboard with NL queries</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">Key Demo Numbers</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="text-center"><p className="text-2xl font-bold text-blue-600">฿180M</p><p className="text-xs text-slate-500">Revenue opportunity from sub-optimal pricing</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-red-600">7%</p><p className="text-xs text-slate-500">Below comp set RevPAR average</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-green-600">+23%</p><p className="text-xs text-slate-500">Demand surge predicted (Phuket, 30 days)</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-blue-600">500K</p><p className="text-xs text-slate-500">OTA rate feeds ingested via Kinesis</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-blue-600">120</p><p className="text-xs text-slate-500">Properties receiving rate recommendations</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-green-600">2hr</p><p className="text-xs text-slate-500">Demand signal to rate push cycle</p></div>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">Build Modes</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded border border-emerald-200 bg-emerald-50 p-3">
            <h4 className="text-sm font-bold text-emerald-800">Snowflake Only</h4>
            <p className="mt-1 text-xs text-emerald-700">Snowpipe Streaming, ML.FORECAST, Cortex Complete, Alerts, Snowflake Intelligence. No AWS dependencies.</p>
          </div>
          <div className="rounded border border-violet-200 bg-violet-50 p-3">
            <h4 className="text-sm font-bold text-violet-800">Full AWS + Snowflake</h4>
            <p className="mt-1 text-xs text-violet-700">Kinesis, SageMaker, EventBridge, Bedrock, SNS, QuickSight integrated.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'revenue-cockpit', label: 'Revenue Cockpit', content: revenueCockpit },
    { id: 'demand-pace', label: 'Demand & Pace', content: demandPace },
    { id: 'pricing-rates', label: 'Pricing & Rates', content: pricingRates },
    { id: 'ask-ai', label: 'Ask AI', content: askAiTab },
    { id: 'architecture', label: 'Architecture', content: architectureTab },
  ];

  return (
    <AppLayout
      title="Revenue Management & Dynamic Pricing"
      subtitle="120 Thai Resort Properties — Phuket, Koh Samui, Bangkok, Chiang Mai"
      tabs={tabs}
      narrative={narrative}
    />
  );
}
