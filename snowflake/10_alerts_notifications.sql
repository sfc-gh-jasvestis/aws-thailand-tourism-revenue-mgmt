-- ============================================================================
-- 10_ALERTS_NOTIFICATIONS.SQL — Alerts for Revenue Management & Dynamic Pricing
-- ============================================================================
USE DATABASE TOURISM_REVENUE;
USE SCHEMA APP;

-- Notification integration (email)
CREATE OR REPLACE NOTIFICATION INTEGRATION aws_thailand_tourism_revenue_mgmt_EMAIL_INT
  TYPE = EMAIL
  ENABLED = TRUE
  ALLOWED_RECIPIENTS = ('<YOUR_EMAIL>');

-- Alert: REVPAR_DROP_ALERT
CREATE OR REPLACE ALERT APP.REVPAR_DROP_ALERT
  WAREHOUSE = TOURISM_WH
  SCHEDULE = '5 MINUTE'
  COMMENT = 'RevPAR underperforming competitive set'
IF (EXISTS (
  SELECT 1 FROM CURATED.PROPERTY_REVPAR
  WHERE 1=1 -- Condition: REVPAR_INDEX < 90 vs competitive set for 7 consecutive days
))
THEN
  CALL SYSTEM$SEND_EMAIL(
    'aws_thailand_tourism_revenue_mgmt_EMAIL_INT',
    '<YOUR_EMAIL>',
    '[ALERT] Revenue Management & Dynamic Pricing: RevPAR underperforming competitive set',
    'RevPAR underperforming competitive set'
  );

ALTER ALERT APP.REVPAR_DROP_ALERT RESUME;

-- Alert: DEMAND_SURGE_ALERT
CREATE OR REPLACE ALERT APP.DEMAND_SURGE_ALERT
  WAREHOUSE = TOURISM_WH
  SCHEDULE = '5 MINUTE'
  COMMENT = 'Demand surge detected — rate increase opportunity'
IF (EXISTS (
  SELECT 1 FROM CURATED.PROPERTY_REVPAR
  WHERE 1=1 -- Condition: BOOKING_PACE > 150% vs STLY for any property
))
THEN
  CALL SYSTEM$SEND_EMAIL(
    'aws_thailand_tourism_revenue_mgmt_EMAIL_INT',
    '<YOUR_EMAIL>',
    '[ALERT] Revenue Management & Dynamic Pricing: Demand surge detected — rate increase opportunity',
    'Demand surge detected — rate increase opportunity'
  );

ALTER ALERT APP.DEMAND_SURGE_ALERT RESUME;

