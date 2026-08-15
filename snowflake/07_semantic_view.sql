-- ============================================================================
-- 07_SEMANTIC_VIEW.SQL — Semantic View for Revenue Management & Dynamic Pricing
-- ============================================================================
USE DATABASE TOURISM_REVENUE;
USE SCHEMA APP;

CREATE OR REPLACE SEMANTIC VIEW APP.REVENUE_MANAGEMENT_ANALYTICS
  COMMENT = 'Revenue management, demand forecasting, and pricing analytics'
AS
  TABLES (
    CURATED.PROPERTY_REVPAR AS property_revpar,CURATED.DEMAND_TIMESERIES AS demand_timeseries,CURATED.RATE_RECOMMENDATIONS AS rate_recommendations,CURATED.BOOKING_PACE AS booking_pace
  );
