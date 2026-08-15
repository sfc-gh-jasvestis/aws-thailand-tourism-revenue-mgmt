-- ============================================================================
-- 05_SEARCH.SQL — Cortex Search for Revenue Management & Dynamic Pricing
-- ============================================================================
USE DATABASE TOURISM_REVENUE;
USE SCHEMA SEARCH;

CREATE OR REPLACE CORTEX SEARCH SERVICE SEARCH.REVENUE_STRATEGY_SEARCH
  ON STRATEGY_NOTES
  ATTRIBUTES DESTINATION, SEASON, MARKET_SEGMENT
  WAREHOUSE = TOURISM_WH
  TARGET_LAG = '1 hour'
AS (
  SELECT * FROM RAW.COMPETITIVE_SET
);
