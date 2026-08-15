-- ============================================================================
-- 11_TASK_PIPELINE.SQL — Task DAG for Revenue Management & Dynamic Pricing
-- ============================================================================
USE DATABASE TOURISM_REVENUE;
USE SCHEMA APP;

CREATE OR REPLACE TASK APP.TASK_INGEST_OTA_RATES
  WAREHOUSE = TOURISM_WH
  SCHEDULE = 'USING CRON 0 */2 * * * UTC'
  COMMENT = 'Ingest latest OTA competitive rates'
AS
  SELECT 1; -- Replace with actual refresh logic

CREATE OR REPLACE TASK APP.TASK_GENERATE_RECOMMENDATIONS
  WAREHOUSE = TOURISM_WH
  AFTER APP.TASK_INGEST_OTA_RATES
  COMMENT = 'Generate rate recommendations via ML.FORECAST + Cortex Complete'
AS
  SELECT 1; -- Replace with actual refresh logic

CREATE OR REPLACE TASK APP.TASK_PUSH_RATES
  WAREHOUSE = TOURISM_WH
  AFTER APP.TASK_GENERATE_RECOMMENDATIONS
  COMMENT = 'Push approved rate changes to channel manager'
AS
  SELECT 1; -- Replace with actual refresh logic

ALTER TASK APP.TASK_PUSH_RATES RESUME;
ALTER TASK APP.TASK_GENERATE_RECOMMENDATIONS RESUME;
ALTER TASK APP.TASK_INGEST_OTA_RATES RESUME;
