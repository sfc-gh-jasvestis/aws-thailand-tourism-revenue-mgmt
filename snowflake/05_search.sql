-- ============================================================================
-- 05_SEARCH.SQL — Cortex Search for Revenue Management & Dynamic Pricing
-- Indexes strategy documents for natural language retrieval
-- ============================================================================
USE DATABASE TOURISM_REVENUE;
USE SCHEMA SEARCH;

CREATE OR REPLACE CORTEX SEARCH SERVICE SEARCH.REVENUE_STRATEGY_SEARCH
  ON CONTENT
  ATTRIBUTES DESTINATION, SEASON, MARKET_SEGMENT
  WAREHOUSE = TOURISM_WH
  TARGET_LAG = '1 hour'
AS (
  SELECT
    DOC_ID,
    TITLE,
    CONTENT,
    DESTINATION,
    SEASON,
    MARKET_SEGMENT
  FROM RAW.STRATEGY_DOCS
);
