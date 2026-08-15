-- ============================================================================
-- 04_DYNAMIC_TABLES.SQL — Curated layer for Revenue Management & Dynamic Pricing
-- ============================================================================
USE DATABASE TOURISM_REVENUE;
USE SCHEMA CURATED;

-- PROPERTY_REVPAR: Real-time RevPAR calculation by property with competitive index
-- Source: PROPERTIES, REVENUE_ACTUALS, COMPETITIVE_SET
CREATE OR REPLACE DYNAMIC TABLE CURATED.PROPERTY_REVPAR
  TARGET_LAG = '5 minutes'
  WAREHOUSE = TOURISM_WH
AS
SELECT * FROM RAW.PROPERTIES;
-- TODO: Replace with actual join/aggregation logic per demo

-- DEMAND_TIMESERIES: Daily demand by property and source market for ML.FORECAST
-- Source: DEMAND_SIGNALS, RESERVATIONS
CREATE OR REPLACE DYNAMIC TABLE CURATED.DEMAND_TIMESERIES
  TARGET_LAG = '5 minutes'
  WAREHOUSE = TOURISM_WH
AS
SELECT * FROM RAW.DEMAND_SIGNALS;
-- TODO: Replace with actual join/aggregation logic per demo

-- RATE_RECOMMENDATIONS: AI-optimized rate recommendations by property and date
-- Source: OTA_RATE_FEEDS, DEMAND_SIGNALS, REVENUE_ACTUALS
CREATE OR REPLACE DYNAMIC TABLE CURATED.RATE_RECOMMENDATIONS
  TARGET_LAG = '5 minutes'
  WAREHOUSE = TOURISM_WH
AS
SELECT * FROM RAW.OTA_RATE_FEEDS;
-- TODO: Replace with actual join/aggregation logic per demo

-- BOOKING_PACE: Booking pace vs same-time-last-year by property
-- Source: RESERVATIONS
CREATE OR REPLACE DYNAMIC TABLE CURATED.BOOKING_PACE
  TARGET_LAG = '5 minutes'
  WAREHOUSE = TOURISM_WH
AS
SELECT * FROM RAW.RESERVATIONS;
-- TODO: Replace with actual join/aggregation logic per demo

