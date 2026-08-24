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

    return NextResponse.json({
      kpis: kpis[0] || { AVG_REVPAR: 0, AVG_ADR: 0, AVG_OCC: 0, AVG_INDEX: 0, TOTAL_REV: 0 },
      revparTrend,
      destinations,
      demandByMarket,
      ratePosition,
      propertiesAtRisk,
      pace,
    });
  } catch (error: any) {
    console.error('Data API error:', error.message);
    // Fallback to demo data if Snowflake connection fails
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
      ],
      pace: [
        { DESTINATION: 'Phuket', AVG_PACE_INDEX: 123.4 },
        { DESTINATION: 'Bangkok', AVG_PACE_INDEX: 108.2 },
        { DESTINATION: 'Koh Samui', AVG_PACE_INDEX: 95.6 },
        { DESTINATION: 'Chiang Mai', AVG_PACE_INDEX: 88.1 },
      ],
    });
  }
}
