import { NextResponse } from 'next/server';
import { demoPlatform } from '@/lib/platform';
import { executeQuery } from '@/lib/snowflake';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [kpis, trend, signals, properties, freshness, risk, holdout, forecast, live, liveSummary, anomalies, alerts] = await Promise.all([
      executeQuery<{ TITLE: string; DISPLAY: string; STATUS: string }>(
        'SELECT TITLE, DISPLAY, STATUS FROM CURATED.KPI_SUMMARY ORDER BY SORT_ORDER'),
      executeQuery<{ PERIOD: string; BOOKINGS: number | null; SIGNALS: number | null; CONFIRMED: number | null }>(`
        SELECT TO_CHAR(METRIC_DATE, 'YYYY-MM-DD') AS PERIOD,
               BOOKING_COUNT AS BOOKINGS, PARITY_ALERT_COUNT AS SIGNALS, BREACH_COUNT AS CONFIRMED
        FROM CURATED.TREND_ANALYSIS ORDER BY METRIC_DATE`),
      executeQuery<{ SIGNAL: string; SIGNALS: number; CONFIRMED: number }>(`
        SELECT BREACH_DRIVER AS SIGNAL, PARITY_ALERT_COUNT AS SIGNALS, BREACH_COUNT AS CONFIRMED
        FROM CURATED.DRIVER_SUMMARY ORDER BY BREACH_COUNT DESC, PARITY_ALERT_COUNT DESC`),
      executeQuery<Record<string, string | number | null>>(`
        SELECT ENTITY_ID, ENTITY_NAME, REGION, CATEGORY, SERVICE_TIER, EVENT_COUNT, BOOKING_COUNT, BUDGET_BOOKINGS_90D,
               BOOKINGS_VS_BUDGET_PCT, BELOW_FLOOR_PCT, PARITY_ALERT_COUNT, BREACH_COUNT, CASE_COUNT, AUDIT_COMPLIANCE_PCT, OCCUPANCY_PCT, AVAILABLE_ROOMS,
               ROUND(ADR_THB) AS ADR_THB, ROUND(REVPAR_THB) AS REVPAR_THB
        FROM CURATED.PERFORMANCE_SUMMARY ORDER BY ENTITY_ID LIMIT 200`),
      executeQuery<{ RAW_WATERMARK: string | null; CURATED_WATERMARK: string | null }>(`
        SELECT (SELECT TO_CHAR(MAX(EVENT_DATE), 'YYYY-MM-DD') FROM RAW.PROPERTY_DAILY) AS RAW_WATERMARK,
               (SELECT TO_CHAR(MAX(METRIC_DATE), 'YYYY-MM-DD') FROM CURATED.TREND_ANALYSIS) AS CURATED_WATERMARK`),
      executeQuery<Record<string, string | number | null>>(`
        SELECT ENTITY_ID, TO_CHAR(SCORED_AS_OF, 'YYYY-MM-DD') AS SCORED_AS_OF, BREACH_PROB_7D, RISK_BAND
        FROM ML.BREACH_RISK_SCORES ORDER BY BREACH_PROB_7D DESC`),
      executeQuery<Record<string, string | number | null>>(
        'SELECT N, BASE_RATE, PRECISION_AT_50, RECALL_AT_50 FROM ML.BREACH_RISK_HOLDOUT_METRICS'),
      executeQuery<Record<string, string | number | null>>(`
        SELECT TO_CHAR(FORECAST_DATE, 'YYYY-MM-DD') AS PERIOD, BOOKING_COUNT, LOWER_BOUND, UPPER_BOUND
        FROM ML.BOOKINGS_FORECAST ORDER BY FORECAST_DATE`),
      executeQuery<Record<string, string | number | null>>(`
        SELECT PROPERTY_ID, TO_CHAR(EVENT_TS, 'YYYY-MM-DD HH24:MI:SS') AS EVENT_TS, ROUND(OTA_GAP_PCT, 1) AS OTA_GAP_PCT,
               SYNC_LAG_HOURS, STATUS, TO_CHAR(LOADED_AT, 'YYYY-MM-DD HH24:MI:SS TZH:TZM') AS LOADED_AT
        FROM RAW.LIVE_RATE_SHOPS ORDER BY EVENT_TS DESC LIMIT 25`),
      executeQuery<Record<string, string | number | null>>(`
        SELECT COUNT(*) AS N, COUNT_IF(STATUS = 'ALERT') AS ALERTS,
               TO_CHAR(MAX(LOADED_AT), 'YYYY-MM-DD HH24:MI:SS TZH:TZM') AS LAST_LOADED,
               ROUND(MEDIAN(DATEDIFF('second', SENT_TS, CONVERT_TIMEZONE('UTC', LOADED_AT)::TIMESTAMP_NTZ)), 0) AS MEDIAN_LAG_S
        FROM RAW.LIVE_RATE_SHOPS`),
      executeQuery<Record<string, string | number | null>>(`
        SELECT ENTITY_ID, TO_CHAR(EVENT_DATE, 'YYYY-MM-DD') AS EVENT_DATE, ROUND(SYNC_LAG_HOURS, 2) AS SYNC_LAG_HOURS,
               ROUND(EXPECTED, 2) AS EXPECTED, ROUND(UPPER_BOUND, 2) AS UPPER_BOUND
        FROM ML.SYNC_LAG_ANOMALIES WHERE IS_ANOMALY ORDER BY EVENT_DATE DESC, ENTITY_ID LIMIT 50`),
      executeQuery<Record<string, string | number | null>>(`
        SELECT PROPERTY_ID, TO_CHAR(EVENT_TS, 'YYYY-MM-DD HH24:MI:SS') AS EVENT_TS, ROUND(OTA_GAP_PCT, 1) AS OTA_GAP_PCT,
               SYNC_LAG_HOURS, SOP_HINT
        FROM APP.ALERT_LOG ORDER BY ALERTED_AT DESC, EVENT_TS DESC LIMIT 25`),
    ]);
    const numberOrNull = (value: unknown): number | null => {
      if (value === null || value === undefined) return null;
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) throw new Error('Non-numeric measure in curated contract');
      return numeric;
    };
    const watermark = freshness[0]?.CURATED_WATERMARK ?? null;
    const ageDays = watermark ? (Date.now() - Date.parse(`${watermark}T00:00:00Z`)) / 86400000 : null;
    return NextResponse.json({
      platform: demoPlatform(),
      kpiCards: kpis.map((row) => ({ title: row.TITLE, value: row.DISPLAY, status: row.STATUS })),
      timeseries: trend.map((row) => ({
        period: row.PERIOD, bookings: numberOrNull(row.BOOKINGS), signals: numberOrNull(row.SIGNALS), confirmed: numberOrNull(row.CONFIRMED),
      })),
      categories: signals.map((row) => ({ category: row.SIGNAL, signals: numberOrNull(row.SIGNALS), confirmed: numberOrNull(row.CONFIRMED) })),
      entities: properties.map((row) => ({
        id: row.ENTITY_ID, name: row.ENTITY_NAME, region: row.REGION, category: row.CATEGORY, tier: row.SERVICE_TIER,
        bookings: numberOrNull(row.BOOKING_COUNT), rooms: numberOrNull(row.AVAILABLE_ROOMS), occupancy: numberOrNull(row.OCCUPANCY_PCT), adr: numberOrNull(row.ADR_THB), revpar: numberOrNull(row.REVPAR_THB), budget: numberOrNull(row.BUDGET_BOOKINGS_90D),
        vsBudget: numberOrNull(row.BOOKINGS_VS_BUDGET_PCT), belowFloor: numberOrNull(row.BELOW_FLOOR_PCT),
        signals: numberOrNull(row.PARITY_ALERT_COUNT), confirmed: numberOrNull(row.BREACH_COUNT), cases: numberOrNull(row.CASE_COUNT),
        auditCompliance: numberOrNull(row.AUDIT_COMPLIANCE_PCT), events: numberOrNull(row.EVENT_COUNT),
      })),
      auditRisk: properties.map((row) => ({
        name: row.ENTITY_NAME, compliance: numberOrNull(row.AUDIT_COMPLIANCE_PCT), confirmed: numberOrNull(row.BREACH_COUNT),
      })).filter((row) => row.compliance !== null && row.confirmed !== null),
      sourceWatermark: watermark,
      rawWatermark: freshness[0]?.RAW_WATERMARK ?? null,
      stale: ageDays === null || ageDays > 2,
      pipelineBehind: freshness[0]?.RAW_WATERMARK !== watermark,
      requestedAt: new Date().toISOString(),
      synthetic: true,
      risk: risk.map((row) => ({
        id: row.ENTITY_ID, scoredAsOf: row.SCORED_AS_OF,
        probability: numberOrNull(row.BREACH_PROB_7D), band: row.RISK_BAND,
      })),
      holdout: holdout[0] ? {
        n: numberOrNull(holdout[0].N), baseRate: numberOrNull(holdout[0].BASE_RATE),
        precision: numberOrNull(holdout[0].PRECISION_AT_50), recall: numberOrNull(holdout[0].RECALL_AT_50),
      } : null,
      forecast: forecast.map((row) => ({
        period: row.PERIOD, value: numberOrNull(row.BOOKING_COUNT),
        lower: numberOrNull(row.LOWER_BOUND), upper: numberOrNull(row.UPPER_BOUND),
      })),
      modelStatus: holdout[0] ? 'holdout_evaluated' : 'missing',
      live: live.map((row) => ({
        id: row.PROPERTY_ID, eventTs: row.EVENT_TS, otaGapPct: numberOrNull(row.OTA_GAP_PCT),
        syncLagHours: numberOrNull(row.SYNC_LAG_HOURS), status: row.STATUS, loadedAt: row.LOADED_AT,
      })),
      liveSummary: {
        n: numberOrNull(liveSummary[0]?.N), alerts: numberOrNull(liveSummary[0]?.ALERTS),
        lastLoaded: liveSummary[0]?.LAST_LOADED ?? null, medianLagSeconds: numberOrNull(liveSummary[0]?.MEDIAN_LAG_S),
      },
      anomalies: anomalies.map((row) => ({
        id: row.ENTITY_ID, date: row.EVENT_DATE, syncLagHours: numberOrNull(row.SYNC_LAG_HOURS),
        expected: numberOrNull(row.EXPECTED), upper: numberOrNull(row.UPPER_BOUND),
      })),
      alerts: alerts.map((row) => ({
        id: row.PROPERTY_ID, eventTs: row.EVENT_TS, otaGapPct: numberOrNull(row.OTA_GAP_PCT),
        syncLagHours: numberOrNull(row.SYNC_LAG_HOURS), hint: row.SOP_HINT,
      })),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Revenue management data is unavailable. Verify the core deployment and application role.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
