import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';
import { demoPlatform } from '@/lib/platform';

export const dynamic = 'force-dynamic';

// Only these fixed, read-only queries can run. The model never writes SQL; it
// only summarises rows returned here, so every answer is traceable to data.
const INTENTS: Record<string, { match: RegExp; sql: string }> = {
  properties: {
    match: /breach|parity|propert|hotel|worst|highest|occupancy|booking|budget|adr|revpar|revenue|case/i,
    sql: `SELECT ENTITY_ID, ENTITY_NAME, REGION, CATEGORY, BOOKING_COUNT, BUDGET_BOOKINGS_90D, ROUND(BOOKINGS_VS_BUDGET_PCT, 1) AS BOOKINGS_VS_BUDGET_PCT,
       PARITY_ALERT_COUNT, BREACH_COUNT, CASE_COUNT, ROUND(AUDIT_COMPLIANCE_PCT, 1) AS AUDIT_COMPLIANCE_PCT, ROUND(OCCUPANCY_PCT, 1) AS OCCUPANCY_PCT,
       ROUND(ADR_THB) AS ADR_THB, ROUND(REVPAR_THB) AS REVPAR_THB
FROM CURATED.PERFORMANCE_SUMMARY
QUALIFY DENSE_RANK() OVER (ORDER BY BREACH_COUNT DESC) <= 3
ORDER BY BREACH_COUNT DESC, PARITY_ALERT_COUNT DESC`,
  },
  drivers: {
    match: /driver|alert|cause|type|why|channel|leak/i,
    sql: `SELECT BREACH_DRIVER, PARITY_ALERT_COUNT, BREACH_COUNT, CASE_COUNT, PROPERTIES_AFFECTED, ROUND(ALERT_CONFIRM_PCT, 1) AS ALERT_CONFIRM_PCT
FROM CURATED.DRIVER_SUMMARY ORDER BY BREACH_COUNT DESC LIMIT 7`,
  },
  kpis: {
    match: /.*/,
    sql: `SELECT TITLE, DISPLAY, SOURCE_WATERMARK FROM CURATED.KPI_SUMMARY ORDER BY SORT_ORDER`,
  },
};

const DEFINITIONS =
  'Bookings vs budget = new bookings / budgeted bookings for the 90-day window. ' +
  'Room occupancy = occupied room nights / available room nights. ADR = room revenue / occupied room nights (THB). ' +
  'RevPAR = room revenue / available room nights (THB). ' +
  'Alert confirmation rate = rate parity alerts confirmed as parity breaches / alerts raised. ' +
  'A channel case is opened after a confirmed rate parity breach. ' +
  'Channel manager outage alerts are city-wide and are never confirmed. ' +
  'All data is synthetic, property-level demo data for a fictional hotel group with no guest records. Do not give pricing, investment or legal advice.';

// provider 'cortex' = Snowflake AI_COMPLETE; 'bedrock' = Amazon Bedrock Claude
// via the external-access UDF APP.BEDROCK_GENERATE (aws/setup_aws.py).
async function summarise(question: string, rows: unknown[], provider: 'cortex' | 'bedrock' = 'cortex'): Promise<string> {
  const prompt =
    'You are a hotel revenue management analyst. Answer ONLY from the JSON rows and definitions below. ' +
    'If the rows do not answer the question, say so. Do not invent numbers. Keep it under 120 words.\n' +
    `Definitions: ${DEFINITIONS}\nRows: ${JSON.stringify(rows)}\nQuestion: ${question}`;
  const out = await executeQuery<{ R: string }>(
    provider === 'bedrock' ? 'SELECT APP.BEDROCK_GENERATE(?) AS R' : `SELECT AI_COMPLETE('claude-sonnet-4-5', ?) AS R`,
    [prompt],
  );
  const raw = String(out[0]?.R ?? '').trim();
  // AI_COMPLETE returns a JSON string literal; decode it when present.
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'string' ? parsed : raw;
  } catch {
    return raw;
  }
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const question = typeof body?.question === 'string' ? body.question.trim().slice(0, 2000) : '';
  const memo = body?.mode === 'memo';
  if (!memo && !question) return NextResponse.json({ error: 'Question required' }, { status: 400 });

  try {
    if (memo) {
      const provider = demoPlatform() === 'aws' ? 'bedrock' : 'cortex';
      const [kpis, properties, drivers, risk, bands] = await Promise.all([
        executeQuery(INTENTS.kpis.sql),
        executeQuery(INTENTS.properties.sql),
        executeQuery(INTENTS.drivers.sql),
        executeQuery(`SELECT ENTITY_ID, ROUND(BREACH_PROB_7D, 2) AS BREACH_PROB_7D, RISK_BAND
FROM ML.BREACH_RISK_SCORES ORDER BY BREACH_PROB_7D DESC LIMIT 5`),
        executeQuery(`SELECT RISK_BAND, COUNT(*) AS PROPERTIES FROM ML.BREACH_RISK_SCORES GROUP BY RISK_BAND`),
      ]);
      const rows = { kpis, topBreachProperties: properties, breachDrivers: drivers, top5ByRisk: risk, propertiesPerRiskBand: bands };
      const answer = await summarise(
        'Draft a short operational action memo for the Group Director of Revenue Management with 3 prioritised rate parity and pricing actions, citing the figures.',
        [rows],
        provider,
      );
      return NextResponse.json({ answer, sources: rows, provider: provider === 'bedrock' ? 'Amazon Bedrock (Claude Sonnet 4.5)' : 'Snowflake Cortex AI_COMPLETE (claude-sonnet-4-5)', draft: true, synthetic: true });
    }
    const key = Object.keys(INTENTS).find((k) => INTENTS[k].match.test(question))!;
    const rows = await executeQuery(INTENTS[key].sql);
    const answer = await summarise(question, rows);
    return NextResponse.json({ answer, sql: INTENTS[key].sql, sources: rows, synthetic: true });
  } catch (err) {
    console.error('ask route failed', err);
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
  }
}
