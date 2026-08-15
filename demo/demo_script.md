# Demo Script: Revenue Management & Dynamic Pricing
## ~4-Minute Recorded Walkthrough
**Format**: Screen recording with voiceover
**Target**: Customer meeting / booth loop / social share
**Narrative**: "Snowflake forecasts demand by source market, optimizes room rates dynamically, and automates revenue decisions — replacing fragmented RMS tools with unified ML-native pricing intelligence"
**Demo Mode**: Open app with `?demo=true` for presenter notes

---

## Two Personas

| Persona | Role | Tool | What they care about |
|---|---|---|---|
| **Siriporn Chaiyaporn** | VP Revenue & Distribution | React App (SPCS) | RevPAR performance, rate competitiveness, demand forecasting accuracy, channel mix |
| **Rattanachai Wutthisak** | Revenue Manager | Amazon QuickSight | Daily rate optimization, booking pace, length-of-stay patterns, OTA commission costs |

---

## What's Built

| Layer | Component | Detail |
|---|---|---|
| **RAW** | 8 tables | PROPERTIES (120), RESERVATIONS (250000), OTA_RATE_FEEDS (500000), DEMAND_SIGNALS (180000), REVENUE_ACTUALS (43800), COMPETITIVE_SET (600), FLIGHT_CAPACITY (3000), THAI_TOURISM_STATS (12) |
| **CURATED** | 4 Dynamic Tables | PROPERTY_REVPAR, DEMAND_TIMESERIES, RATE_RECOMMENDATIONS, BOOKING_PACE |
| **ML** | ML.FORECAST + ML.ANOMALY_DETECTION | Forecasting + anomaly detection |
| **AI** | COMPLETE, AI_CLASSIFY, AI_EXTRACT | Classification + extraction |
| **Search** | Cortex Search | 600 documents indexed |
| **Agent** | REVENUE_INTELLIGENCE_AGENT | Semantic View + Search tools |


---

## The Story

Thailand's tourism revenue management is fragmented — 120 resort properties across 4 destinations use disconnected RMS tools while leaving ฿180M annually on the table. Real-time OTA feeds, ML demand forecasting by source market, and automated pricing via Snowflake Tasks close the gap.

---

## Script

### [0:00–0:45] EXECUTIVE COCKPIT

**Show**: Executive Cockpit tab

> "Portfolio RevPAR at ฿4,850 — 7% below competitive set average of ฿5,210."

**Action**: Point at RevPAR vs comp set gauge

### [0:45–1:30] DEMAND FORECASTING

**Show**: Demand Forecasting tab

> "ML.FORECAST predicts 23% demand increase for Phuket in the next 30 days — driven by Chinese Golden Week."

**Action**: Show demand forecast chart with confidence bands

### [1:30–2:15] DYNAMIC PRICING

**Show**: Dynamic Pricing tab

> "Real-time competitive positioning — our rates vs Agoda, Booking, and Expedia."

**Action**: Show rate positioning matrix

### [2:15–3:00] ASK AI

**Show**: Ask AI tab

> "Siriporn asks: 'Which properties should increase rates this week and by how much?'"

**Action**: Type: 'Properties that should increase rates this week'

### [3:00–3:45] ARCHITECTURE & DATA

**Show**: Architecture & Data tab

> "Seven Snowflake capabilities, six AWS services."

**Action**: Walk through architecture diagram


---

## Key Demo Differentiators

1. **ML.FORECAST for demand by source market** — Only demo forecasting tourism demand at property × source-market granularity
2. **EventBridge → Tasks for automated rate push** — End-to-end automated pricing pipeline from demand signal to rate change
3. **Kinesis streaming OTA competitive rates** — Real-time competitive rate monitoring from 3 major OTAs
4. **Thai tourism destination context** — 120 properties across Phuket, Koh Samui, Bangkok, Chiang Mai with realistic seasonal patterns
5. **Chinese market recovery tracking** — Source market demand decomposition with flight capacity correlation
6. **RevPAR competitive index via Dynamic Tables** — Real-time RevPAR benchmarking against 5-property competitive sets


---

## Demo Prep Checklist

### Data Verification
- [ ] `SELECT COUNT(*) FROM TOURISM_REVENUE.RAW.RESERVATIONS` → 250000
- [ ] `SELECT COUNT(*) FROM TOURISM_REVENUE.RAW.OTA_RATE_FEEDS` → 500000
- [ ] `SELECT COUNT(*) FROM TOURISM_REVENUE.CURATED.PROPERTY_REVPAR WHERE REVPAR_INDEX < 90` → >20

### ML Model Verification
- [ ] `SELECT COUNT(*) FROM TOURISM_REVENUE.ML.DEMAND_FORECAST_RESULTS` → >0
- [ ] `SELECT COUNT(DISTINCT PROPERTY_MARKET) FROM TOURISM_REVENUE.ML.DEMAND_FORECAST_RESULTS` → >=50

### AI/Agent Verification
- [ ] `SELECT COUNT(*) FROM TOURISM_REVENUE.AI.RATE_RECOMMENDATIONS` → >500

