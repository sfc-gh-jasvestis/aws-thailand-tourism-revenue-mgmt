-- ============================================================================
-- 06_INTELLIGENCE.SQL - search, anomaly detection, semantic view, agent,
-- live rate-shop alert and on-demand refresh DAG.
-- Run with snowflake/run_intelligence.py (substitutes validated __DEMO_DB__ /
-- __DEMO_WH__ / __ALERT_EMAIL__). Requires 00-05, plus 08 (Snowflake only) or
-- aws/setup_aws.py (AWS build) for RAW.LIVE_RATE_SHOPS.
-- Alerts and tasks are created SUSPENDED; run them with EXECUTE ALERT / EXECUTE TASK.
-- ============================================================================
USE DATABASE __DEMO_DB__;
CREATE SCHEMA IF NOT EXISTS SEARCH;
CREATE SCHEMA IF NOT EXISTS APP;

-- ---------- Synthetic distribution knowledge base (clearly synthetic SOPs) ----------
CREATE OR REPLACE TABLE SEARCH.PROPERTY_SOP_DOCS AS
WITH drivers AS (
  SELECT DISTINCT r.BREACH_DRIVER, s.CATEGORY
  FROM RAW.PROPERTY_DAILY r JOIN RAW.PROPERTIES s ON s.ID = r.ENTITY_ID
  WHERE r.BREACH_COUNT > 0
)
SELECT
  'SOP-' || LPAD(ROW_NUMBER() OVER (ORDER BY CATEGORY, BREACH_DRIVER)::VARCHAR, 3, '0') AS DOC_ID,
  'SOP' AS DOC_TYPE,
  CATEGORY,
  BREACH_DRIVER,
  CATEGORY || ' - ' || BREACH_DRIVER || ' rate parity follow-up' AS TITLE,
  'Synthetic demo SOP for hotel revenue management and distribution; not pricing, legal or contractual guidance. Property type: ' || CATEGORY
  || '. Breach driver: ' || BREACH_DRIVER || '. '
  || 'Step 1: log the parity alert in the distribution tracker and notify the duty revenue manager within 1 hour. '
  || 'Step 2: ' || CASE
       WHEN BREACH_DRIVER = 'OTA promo stacking' THEN 'list OTA promotions live for the stay dates and ask the channel manager which member or mobile discounts combine below the public rate.'
       WHEN BREACH_DRIVER = 'Wholesale rate leakage' THEN 'compare the undercutting rate with the net rates loaded for wholesale partners and ask the contracting lead to trace which partner resold the rate.'
       WHEN BREACH_DRIVER = 'Last-minute discount' THEN 'check the last-minute discount rules for the next 72 hours and confirm the discount is fenced to the intended channel only.'
       WHEN BREACH_DRIVER = 'Package price undercut' THEN 'break the package price into room and inclusions, and confirm the implied room rate stays at or above the rate floor.'
       WHEN BREACH_DRIVER = 'Group block release' THEN 'list group blocks released in the last 7 days and confirm released rooms were reloaded at the current public rate.'
       WHEN BREACH_DRIVER = 'Metasearch price mismatch' THEN 'compare the metasearch price with the direct booking engine for the same room, dates and taxes, and request a cache refresh.'
       WHEN BREACH_DRIVER = 'Long-stay rate misload' THEN 'check the length-of-stay rate plans in the channel manager and confirm long-stay discounts apply only above the minimum nights.'
       ELSE 'review the flagged rates against the property rate plan and escalate if unexplained.'
     END
  || ' Step 3: if bookings below the rate floor stay above 20% or the rate sync lag stays above 4 hours after follow-up, schedule a rate plan review with the property revenue manager. '
  || 'Step 4: record the root cause; if the breach is confirmed, open a channel case for the distribution lead to approve.' AS CONTENT
FROM drivers;

CREATE OR REPLACE CORTEX SEARCH SERVICE SEARCH.PROPERTY_SOP_SEARCH
  ON CONTENT
  ATTRIBUTES CATEGORY, BREACH_DRIVER
  WAREHOUSE = __DEMO_WH__
  TARGET_LAG = '7 days'
AS (SELECT DOC_ID, TITLE, CATEGORY, BREACH_DRIVER, CONTENT FROM SEARCH.PROPERTY_SOP_DOCS);

-- ---------- Rate sync lag anomaly detection (train first 75 days, detect last 15) ----------
CREATE OR REPLACE VIEW ML.SYNC_LAG_SERIES AS
SELECT ENTITY_ID, EVENT_DATE::TIMESTAMP_NTZ AS TS, SYNC_LAG_HOURS::FLOAT AS SYNC_LAG_HOURS
FROM RAW.PROPERTY_DAILY;
CREATE OR REPLACE VIEW ML.SYNC_LAG_TRAIN AS
SELECT * FROM ML.SYNC_LAG_SERIES WHERE TS < (SELECT DATEADD(day, -15, MAX(TS)) FROM ML.SYNC_LAG_SERIES);
CREATE OR REPLACE VIEW ML.SYNC_LAG_DETECT AS
SELECT * FROM ML.SYNC_LAG_SERIES WHERE TS >= (SELECT DATEADD(day, -15, MAX(TS)) FROM ML.SYNC_LAG_SERIES);

CREATE OR REPLACE SNOWFLAKE.ML.ANOMALY_DETECTION ML.SYNC_LAG_ANOMALY_MODEL(
  INPUT_DATA => SYSTEM$REFERENCE('VIEW', 'ML.SYNC_LAG_TRAIN'),
  SERIES_COLNAME => 'ENTITY_ID', TIMESTAMP_COLNAME => 'TS', TARGET_COLNAME => 'SYNC_LAG_HOURS',
  LABEL_COLNAME => '');

CREATE OR REPLACE TABLE ML.SYNC_LAG_ANOMALIES AS
SELECT SERIES::VARCHAR AS ENTITY_ID, TS::DATE AS EVENT_DATE, Y AS SYNC_LAG_HOURS, FORECAST AS EXPECTED,
       LOWER_BOUND, UPPER_BOUND, IS_ANOMALY, PERCENTILE
FROM TABLE(ML.SYNC_LAG_ANOMALY_MODEL!DETECT_ANOMALIES(
  INPUT_DATA => SYSTEM$REFERENCE('VIEW', 'ML.SYNC_LAG_DETECT'),
  SERIES_COLNAME => 'ENTITY_ID', TIMESTAMP_COLNAME => 'TS', TARGET_COLNAME => 'SYNC_LAG_HOURS'));

-- ---------- Semantic view ----------
CREATE OR REPLACE SEMANTIC VIEW APP.REVENUE_MGMT_ANALYTICS
  TABLES (
    props AS CURATED.PERFORMANCE_SUMMARY PRIMARY KEY (ENTITY_ID)
      COMMENT = 'One row per hotel property, 90-day totals',
    risk AS ML.BREACH_RISK_SCORES PRIMARY KEY (ENTITY_ID)
      COMMENT = 'Latest next-7-day rate parity breach probability per property',
    drivers AS CURATED.DRIVER_SUMMARY PRIMARY KEY (BREACH_DRIVER)
      COMMENT = 'Rate parity alerts, confirmed parity breaches and channel cases by breach driver, 90 days',
    daily AS CURATED.TREND_ANALYSIS PRIMARY KEY (METRIC_DATE)
      COMMENT = 'Group-wide totals per day'
  )
  RELATIONSHIPS (risk_prop AS risk (ENTITY_ID) REFERENCES props)
  FACTS (
    props.bookings_f AS BOOKING_COUNT,
    props.atrate_f AS AT_RATE_COUNT,
    props.budget_f AS BUDGET_BOOKINGS_90D,
    props.occupied_f AS OCCUPIED_ROOM_NIGHTS,
    props.available_f AS AVAILABLE_ROOM_NIGHTS,
    props.revenue_f AS ROOM_REVENUE_THB,
    props.alerts_f AS PARITY_ALERT_COUNT,
    props.breaches_f AS BREACH_COUNT,
    props.cases_f AS CASE_COUNT,
    props.audit_due_f AS AUDIT_DUE,
    props.audit_done_f AS AUDIT_COMPLETED,
    risk.breach_prob_f AS BREACH_PROB_7D,
    drivers.type_signals_f AS PARITY_ALERT_COUNT,
    drivers.type_confirmed_f AS BREACH_COUNT,
    drivers.type_cases_f AS CASE_COUNT,
    daily.day_bookings_f AS BOOKING_COUNT,
    daily.day_atrate_f AS AT_RATE_COUNT,
    daily.day_alerts_f AS PARITY_ALERT_COUNT
  )
  DIMENSIONS (
    props.property_id AS ENTITY_ID WITH SYNONYMS = ('property', 'entities', 'hotel'),
    props.property_name AS ENTITY_NAME,
    props.city AS REGION WITH SYNONYMS = ('city', 'destination', 'region') COMMENT = 'Thai city where the property is located',
    props.property_type AS CATEGORY WITH SYNONYMS = ('property type', 'hotel type'),
    props.service_tier AS SERVICE_TIER COMMENT = 'Service tier 1 (midscale) to 3 (luxury)',
    risk.risk_band AS RISK_BAND COMMENT = 'High >= 0.5, Medium >= 0.25, else Low',
    risk.scored_as_of AS SCORED_AS_OF,
    drivers.breach_driver AS BREACH_DRIVER WITH SYNONYMS = ('driver', 'breach cause', 'root cause'),
    daily.metric_date AS METRIC_DATE
  )
  METRICS (
    props.property_count AS COUNT(props.bookings_f) WITH SYNONYMS = ('number of properties', 'entities count'),
    props.total_at_rate AS SUM(props.atrate_f) WITH SYNONYMS = ('bookings at rate floor', 'on-rate bookings'),
    props.total_bookings AS SUM(props.bookings_f) WITH SYNONYMS = ('bookings', 'booking volume'),
    props.total_room_revenue_thb AS SUM(props.revenue_f) WITH SYNONYMS = ('room revenue', 'revenue')
      COMMENT = 'Room revenue in Thai baht, 90 days',
    props.avg_daily_rate_thb AS SUM(props.revenue_f) / NULLIF(SUM(props.occupied_f), 0)
      WITH SYNONYMS = ('ADR', 'average daily rate') COMMENT = 'Room revenue / occupied room nights, THB',
    props.revpar_per_room_thb AS SUM(props.revenue_f) / NULLIF(SUM(props.available_f), 0)
      WITH SYNONYMS = ('RevPAR', 'revenue per available room') COMMENT = 'Room revenue / available room nights, THB',
    props.bookings_vs_budget_pct AS 100 * SUM(props.bookings_f) / NULLIF(SUM(props.budget_f), 0)
      COMMENT = 'Bookings / budgeted bookings for the 90-day window',
    props.room_occupancy_pct AS 100 * SUM(props.occupied_f) / NULLIF(SUM(props.available_f), 0)
      WITH SYNONYMS = ('occupancy', 'room utilisation') COMMENT = 'Occupied room nights / available room nights',
    props.below_floor_pct AS 100 * (SUM(props.bookings_f) - SUM(props.atrate_f)) / NULLIF(SUM(props.bookings_f), 0)
      COMMENT = 'Bookings sold below the property rate floor / bookings',
    props.alert_confirm_pct AS 100 * SUM(props.breaches_f) / NULLIF(SUM(props.alerts_f), 0)
      COMMENT = 'Confirmed rate parity breaches / rate parity alerts raised',
    props.parity_alerts AS SUM(props.alerts_f) WITH SYNONYMS = ('alerts', 'flags'),
    props.confirmed_breaches AS SUM(props.breaches_f) WITH SYNONYMS = ('parity breaches', 'breaches'),
    props.cases_opened AS SUM(props.cases_f) WITH SYNONYMS = ('channel cases', 'cases'),
    props.audit_compliance_pct AS 100 * SUM(props.audit_done_f) / NULLIF(SUM(props.audit_due_f), 0)
      COMMENT = 'Rate-loading audits completed / audits due',
    risk.avg_breach_prob AS AVG(risk.breach_prob_f),
    drivers.type_alerts AS SUM(drivers.type_signals_f),
    drivers.type_breaches AS SUM(drivers.type_confirmed_f),
    drivers.type_cases AS SUM(drivers.type_cases_f),
    drivers.type_confirmation_pct AS 100 * SUM(drivers.type_confirmed_f) / NULLIF(SUM(drivers.type_signals_f), 0),
    daily.daily_bookings AS SUM(daily.day_bookings_f),
    daily.daily_at_rate AS SUM(daily.day_atrate_f),
    daily.daily_alerts AS SUM(daily.day_alerts_f)
  )
  COMMENT = 'Synthetic hotel revenue management analytics (demo; property-level aggregates, no guest data)';
-- ---------- Cortex Agent ----------
CREATE OR REPLACE AGENT APP.REVENUE_MGMT_AGENT
  COMMENT = 'Hotel revenue management assistant over a synthetic Thai hotel group'
  FROM SPECIFICATION
$$
models:
  orchestration: claude-sonnet-4-5
instructions:
  response: "Answer only from tool results. State that data is synthetic. Give property IDs and numbers with units (THB for rates and revenue). Do not give pricing, investment or legal advice; this is property-level operational data only."
  orchestration: "Use revenue_analyst for bookings vs budget, room occupancy, ADR, RevPAR, room revenue, bookings below the rate floor, rate parity alerts, confirmed parity breaches, channel cases, rate-loading audit compliance, properties, cities, property types and breach risk. Use sop_search for follow-up procedures."
tools:
  - tool_spec:
      type: cortex_analyst_text_to_sql
      name: revenue_analyst
      description: "Bookings vs budget, room occupancy, ADR, RevPAR, room revenue, bookings below rate floor, rate parity alerts, confirmed parity breaches, channel cases, rate-loading audit compliance, breach drivers and breach risk scores per property"
  - tool_spec:
      type: cortex_search
      name: sop_search
      description: "Synthetic rate parity SOPs by property type and breach driver"
tool_resources:
  revenue_analyst:
    semantic_view: __DEMO_DB__.APP.REVENUE_MGMT_ANALYTICS
    execution_environment:
      type: warehouse
      warehouse: __DEMO_WH__
  sop_search:
    name: __DEMO_DB__.SEARCH.PROPERTY_SOP_SEARCH
    max_results: 3
    id_column: DOC_ID
    title_column: TITLE
$$;

-- ---------- Live rate-shop alert ----------
CREATE TABLE IF NOT EXISTS APP.ALERT_LOG (
  ALERTED_AT TIMESTAMP_LTZ DEFAULT CURRENT_TIMESTAMP(), PROPERTY_ID VARCHAR,
  EVENT_TS TIMESTAMP_NTZ, OTA_GAP_PCT FLOAT, SYNC_LAG_HOURS FLOAT, SOP_HINT VARCHAR);

CREATE OR REPLACE NOTIFICATION INTEGRATION TH_TOURISM_REVENUE_MGMT_EMAIL_INT
  TYPE = EMAIL ENABLED = TRUE ALLOWED_RECIPIENTS = ('__ALERT_EMAIL__');

CREATE OR REPLACE PROCEDURE APP.LOG_LIVE_ALERTS()
RETURNS NUMBER
LANGUAGE SQL
EXECUTE AS OWNER
AS
$$
DECLARE
  n NUMBER;
BEGIN
  INSERT INTO APP.ALERT_LOG (PROPERTY_ID, EVENT_TS, OTA_GAP_PCT, SYNC_LAG_HOURS, SOP_HINT)
    SELECT v.PROPERTY_ID, v.EVENT_TS, v.OTA_GAP_PCT, v.SYNC_LAG_HOURS,
           'Check ' || s.CATEGORY || ' rate parity SOPs; current risk band ' || COALESCE(r.RISK_BAND, 'n/a')
    FROM RAW.LIVE_RATE_SHOPS v
    JOIN RAW.PROPERTIES s ON s.ID = v.PROPERTY_ID
    LEFT JOIN ML.BREACH_RISK_SCORES r ON r.ENTITY_ID = v.PROPERTY_ID
    WHERE v.STATUS = 'ALERT'
      AND NOT EXISTS (SELECT 1 FROM APP.ALERT_LOG l WHERE l.PROPERTY_ID = v.PROPERTY_ID AND l.EVENT_TS = v.EVENT_TS);
  n := SQLROWCOUNT;
  IF (n > 0) THEN
    CALL SYSTEM$SEND_EMAIL('TH_TOURISM_REVENUE_MGMT_EMAIL_INT', '__ALERT_EMAIL__',
      '[Demo] Hotel rate parity alert',
      'New rate-shop alerts logged in APP.ALERT_LOG: ' || :n || '. Data is synthetic.');
  END IF;
  RETURN n;
END;
$$;

CREATE OR REPLACE ALERT APP.LIVE_RATE_SHOPS_ALERT
  WAREHOUSE = __DEMO_WH__
  SCHEDULE = '5 MINUTE'
  IF (EXISTS (
    SELECT 1 FROM RAW.LIVE_RATE_SHOPS v
    WHERE v.STATUS = 'ALERT'
      AND NOT EXISTS (SELECT 1 FROM APP.ALERT_LOG l WHERE l.PROPERTY_ID = v.PROPERTY_ID AND l.EVENT_TS = v.EVENT_TS)))
  THEN CALL APP.LOG_LIVE_ALERTS();

-- ---------- On-demand refresh DAG (suspended; run with EXECUTE TASK APP.TASK_REFRESH_CURATED) ----------
CREATE OR REPLACE PROCEDURE APP.REFRESH_CURATED()
RETURNS VARCHAR
LANGUAGE SQL
EXECUTE AS OWNER
AS
$$
BEGIN
  ALTER DYNAMIC TABLE CURATED.PERFORMANCE_SUMMARY REFRESH;
  ALTER DYNAMIC TABLE CURATED.TREND_ANALYSIS REFRESH;
  ALTER DYNAMIC TABLE CURATED.DRIVER_SUMMARY REFRESH;
  ALTER DYNAMIC TABLE CURATED.KPI_SUMMARY REFRESH;
  RETURN 'refreshed';
END;
$$;

CREATE OR REPLACE TASK APP.TASK_REFRESH_CURATED
  WAREHOUSE = __DEMO_WH__
AS
  CALL APP.REFRESH_CURATED();

CREATE OR REPLACE TASK APP.TASK_RESCORE_RISK
  WAREHOUSE = __DEMO_WH__
  AFTER APP.TASK_REFRESH_CURATED
AS
  CREATE OR REPLACE TABLE ML.BREACH_RISK_SCORES COPY GRANTS AS
  WITH latest AS (
    SELECT * FROM ML.BREACH_FEATURES QUALIFY ROW_NUMBER() OVER (PARTITION BY ENTITY_ID ORDER BY EVENT_DATE DESC) = 1
  ), p AS (
    SELECT ENTITY_ID, EVENT_DATE,
           ML.BREACH_RISK_MODEL!PREDICT(INPUT_DATA => OBJECT_CONSTRUCT(
             'CATEGORY', CATEGORY, 'SERVICE_TIER', SERVICE_TIER, 'RATE_SHOPS_PER_DAY', RATE_SHOPS_PER_DAY,
             'SYNC_LAG_HOURS', SYNC_LAG_HOURS, 'OPEN_MISMATCHES', OPEN_MISMATCHES,
             'SYNC_LAG_7D', SYNC_LAG_7D, 'BREACH_30D', BREACH_30D)) AS PRED
    FROM latest
  )
  SELECT ENTITY_ID, EVENT_DATE AS SCORED_AS_OF, ROUND(PRED:probability:BREACH::FLOAT, 4) AS BREACH_PROB_7D,
         CASE WHEN PRED:probability:BREACH::FLOAT >= 0.5 THEN 'High'
              WHEN PRED:probability:BREACH::FLOAT >= 0.25 THEN 'Medium' ELSE 'Low' END AS RISK_BAND,
         CURRENT_TIMESTAMP() AS SCORED_AT
  FROM p;
