-- ============================================================================
-- Revenue Management & Dynamic Pricing
-- Dynamic pricing intelligence for 120 Thai resort properties — Kinesis streams OTA rate feeds, ML.FORECAST predicts demand by source market, and EventBridge triggers automated rate adjustments via Tasks.
-- ============================================================================
USE ROLE ACCOUNTADMIN;
CREATE DATABASE IF NOT EXISTS TOURISM_REVENUE;
CREATE WAREHOUSE IF NOT EXISTS TOURISM_WH WAREHOUSE_SIZE = 'MEDIUM' AUTO_SUSPEND = 120 AUTO_RESUME = TRUE;
USE DATABASE TOURISM_REVENUE;
CREATE SCHEMA IF NOT EXISTS RAW;
CREATE SCHEMA IF NOT EXISTS CURATED;
CREATE SCHEMA IF NOT EXISTS ML;
CREATE SCHEMA IF NOT EXISTS AI;
CREATE SCHEMA IF NOT EXISTS SEARCH;
CREATE SCHEMA IF NOT EXISTS APP;

USE WAREHOUSE TOURISM_WH;
