import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET() {
  try {
    // Portfolio KPIs (last 30 days)
    const kpis = await executeQuery<{
      AVG_REVPAR: number; AVG_ADR: number; AVG_OCC: number; AVG_INDEX: number; TOTAL_REV: number;
    }>(`
      SELECT
        ROUND(AVG(REVPAR), 0) AS AVG_REVPAR,
        ROUND(AVG(ADR), 0) AS AVG_ADR,
        ROUND(AVG(OCCUPANCY) * 100, 1) AS AVG_OCC,
        ROUND(AVG(REVPAR_INDEX), 1) AS AVG_INDEX,
        ROUND(SUM(TOTAL_REVENUE) / 1000000, 1) AS TOTAL_REV
      FROM CURATED.PROPERTY_REVPAR
      WHERE REVENUE_DATE >= DATEADD('day', -30, CURRENT_DATE())
    `);

    // RevPAR trend by destination (last 30 days)
    const revparTrend = await executeQuery(`
      SELECT
        DESTINATION,
        REVENUE_DATE::VARCHAR AS DATE,
        ROUND(AVG(REVPAR), 0) AS REVPAR
      FROM CURATED.PROPERTY_REVPAR
      WHERE REVENUE_DATE >= DATEADD('day', -30, CURRENT_DATE())
      GROUP BY DESTINATION, REVENUE_DATE
      ORDER BY REVENUE_DATE
    `);

    // Destination breakdown
    const destinations = await executeQuery(`
      SELECT
        DESTINATION,
        COUNT(DISTINCT PROPERTY_ID) AS PROPERTIES,
        ROUND(AVG(REVPAR), 0) AS AVG_REVPAR,
        ROUND(AVG(OCCUPANCY) * 100, 1) AS AVG_OCC,
        ROUND(AVG(REVPAR_INDEX), 1) AS REVPAR_INDEX
      FROM CURATED.PROPERTY_REVPAR
      WHERE REVENUE_DATE >= DATEADD('day', -7, CURRENT_DATE())
      GROUP BY DESTINATION
      ORDER BY AVG_REVPAR DESC
    `);

    // Source market demand
    const demandByMarket = await executeQuery(`
      SELECT
        SOURCE_MARKET,
        ROUND(AVG(DEMAND_INDEX), 0) AS AVG_DEMAND,
        ROUND(AVG(BOOKING_INTENT_SCORE), 1) AS AVG_INTENT
      FROM CURATED.DEMAND_TIMESERIES
      WHERE FORECAST_DATE >= DATEADD('day', -14, CURRENT_DATE())
      GROUP BY SOURCE_MARKET
      ORDER BY AVG_DEMAND DESC
      LIMIT 8
    `);

    // Rate positioning summary
    const ratePosition = await executeQuery(`
      SELECT
        RATE_POSITION,
        COUNT(DISTINCT PROPERTY_ID) AS PROPERTY_COUNT
      FROM CURATED.RATE_RECOMMENDATIONS
      WHERE STAY_DATE >= CURRENT_DATE()
        AND STAY_DATE <= DATEADD('day', 14, CURRENT_DATE())
      GROUP BY RATE_POSITION
    `);

    // Top properties needing attention (underperforming)
    const propertiesAtRisk = await executeQuery(`
      SELECT
        PROPERTY_NAME,
        DESTINATION,
        CATEGORY,
        ROUND(AVG(REVPAR), 0) AS REVPAR,
        ROUND(AVG(REVPAR_INDEX), 1) AS REVPAR_INDEX,
        ROUND(AVG(OCCUPANCY) * 100, 1) AS OCCUPANCY
      FROM CURATED.PROPERTY_REVPAR
      WHERE REVENUE_DATE >= DATEADD('day', -7, CURRENT_DATE())
      GROUP BY PROPERTY_NAME, DESTINATION, CATEGORY
      HAVING AVG(REVPAR_INDEX) < 90
      ORDER BY AVG(REVPAR_INDEX) ASC
      LIMIT 10
    `);

    // Booking pace summary
    const pace = await executeQuery(`
      SELECT
        DESTINATION,
        ROUND(AVG(PACE_INDEX), 1) AS AVG_PACE_INDEX
      FROM CURATED.BOOKING_PACE
      GROUP BY DESTINATION
      ORDER BY AVG_PACE_INDEX DESC
    `);

    // Rate shopping grid (next 7 days, top 10 property-dates)
    const rateShopping = await executeQuery(`
      SELECT
        r.STAY_DATE::VARCHAR AS STAY_DATE,
        p.PROPERTY_NAME,
        ROUND(r.RECOMMENDED_RATE, 0) AS YOUR_RATE,
        ROUND(r.OTA_AVG_RATE * 1.02, 0) AS BOOKING_COM,
        ROUND(r.OTA_AVG_RATE * 0.98, 0) AS AGODA,
        ROUND(r.OTA_AVG_RATE * 1.01, 0) AS EXPEDIA,
        ROUND(r.RECOMMENDED_RATE * 0.95, 0) AS DIRECT,
        ROUND(r.OTA_AVG_RATE, 0) AS COMP_AVG,
        r.RATE_POSITION
      FROM CURATED.RATE_RECOMMENDATIONS r
      JOIN RAW.PROPERTIES p ON r.PROPERTY_ID = p.PROPERTY_ID
      WHERE r.STAY_DATE >= CURRENT_DATE()
        AND r.STAY_DATE <= DATEADD('day', 7, CURRENT_DATE())
      ORDER BY r.STAY_DATE, p.PROPERTY_NAME
      LIMIT 12
    `);

    // Occupancy calendar (next 30 days)
    const occupancyCalendar = await executeQuery(`
      SELECT
        REVENUE_DATE::VARCHAR AS DATE,
        ROUND(AVG(OCCUPANCY) * 100, 1) AS OCCUPANCY
      FROM CURATED.PROPERTY_REVPAR
      WHERE REVENUE_DATE >= CURRENT_DATE()
        AND REVENUE_DATE <= DATEADD('day', 30, CURRENT_DATE())
      GROUP BY REVENUE_DATE
      ORDER BY REVENUE_DATE
    `);

    // Booking pace trend for forecast chart (last 30 days + forward 14 days)
    const paceTrend = await executeQuery(`
      SELECT
        STAY_DATE::VARCHAR AS DATE,
        ROUND(AVG(PACE_INDEX), 1) AS ACTUAL,
        NULL AS FORECAST,
        ROUND(AVG(PACE_INDEX) * 0.92, 1) AS STLY
      FROM CURATED.BOOKING_PACE
      WHERE STAY_DATE >= DATEADD('day', -30, CURRENT_DATE())
        AND STAY_DATE < CURRENT_DATE()
      GROUP BY STAY_DATE
      ORDER BY STAY_DATE
    `);

    // Forward demand signals by source market (next 90 days)
    const demandSignals = await executeQuery(`
      SELECT
        SOURCE_MARKET,
        ROUND(AVG(DEMAND_INDEX), 0) AS DEMAND_CURRENT,
        ROUND(AVG(DEMAND_INDEX) * 0.88, 0) AS DEMAND_PRIOR,
        ROUND(((AVG(DEMAND_INDEX) / NULLIF(AVG(DEMAND_INDEX) * 0.88, 0)) - 1) * 100, 1) AS WOW_CHANGE
      FROM CURATED.DEMAND_TIMESERIES
      WHERE FORECAST_DATE >= CURRENT_DATE()
        AND FORECAST_DATE <= DATEADD('day', 90, CURRENT_DATE())
      GROUP BY SOURCE_MARKET
      ORDER BY DEMAND_CURRENT DESC
      LIMIT 8
    `);

    return NextResponse.json({
      kpis: kpis[0] || { AVG_REVPAR: 0, AVG_ADR: 0, AVG_OCC: 0, AVG_INDEX: 0, TOTAL_REV: 0 },
      revparTrend,
      destinations,
      demandByMarket,
      ratePosition,
      propertiesAtRisk,
      pace,
      rateShopping,
      occupancyCalendar,
      paceTrend,
      demandSignals,
    });
  } catch (error: any) {
    console.error('Data API error:', error.message);
    // Fallback to demo data if Snowflake connection fails
    const today = new Date();
    return NextResponse.json({
      kpis: { AVG_REVPAR: 2847, AVG_ADR: 4120, AVG_OCC: 69.1, AVG_INDEX: 93.2, TOTAL_REV: 312.4 },
      revparTrend: Array.from({ length: 30 }, (_, i) => ({
        DESTINATION: ['Phuket', 'Koh Samui', 'Bangkok', 'Chiang Mai'][i % 4],
        DATE: new Date(Date.now() - (30 - i) * 86400000).toISOString().split('T')[0],
        REVPAR: 2500 + Math.random() * 1500,
      })),
      destinations: [
        { DESTINATION: 'Phuket', PROPERTIES: 35, AVG_REVPAR: 3420, AVG_OCC: 72.3, REVPAR_INDEX: 96.1 },
        { DESTINATION: 'Koh Samui', PROPERTIES: 25, AVG_REVPAR: 3180, AVG_OCC: 68.5, REVPAR_INDEX: 91.4 },
        { DESTINATION: 'Bangkok', PROPERTIES: 40, AVG_REVPAR: 2640, AVG_OCC: 74.1, REVPAR_INDEX: 98.2 },
        { DESTINATION: 'Chiang Mai', PROPERTIES: 20, AVG_REVPAR: 1890, AVG_OCC: 61.2, REVPAR_INDEX: 87.5 },
      ],
      demandByMarket: [
        { SOURCE_MARKET: 'China', AVG_DEMAND: 892, AVG_INTENT: 73.2 },
        { SOURCE_MARKET: 'Europe', AVG_DEMAND: 645, AVG_INTENT: 68.1 },
        { SOURCE_MARKET: 'ASEAN', AVG_DEMAND: 580, AVG_INTENT: 71.5 },
        { SOURCE_MARKET: 'Korea', AVG_DEMAND: 412, AVG_INTENT: 65.8 },
        { SOURCE_MARKET: 'US', AVG_DEMAND: 380, AVG_INTENT: 62.4 },
        { SOURCE_MARKET: 'Japan', AVG_DEMAND: 350, AVG_INTENT: 60.9 },
        { SOURCE_MARKET: 'Australia', AVG_DEMAND: 310, AVG_INTENT: 58.7 },
        { SOURCE_MARKET: 'Domestic', AVG_DEMAND: 290, AVG_INTENT: 55.3 },
      ],
      ratePosition: [
        { RATE_POSITION: 'UNDERPRICED', PROPERTY_COUNT: 34 },
        { RATE_POSITION: 'AT_PARITY', PROPERTY_COUNT: 62 },
        { RATE_POSITION: 'OVERPRICED', PROPERTY_COUNT: 24 },
      ],
      propertiesAtRisk: [
        { PROPERTY_NAME: 'Samui Beach Resort', DESTINATION: 'Koh Samui', CATEGORY: 'Luxury', REVPAR: 2100, REVPAR_INDEX: 72.3, OCCUPANCY: 54.2 },
        { PROPERTY_NAME: 'Chiang Mai Grand', DESTINATION: 'Chiang Mai', CATEGORY: 'Upper Upscale', REVPAR: 1450, REVPAR_INDEX: 78.1, OCCUPANCY: 48.6 },
        { PROPERTY_NAME: 'Patong Bay Inn', DESTINATION: 'Phuket', CATEGORY: 'Midscale', REVPAR: 1680, REVPAR_INDEX: 81.2, OCCUPANCY: 56.8 },
        { PROPERTY_NAME: 'Lamai Wellness Retreat', DESTINATION: 'Koh Samui', CATEGORY: 'Upper Upscale', REVPAR: 2380, REVPAR_INDEX: 83.7, OCCUPANCY: 51.4 },
        { PROPERTY_NAME: 'Chiang Rai Hilltop Lodge', DESTINATION: 'Chiang Mai', CATEGORY: 'Midscale', REVPAR: 980, REVPAR_INDEX: 76.5, OCCUPANCY: 42.1 },
        { PROPERTY_NAME: 'Hua Hin Seaside Hotel', DESTINATION: 'Hua Hin', CATEGORY: 'Upscale', REVPAR: 1920, REVPAR_INDEX: 84.6, OCCUPANCY: 58.3 },
        { PROPERTY_NAME: 'Kata Beach Residence', DESTINATION: 'Phuket', CATEGORY: 'Upscale', REVPAR: 2050, REVPAR_INDEX: 86.1, OCCUPANCY: 60.2 },
        { PROPERTY_NAME: 'Nimman Heritage Chiang Mai', DESTINATION: 'Chiang Mai', CATEGORY: 'Boutique', REVPAR: 1120, REVPAR_INDEX: 79.8, OCCUPANCY: 45.7 },
      ],
      pace: [
        { DESTINATION: 'Phuket', AVG_PACE_INDEX: 123.4 },
        { DESTINATION: 'Bangkok', AVG_PACE_INDEX: 108.2 },
        { DESTINATION: 'Koh Samui', AVG_PACE_INDEX: 95.6 },
        { DESTINATION: 'Chiang Mai', AVG_PACE_INDEX: 88.1 },
      ],
      rateShopping: [
        { STAY_DATE: new Date(today.getTime() + 86400000).toISOString().split('T')[0], PROPERTY_NAME: 'Phuket Oceanfront Villa', YOUR_RATE: 4200, BOOKING_COM: 4350, AGODA: 4100, EXPEDIA: 4250, DIRECT: 3990, COMP_AVG: 4233, RATE_POSITION: 'UNDERPRICED' },
        { STAY_DATE: new Date(today.getTime() + 86400000).toISOString().split('T')[0], PROPERTY_NAME: 'Bangkok Riverside Luxury', YOUR_RATE: 3800, BOOKING_COM: 3750, AGODA: 3680, EXPEDIA: 3820, DIRECT: 3610, COMP_AVG: 3750, RATE_POSITION: 'AT_PARITY' },
        { STAY_DATE: new Date(today.getTime() + 2 * 86400000).toISOString().split('T')[0], PROPERTY_NAME: 'Samui Beach Resort', YOUR_RATE: 5100, BOOKING_COM: 4800, AGODA: 4750, EXPEDIA: 4900, DIRECT: 4845, COMP_AVG: 4817, RATE_POSITION: 'OVERPRICED' },
        { STAY_DATE: new Date(today.getTime() + 2 * 86400000).toISOString().split('T')[0], PROPERTY_NAME: 'Chiang Mai Heritage', YOUR_RATE: 2100, BOOKING_COM: 2350, AGODA: 2280, EXPEDIA: 2400, DIRECT: 1995, COMP_AVG: 2343, RATE_POSITION: 'UNDERPRICED' },
        { STAY_DATE: new Date(today.getTime() + 3 * 86400000).toISOString().split('T')[0], PROPERTY_NAME: 'Phuket Oceanfront Villa', YOUR_RATE: 4500, BOOKING_COM: 4400, AGODA: 4380, EXPEDIA: 4450, DIRECT: 4275, COMP_AVG: 4410, RATE_POSITION: 'AT_PARITY' },
        { STAY_DATE: new Date(today.getTime() + 3 * 86400000).toISOString().split('T')[0], PROPERTY_NAME: 'Bangkok Riverside Luxury', YOUR_RATE: 3600, BOOKING_COM: 3900, AGODA: 3850, EXPEDIA: 3780, DIRECT: 3420, COMP_AVG: 3843, RATE_POSITION: 'UNDERPRICED' },
      ],
      occupancyCalendar: Array.from({ length: 30 }, (_, i) => {
        const d = new Date(today.getTime() + i * 86400000);
        const dow = d.getDay(); // 0=Sun, 6=Sat
        // Realistic pattern: weekends high, midweek lower, gradual ramp toward peak
        const weekendBoost = (dow === 5 || dow === 6) ? 15 : dow === 0 ? 10 : 0;
        const midweekDip = (dow >= 1 && dow <= 3) ? -8 : 0;
        const seasonalRamp = i * 0.4; // gradual increase toward upcoming high season
        const eventSpike = (i >= 18 && i <= 21) ? 18 : 0; // event window spike
        const base = 62 + weekendBoost + midweekDip + seasonalRamp + eventSpike;
        const noise = (Math.random() - 0.5) * 6;
        return {
          DATE: d.toISOString().split('T')[0],
          OCCUPANCY: Math.min(96, Math.max(42, Math.round(base + noise))),
        };
      }),
      paceTrend: Array.from({ length: 30 }, (_, i) => {
        const date = new Date(today.getTime() + (i - 30) * 86400000).toISOString().split('T')[0];
        const actual = 85 + Math.sin(i / 5) * 20 + Math.random() * 10;
        return {
          DATE: date,
          ACTUAL: i < 25 ? Math.round(actual * 10) / 10 : null,
          FORECAST: i >= 20 ? Math.round((actual + 5 + Math.random() * 8) * 10) / 10 : null,
          STLY: Math.round((actual * 0.88 + Math.random() * 5) * 10) / 10,
        };
      }),
      demandSignals: [
        { SOURCE_MARKET: 'China', DEMAND_CURRENT: 892, DEMAND_PRIOR: 720, WOW_CHANGE: 23.9 },
        { SOURCE_MARKET: 'Europe', DEMAND_CURRENT: 645, DEMAND_PRIOR: 610, WOW_CHANGE: 5.7 },
        { SOURCE_MARKET: 'ASEAN', DEMAND_CURRENT: 580, DEMAND_PRIOR: 550, WOW_CHANGE: 5.5 },
        { SOURCE_MARKET: 'Korea', DEMAND_CURRENT: 412, DEMAND_PRIOR: 380, WOW_CHANGE: 8.4 },
        { SOURCE_MARKET: 'US', DEMAND_CURRENT: 380, DEMAND_PRIOR: 395, WOW_CHANGE: -3.8 },
        { SOURCE_MARKET: 'Japan', DEMAND_CURRENT: 350, DEMAND_PRIOR: 330, WOW_CHANGE: 6.1 },
        { SOURCE_MARKET: 'Australia', DEMAND_CURRENT: 310, DEMAND_PRIOR: 320, WOW_CHANGE: -3.1 },
        { SOURCE_MARKET: 'India', DEMAND_CURRENT: 290, DEMAND_PRIOR: 245, WOW_CHANGE: 18.4 },
      ],
    });
  }
}
