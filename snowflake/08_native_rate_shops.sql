-- ============================================================================
-- 08_native_rate_shops.sql - Snowflake-only build: live rate-shop feed without AWS.
-- Creates RAW.LIVE_RATE_SHOPS (same columns as the Snowpipe target created by
-- aws/setup_aws.py) and APP.SIMULATE_RATE_SHOPS(N), which inserts synthetic
-- rate-shop events (property level, no guest identifiers) with the same value ranges
-- and ~10% ALERT rate as aws/publish_rate_shops.py. Rows are inserted directly;
-- this simulates a rate-shopping service feed and is not Snowpipe Streaming.
-- Run before 06_intelligence.sql (the alert reads RAW.LIVE_RATE_SHOPS).
-- Idempotent: safe to run in the AWS build too.
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS RAW;
CREATE SCHEMA IF NOT EXISTS APP;

CREATE TABLE IF NOT EXISTS RAW.LIVE_RATE_SHOPS (
  PROPERTY_ID VARCHAR, EVENT_TS TIMESTAMP_NTZ, OTA_GAP_PCT FLOAT, SYNC_LAG_HOURS FLOAT,
  STATUS VARCHAR, SENT_TS TIMESTAMP_NTZ, SOURCE_FILE VARCHAR,
  LOADED_AT TIMESTAMP_LTZ DEFAULT CURRENT_TIMESTAMP());

CREATE OR REPLACE PROCEDURE APP.SIMULATE_RATE_SHOPS(N NUMBER)
RETURNS NUMBER
LANGUAGE SQL
EXECUTE AS OWNER
AS
$$
BEGIN
  IF (N < 1 OR N > 1000) THEN
    RETURN 0;
  END IF;
  INSERT INTO RAW.LIVE_RATE_SHOPS (PROPERTY_ID, EVENT_TS, OTA_GAP_PCT, SYNC_LAG_HOURS, STATUS, SENT_TS, SOURCE_FILE)
    WITH g AS (
      SELECT 'HTL-' || LPAD(UNIFORM(0, 39, RANDOM())::VARCHAR, 4, '0') AS PROPERTY_ID,
             UNIFORM(0::FLOAT, 1::FLOAT, RANDOM()) < 0.1 AS IS_ALERT,
             SYSDATE() AS TS, SEQ4() AS I
      FROM TABLE(GENERATOR(ROWCOUNT => 1000))
    )
    -- NORMAL() needs a constant mean, so the alert offset is added outside it.
    SELECT PROPERTY_ID, TS,
           ROUND(IFF(IS_ALERT, 9, 1.2) * EXP(NORMAL(0, 0.5, RANDOM())), 1),
           ROUND(GREATEST(0, IFF(IS_ALERT, 8.5, 2.0) + NORMAL(0, 1.0, RANDOM())), 2),
           IFF(IS_ALERT, 'ALERT', 'OK'), TS, 'APP.SIMULATE_RATE_SHOPS'
    FROM g
    WHERE I < :N;
  RETURN SQLROWCOUNT;
END;
$$;

-- Optional continuous feed for longer demos (suspended; RESUME to start, SUSPEND after).
CREATE OR REPLACE TASK APP.TASK_SIMULATE_RATE_SHOPS
  WAREHOUSE = __DEMO_WH__
  SCHEDULE = '1 MINUTE'
AS
  CALL APP.SIMULATE_RATE_SHOPS(5);
