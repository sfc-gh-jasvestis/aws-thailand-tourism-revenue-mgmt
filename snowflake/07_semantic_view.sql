-- ============================================================================
-- 07_SEMANTIC_VIEW.SQL — Semantic View for Revenue Management & Dynamic Pricing
-- Full metrics, dimensions for Cortex Analyst
-- ============================================================================
USE DATABASE TOURISM_REVENUE;
USE SCHEMA APP;

CREATE OR REPLACE SEMANTIC VIEW APP.REVENUE_MANAGEMENT_ANALYTICS

  TABLES (
    property_revpar AS CURATED.PROPERTY_REVPAR,
    demand AS CURATED.DEMAND_TIMESERIES,
    rates AS CURATED.RATE_RECOMMENDATIONS,
    pace AS CURATED.BOOKING_PACE
  )

  DIMENSIONS (
    property_revpar.destination AS DESTINATION
      COMMENT = 'Thai destination: Phuket, Koh Samui, Bangkok, Chiang Mai'
      SAMPLE_VALUES ('Phuket', 'Koh Samui', 'Bangkok', 'Chiang Mai') IS_ENUM,
    property_revpar.category AS CATEGORY
      COMMENT = 'Hotel category'
      SAMPLE_VALUES ('Luxury', 'Upper Upscale', 'Upscale', 'Midscale') IS_ENUM,
    property_revpar.property_name_dim AS PROPERTY_NAME
      COMMENT = 'Property name',
    property_revpar.revenue_date_dim AS REVENUE_DATE
      COMMENT = 'Revenue reporting date',
    demand.source_market AS SOURCE_MARKET
      COMMENT = 'Tourist source market'
      SAMPLE_VALUES ('China', 'Europe', 'US', 'ASEAN', 'Korea', 'Japan', 'Australia', 'Domestic') IS_ENUM,
    rates.rate_position AS RATE_POSITION
      COMMENT = 'Rate position vs OTA market'
      SAMPLE_VALUES ('UNDERPRICED', 'AT_PARITY', 'OVERPRICED') IS_ENUM
  )

  METRICS (
    property_revpar.avg_revpar AS AVG(REVPAR)
      COMMENT = 'Average RevPAR across properties in THB',
    property_revpar.avg_adr AS AVG(ADR)
      COMMENT = 'Average Daily Rate in THB',
    property_revpar.avg_occupancy AS AVG(OCCUPANCY)
      COMMENT = 'Average occupancy rate (0-1)',
    property_revpar.avg_revpar_index AS AVG(REVPAR_INDEX)
      COMMENT = 'Average competitive RevPAR index (100 = parity)',
    property_revpar.total_revenue AS SUM(TOTAL_REVENUE)
      COMMENT = 'Total revenue in THB',
    demand.avg_demand_index AS AVG(DEMAND_INDEX)
      COMMENT = 'Average demand index',
    pace.avg_pace_index AS AVG(PACE_INDEX)
      COMMENT = 'Average booking pace vs STLY (100 = parity)'
  )

  COMMENT = 'Revenue management analytics for 120 Thai resort properties';
