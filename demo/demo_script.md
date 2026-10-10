# Thailand Hotel Revenue Management

**Thailand - Fictional Hotel Group**
Use case: RevPAR, rate parity and parity breach risk

> Revenue management for 40 properties in a fictional Thai hotel group across 5 cities: dynamic tables, a holdout-evaluated rate parity breach classifier, a bookings forecast and grounded AI answers. Synthetic, property-level data only; no guest records and no real hotel, channel or competitor rates.

## Why Snowflake

- **Dynamic tables** reconcile room occupancy, ADR, RevPAR, bookings against budget, bookings below the rate floor, rate parity alerts, confirmed breaches and rate-loading audit compliance from RAW property data, with checks in `run_core.py`
- **Breach classification** gives a holdout-evaluated next-7-day probability per property
- **Bookings forecast** projects 14 days of new bookings with prediction intervals, for pricing and inventory planning
- **Grounded AI**: the Cortex Agent (Analyst over a semantic view, plus Search over SOPs) shows its SQL and SOP citations
- **Live rate shops**: a native simulator (Snowflake only) or Firehose, S3 and Snowpipe (AWS build), then an alert and email

## What is built

| | |
|---|---|
| Dimension table | `RAW.PROPERTIES` (40 rows) |
| Fact table | `RAW.PROPERTY_DAILY` (3,600 property-days, 90 days) |
| Curated layer | `CURATED.KPI_SUMMARY`, `PERFORMANCE_SUMMARY`, `DRIVER_SUMMARY`, `TREND_ANALYSIS` |
| ML | `ML.BREACH_RISK_SCORES`, `ML.BREACH_RISK_HOLDOUT_METRICS`, `ML.BOOKINGS_FORECAST`, `ML.SYNC_LAG_ANOMALIES` |

Cities: Bangkok, Phuket, Chiang Mai, Pattaya, Krabi.
Property types: City hotel, Beach resort, Pool villa, Boutique, Serviced residence.

## KPI cards (live from `CURATED.KPI_SUMMARY`; no fallback values)

| Card | Value from the seeded data |
|---|---|
| Bookings vs Budget | 97.5% |
| Bookings | 118,958 |
| Room Occupancy | 80.3% |
| Average Daily Rate | 4,424 THB |
| RevPAR | 3,551 THB |
| Room Revenue | 1,883.8 M THB |
| Bookings Below Rate Floor | 19.8% |
| Alert Confirmation Rate | 30.2% |
| Rate Parity Alerts | 510 |
| Confirmed Parity Breaches | 154 |
| Channel Cases Opened | 51 |
| Rate-Loading Audit Compliance | 76.0% |
| Properties Active | 40 |
| Available Rooms | 5,894 |
| Channel Parity Audit Coverage | 61.2% |
| Channel Audits Pending | 23 |
| Average Rate Sync Lag | 2.8 h |
| Open Rate Mismatches (property-day total) | 7,519 |

Values are synthetic. A rebuild reproduces them because the data is HASH-seeded; dates are relative to the build day, so forecast and anomaly figures can shift slightly.

## Demo flow

1. Executive Cockpit: RevPAR, ADR, occupancy and budget KPIs, daily bookings against rate parity alerts, alerts and confirmed breaches by breach driver, property table
2. Predictive: holdout metrics, risk bands, 14-day bookings forecast, rate sync lag anomalies
3. Parity Risk: rate-loading audit compliance, channel parity audit coverage and average rate sync lag, audit compliance against confirmed breaches, then generate the action memo
4. Live Rate Shops: run `CALL APP.SIMULATE_RATE_SHOPS(20)` (Snowflake only) or `python aws/publish_rate_shops.py --count 20` (AWS build). Then run `EXECUTE ALERT APP.LIVE_RATE_SHOPS_ALERT` and show the alert log and email.
5. Ask AI: the Cortex Agent answers metric questions through the semantic view and cites SOPs from Cortex Search. The SQL is shown.
6. QuickSight (AWS build): the same Snowflake tables through DIRECT_QUERY
7. Architecture: both builds side by side

## Talking points

- The group earns RevPAR of 3,551 THB at 80.3% room occupancy and an ADR of 4,424 THB; Phuket leads RevPAR at 4,075 THB. Bookings are at 97.5% of the 90-day budget, and 19.8% of bookings are sold below the rate floor.
- About three in ten rate parity alerts are confirmed as breaches (30.2%). Wholesale rate leakage produces the most confirmed breaches. Channel manager outage alerts hit every property in a city at once and are never confirmed.
- The risk model is evaluated on a time-based holdout: precision 0.48 and recall 0.34 at 0.5, against a 0.21 base rate. Present it as triage for distribution effort, not a verdict on a property.
- Channel manager outages are excluded from model training, because they are not property-driven.
- This is operational data only. It contains no guest records, no real rates and no pricing advice.

## Business impact

Use only the sourced references in `README.md` (Business Impact).
