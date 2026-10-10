-- Synthetic property-day revenue management data for a fictional Thai hotel group.
-- Property-level aggregate counts only: there are no guest records, no guest
-- identifiers and no real hotel, operator or channel performance. Nothing is
-- seeded as a prediction. Randomness is HASH-seeded, so every rebuild is
-- reproducible: per-property parity-breach propensity, drift between
-- rate-loading audits, missed audits, property-type-weighted breach drivers,
-- rate parity alerts that are cleared on review, and two regional channel
-- manager outages.
USE DATABASE IDENTIFIER($DEMO_DB);
USE SCHEMA RAW;
USE WAREHOUSE IDENTIFIER($DEMO_WH);

CREATE TABLE RAW.PROPERTIES AS
WITH properties AS (
  SELECT ROW_NUMBER() OVER (ORDER BY SEQ4()) - 1 AS PROPERTY_INDEX
  FROM TABLE(GENERATOR(ROWCOUNT => 40))
), draws AS (
  SELECT PROPERTY_INDEX,
         MOD(ABS(HASH(PROPERTY_INDEX, 'thtrm-shop-cadence')), 1000000) / 1e6 AS U_SHOPS,
         MOD(ABS(HASH(PROPERTY_INDEX, 'thtrm-parity-base')), 1000000) / 1e6 AS U_RATE,
         MOD(ABS(HASH(PROPERTY_INDEX, 'thtrm-load-audit-cycle')), 1000000) / 1e6 AS U_AUDIT,
         MOD(ABS(HASH(PROPERTY_INDEX, 'thtrm-load-audit-habit')), 1000000) / 1e6 AS U_DISCIPLINE,
         MOD(ABS(HASH(PROPERTY_INDEX, 'thtrm-star-tier')), 1000000) / 1e6 AS U_TIER,
         MOD(ABS(HASH(PROPERTY_INDEX, 'thtrm-pickup-volume')), 1000000) / 1e6 AS U_VOLUME,
         MOD(ABS(HASH(PROPERTY_INDEX, 'thtrm-room-count')), 1000000) / 1e6 AS U_ROOMS,
         MOD(ABS(HASH(PROPERTY_INDEX, 'thtrm-budget-pace')), 1000000) / 1e6 AS U_PLAN,
         MOD(ABS(HASH(PROPERTY_INDEX, 'thtrm-rate-card')), 1000000) / 1e6 AS U_ADR
  FROM properties
), sized AS (
  SELECT *,
         -- Deterministic spread (5 and 8 are coprime): every city and
         -- property type is present.
         CASE MOD(PROPERTY_INDEX, 5) WHEN 0 THEN 'Bangkok' WHEN 1 THEN 'Phuket'
              WHEN 2 THEN 'Chiang Mai' WHEN 3 THEN 'Pattaya' ELSE 'Krabi' END AS REGION,
         CASE MOD(PROPERTY_INDEX, 8) WHEN 0 THEN 'City hotel' WHEN 1 THEN 'City hotel' WHEN 2 THEN 'City hotel'
              WHEN 3 THEN 'Beach resort' WHEN 4 THEN 'Beach resort' WHEN 5 THEN 'Pool villa'
              WHEN 6 THEN 'Boutique' ELSE 'Serviced residence' END AS CATEGORY
  FROM draws
), rooms AS (
  SELECT *,
         CASE CATEGORY WHEN 'City hotel' THEN 120 + FLOOR(U_ROOMS * 161)
                       WHEN 'Beach resort' THEN 90 + FLOOR(U_ROOMS * 131)
                       WHEN 'Pool villa' THEN 16 + FLOOR(U_ROOMS * 25)
                       WHEN 'Boutique' THEN 30 + FLOOR(U_ROOMS * 41)
                       ELSE 80 + FLOOR(U_ROOMS * 81) END AS AVAILABLE_ROOMS,
         1 + FLOOR(U_TIER * 3) AS SERVICE_TIER
  FROM sized
)
SELECT 'HTL-' || LPAD(PROPERTY_INDEX::VARCHAR, 4, '0') AS ID,
       'Synthetic ' || LOWER(CATEGORY) || ' ' || LPAD(PROPERTY_INDEX::VARCHAR, 4, '0') AS NAME,
       REGION, CATEGORY, PROPERTY_INDEX,
       SERVICE_TIER,
       AVAILABLE_ROOMS,
       -- Competitor rate-shop checks run per day for this property.
       ROUND(3 + U_SHOPS * 9, 1) AS RATE_SHOPS_PER_DAY,
       -- Mean new bookings per day.
       AVAILABLE_ROOMS * (0.17 + 0.11 * U_VOLUME) * IFF(CATEGORY = 'Pool villa', 0.5, 1) AS BOOKING_RATE,
       -- Budgeted bookings for the 90-day window (synthetic budget).
       ROUND(AVAILABLE_ROOMS * (0.17 + 0.11 * U_VOLUME) * IFF(CATEGORY = 'Pool villa', 0.5, 1)
             * 90 * (0.94 + 0.14 * U_PLAN)) AS BUDGET_BOOKINGS_90D,
       -- Synthetic rack rate (THB per room night) by type, city and tier.
       ROUND(CASE CATEGORY WHEN 'City hotel' THEN 3200 WHEN 'Beach resort' THEN 5200
                           WHEN 'Pool villa' THEN 11500 WHEN 'Boutique' THEN 4100 ELSE 2700 END
             * CASE REGION WHEN 'Bangkok' THEN 1.0 WHEN 'Phuket' THEN 1.22 WHEN 'Chiang Mai' THEN 0.82
                           WHEN 'Pattaya' THEN 0.86 ELSE 1.1 END
             * (0.82 + 0.16 * SERVICE_TIER) * (0.92 + 0.16 * U_ADR), -1) AS BASE_ADR_THB,
       -- Base daily probability of a confirmed rate parity breach 0.5%-3%;
       -- ~14% of properties are persistent outliers (x3).
       (0.005 + U_RATE * 0.025) * IFF(U_RATE > 0.86, 3, 1) AS BASE_BREACH_RATE,
       7 * (1 + FLOOR(U_AUDIT * 3)) AS AUDIT_INTERVAL_DAYS,
       0.52 + U_DISCIPLINE * 0.46 AS AUDIT_COMPLETION_PROB,
       'Active' AS STATUS
FROM rooms;

CREATE TABLE RAW.PROPERTY_DAILY AS
WITH days AS (
  SELECT ROW_NUMBER() OVER (ORDER BY SEQ4()) - 1 AS DAY_INDEX
  FROM TABLE(GENERATOR(ROWCOUNT => 90))
), regional_events AS (
  -- Two regional channel manager outages; every property in the city raises an alert.
  SELECT * FROM VALUES (27, 'Phuket'), (63, 'Krabi') AS o(DAY_INDEX, REGION)
), base AS (
  SELECT p.ID AS ENTITY_ID, p.PROPERTY_INDEX, p.CATEGORY, p.REGION, p.RATE_SHOPS_PER_DAY, p.BOOKING_RATE,
         p.AVAILABLE_ROOMS, p.BASE_ADR_THB, p.BASE_BREACH_RATE, p.AUDIT_INTERVAL_DAYS, p.AUDIT_COMPLETION_PROB,
         d.DAY_INDEX,
         DATEADD('day', d.DAY_INDEX - 89, CURRENT_DATE()) AS EVENT_DATE,
         MOD(d.DAY_INDEX + p.PROPERTY_INDEX * 3, p.AUDIT_INTERVAL_DAYS) AS DAYS_SINCE_AUDIT,
         MOD(ABS(HASH(p.ID, d.DAY_INDEX, 'thtrm-breach-day')), 1000000) / 1e6 AS U_BREACH,
         MOD(ABS(HASH(p.ID, d.DAY_INDEX, 'thtrm-alert-raised')), 1000000) / 1e6 AS U_DETECT,
         MOD(ABS(HASH(p.ID, d.DAY_INDEX, 'thtrm-alert-cleared')), 1000000) / 1e6 AS U_FP,
         MOD(ABS(HASH(p.ID, d.DAY_INDEX, 'thtrm-breach-cause')), 1000000) / 1e6 AS U_DRIVER,
         MOD(ABS(HASH(p.ID, d.DAY_INDEX, 'thtrm-load-audit-done')), 1000000) / 1e6 AS U_DONE,
         MOD(ABS(HASH(p.ID, d.DAY_INDEX, 'thtrm-new-bookings')), 1000000) / 1e6 AS U_BOOK,
         MOD(ABS(HASH(p.ID, d.DAY_INDEX, 'thtrm-at-floor')), 1000000) / 1e6 AS U_IN_TARGET,
         MOD(ABS(HASH(p.ID, d.DAY_INDEX, 'thtrm-rooms-sold')), 1000000) / 1e6 AS U_OCC,
         MOD(ABS(HASH(p.ID, d.DAY_INDEX, 'thtrm-rate-mix')), 1000000) / 1e6 AS U_MIX,
         MOD(ABS(HASH(p.ID, d.DAY_INDEX, 'thtrm-noise')), 1000000) / 1e6 AS U_NOISE,
         MOD(ABS(HASH(p.ID, d.DAY_INDEX, 'thtrm-case')), 1000000) / 1e6 AS U_CASE,
         e.REGION IS NOT NULL AS REGIONAL_EVENT
  FROM RAW.PROPERTIES p CROSS JOIN days d
  LEFT JOIN regional_events e ON e.DAY_INDEX = d.DAY_INDEX AND e.REGION = p.REGION
), audits AS (
  SELECT *,
         IFF(DAYS_SINCE_AUDIT = 0, 1, 0) AS AUDIT_DUE,
         IFF(DAYS_SINCE_AUDIT = 0 AND U_DONE < AUDIT_COMPLETION_PROB, 1, 0) AS AUDIT_COMPLETED,
         -- Rate-loading drift rises between audits; weak follow-through carries it over.
         DAYS_SINCE_AUDIT / AUDIT_INTERVAL_DAYS + (1 - AUDIT_COMPLETION_PROB) AS DRIFT
  FROM base
), breaches AS (
  SELECT *,
         CASE WHEN U_BREACH < LEAST(0.5, BASE_BREACH_RATE * (0.35 + 1.7 * DRIFT) * (1 + 4 / (1 + RATE_SHOPS_PER_DAY))) / 4 THEN 2
              WHEN U_BREACH < LEAST(0.5, BASE_BREACH_RATE * (0.35 + 1.7 * DRIFT) * (1 + 4 / (1 + RATE_SHOPS_PER_DAY))) THEN 1
              ELSE 0 END AS BREACH_EVENTS
  FROM audits
), alerts AS (
  SELECT *,
         -- Rate shopping raises an alert for about 82% of parity breaches.
         IFF(REGIONAL_EVENT, 0, IFF(U_DETECT < 0.82, BREACH_EVENTS, 0)) AS BREACH_COUNT,
         -- Alerts cleared on review: higher where channel mix is widest.
         IFF(REGIONAL_EVENT, 1, IFF(U_FP < CASE CATEGORY WHEN 'City hotel' THEN 0.12
                                                         WHEN 'Beach resort' THEN 0.10
                                                         WHEN 'Pool villa' THEN 0.08 ELSE 0.07 END, 1, 0)) AS CLEARED_COUNT,
         FLOOR(BOOKING_RATE * (0.6 + 0.8 * U_BOOK) + U_NOISE) AS BOOKING_COUNT,
         LEAST(AVAILABLE_ROOMS, ROUND(AVAILABLE_ROOMS * (0.70 + 0.13 * U_OCC + 0.05 * DRIFT + 0.04 * BREACH_EVENTS))) AS ROOMS_SOLD,
         -- Achieved rate: two peak days per 7-day cycle (seeded by day index, not calendar), leakage when channels undercut the rate.
         BASE_ADR_THB * (0.9 + 0.2 * U_MIX) * IFF(MOD(DAY_INDEX, 7) IN (5, 6), 1.08, 1)
           * (1 - 0.05 * DRIFT - 0.07 * BREACH_EVENTS) AS ACHIEVED_ADR
  FROM breaches
)
SELECT ENTITY_ID || '-' || TO_CHAR(EVENT_DATE, 'YYYYMMDD') AS EVENT_ID,
       ENTITY_ID, EVENT_DATE,
       BOOKING_COUNT,
       -- Bookings sold at or above the property rate floor.
       FLOOR(BOOKING_COUNT * LEAST(0.98, 0.79 + 0.16 * U_IN_TARGET - 0.07 * DRIFT - 0.09 * BREACH_EVENTS)) AS AT_RATE_COUNT,
       BREACH_COUNT + CLEARED_COUNT AS PARITY_ALERT_COUNT,
       BREACH_COUNT,
       IFF(BREACH_COUNT > 0 AND U_CASE < 0.55, 1, 0) AS CASE_OPENED,
       CASE WHEN BREACH_COUNT + CLEARED_COUNT = 0 THEN 'None'
            WHEN REGIONAL_EVENT THEN 'Channel manager outage'
            WHEN CATEGORY = 'City hotel' THEN IFF(U_DRIVER < 0.4, 'OTA promo stacking', IFF(U_DRIVER < 0.75, 'Wholesale rate leakage', 'Last-minute discount'))
            WHEN CATEGORY = 'Beach resort' THEN IFF(U_DRIVER < 0.45, 'Wholesale rate leakage', IFF(U_DRIVER < 0.8, 'Package price undercut', 'Group block release'))
            WHEN CATEGORY = 'Pool villa' THEN IFF(U_DRIVER < 0.55, 'Package price undercut', 'Last-minute discount')
            WHEN CATEGORY = 'Boutique' THEN IFF(U_DRIVER < 0.45, 'Metasearch price mismatch', IFF(U_DRIVER < 0.8, 'Last-minute discount', 'OTA promo stacking'))
            ELSE IFF(U_DRIVER < 0.5, 'Long-stay rate misload', IFF(U_DRIVER < 0.75, 'Metasearch price mismatch', 'Wholesale rate leakage')) END AS BREACH_DRIVER,
       AUDIT_DUE, AUDIT_COMPLETED,
       AVAILABLE_ROOMS,
       ROOMS_SOLD AS OCCUPIED_ROOMS,
       ROUND(ROOMS_SOLD * ACHIEVED_ADR) AS ROOM_REVENUE_THB,
       -- Median hours for a rate change to reach every channel, and rate mismatches open at day end.
       ROUND(0.8 + 1.7 * DRIFT + 3.1 * BREACH_EVENTS + U_NOISE * 1.2, 2) AS SYNC_LAG_HOURS,
       ROUND(0.3 + 1.1 * DRIFT + 2.4 * BREACH_EVENTS + U_NOISE * 1.8) AS OPEN_MISMATCHES,
       CURRENT_TIMESTAMP() AS LOADED_AT
FROM alerts;

-- Distribution channel connections and rate parity audit status per property (snapshot, synthetic).
CREATE TABLE RAW.CHANNEL_CONNECTIONS AS
WITH links AS (
  SELECT ID, CATEGORY,
         3 + MOD(ABS(HASH(ID, 'thtrm-channels')), 6) AS CONNECTED,
         MOD(ABS(HASH(ID, 'thtrm-channels-audited')), 9) AS AUDITED_DRAW,
         MOD(ABS(HASH(ID, 'thtrm-channels-pending')), 3) AS PENDING_DRAW
  FROM RAW.PROPERTIES
)
SELECT ID AS ENTITY_ID,
       CASE CATEGORY WHEN 'City hotel' THEN 'OTA and GDS' WHEN 'Beach resort' THEN 'OTA and wholesale'
                     WHEN 'Pool villa' THEN 'Direct and OTA' WHEN 'Boutique' THEN 'OTA and metasearch'
                     ELSE 'Corporate and OTA' END AS CHANNEL_TYPE,
       CONNECTED AS CHANNELS_CONNECTED,
       LEAST(AUDITED_DRAW, CONNECTED) AS CHANNELS_AUDITED,
       LEAST(PENDING_DRAW, CONNECTED - LEAST(AUDITED_DRAW, CONNECTED)) AS AUDITS_PENDING,
       CURRENT_DATE() AS SNAPSHOT_DATE
FROM links;
