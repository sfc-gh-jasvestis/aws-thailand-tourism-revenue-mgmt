-- ============================================================================
-- 03_STAGING.SQL — Generate synthetic data for Revenue Management & Dynamic Pricing
-- Country: THAILAND | Currency: THB
-- ============================================================================
USE DATABASE TOURISM_REVENUE;
USE SCHEMA RAW;

-- Data generation scripts are demo-specific.
-- See the handcrafted SQL in the aws-malaysia-semiconductor-yield demo for
-- the full pattern: GENERATOR + UNIFORM + LATERAL for distribution,
-- Cortex Complete for text generation, engineered key demo numbers.

-- Target row counts:
-- PROPERTIES: 120 rows — Resort properties across 4 Thai destinations
-- RESERVATIONS: 250,000 rows — 12 months of reservation data (booked, cancelled, no-show)
-- OTA_RATE_FEEDS: 500,000 rows — Real-time competitive rate data from OTAs (Agoda, Booking, Expedia)
-- DEMAND_SIGNALS: 180,000 rows — Search and booking signals by source market and date
-- REVENUE_ACTUALS: 43,800 rows — Daily revenue actuals by property (365 days × 120 properties)
-- COMPETITIVE_SET: 600 rows — Competitive set definitions (5 comps per property)
-- FLIGHT_CAPACITY: 3,000 rows — Inbound flight capacity by route (proxy for demand)
-- THAI_TOURISM_STATS: 12 rows — Thailand tourism arrival statistics by market
