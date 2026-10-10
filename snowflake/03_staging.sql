-- Validate the producer contract before building downstream objects.
USE DATABASE IDENTIFIER($DEMO_DB);
USE SCHEMA RAW;
USE WAREHOUSE IDENTIFIER($DEMO_WH);

EXECUTE IMMEDIATE $$
DECLARE
  violations INTEGER;
  invalid_source EXCEPTION (-20001, 'Synthetic source failed grain or measure validation');
BEGIN
  SELECT COUNT(*) INTO :violations FROM (
    SELECT ENTITY_ID, EVENT_DATE
    FROM RAW.PROPERTY_DAILY
    GROUP BY ENTITY_ID, EVENT_DATE HAVING COUNT(*) <> 1
    UNION ALL
    SELECT observation.ENTITY_ID, observation.EVENT_DATE
    FROM RAW.PROPERTY_DAILY observation
    LEFT JOIN RAW.PROPERTIES site ON site.ID = observation.ENTITY_ID
    WHERE site.ID IS NULL OR observation.BOOKING_COUNT < 0
       OR observation.AT_RATE_COUNT < 0 OR observation.AT_RATE_COUNT > observation.BOOKING_COUNT
       OR observation.BREACH_COUNT < 0 OR observation.BREACH_COUNT > observation.PARITY_ALERT_COUNT
       OR observation.CASE_OPENED > observation.BREACH_COUNT
       OR observation.AUDIT_COMPLETED > observation.AUDIT_DUE
       OR observation.AVAILABLE_ROOMS <= 0 OR observation.OCCUPIED_ROOMS < 0
       OR observation.OCCUPIED_ROOMS > observation.AVAILABLE_ROOMS OR observation.ROOM_REVENUE_THB < 0
  );
  IF (violations > 0) THEN
    RAISE invalid_source;
  END IF;
END;
$$;
