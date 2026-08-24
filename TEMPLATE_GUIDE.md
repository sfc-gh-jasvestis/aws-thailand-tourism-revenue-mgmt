# Template Replication Guide

This repo (`aws-thailand-tourism-revenue-mgmt`) is the **golden template** for all SEA country industry demos. Use this guide to clone the pattern for another country/industry.

## Quick Start: Clone for a New Demo

```bash
# 1. Copy template
cp -r aws-thailand-tourism-revenue-mgmt aws-{country}-{industry}-{use-case}
cd aws-{country}-{industry}-{use-case}

# 2. Run find-and-replace for the core variables (see table below)
# 3. Customize the domain-specific content (tables, DT logic, page.tsx)
# 4. Generate data and deploy
```

## Variables to Replace

| Variable | Thailand Tourism Example | Replace With |
|----------|--------------------------|--------------|
| `TOURISM_REVENUE` | Database name | Your database (e.g. `PALM_OIL_TRADING`) |
| `TOURISM_WH` | Warehouse name | Your warehouse (e.g. `TRADING_WH`) |
| `aws-thailand-tourism-revenue-mgmt` | Repo/service name | Your repo name |
| `aws_thailand_tourism_revenue_mgmt` | Integration naming (underscores) | Your integration prefix |
| `Revenue Management & Dynamic Pricing` | Demo title | Your demo title |
| `REVENUE_INTELLIGENCE_AGENT` | Agent name | Your agent name |
| `REVENUE_MANAGEMENT_ANALYTICS` | Semantic view name | Your semantic view |
| `REVENUE_STRATEGY_SEARCH` | Search service name | Your search service |
| Persona names | Siriporn, Rattanachai | Country-appropriate names |
| Destinations | Phuket, Koh Samui, Bangkok, Chiang Mai | Domain locations |

## File-by-File Customization

### `snowflake/02_raw_tables.sql`
- Replace table definitions with your domain entities
- Keep the pattern: typed columns, VARCHAR IDs, FLOAT for metrics, DATE for time

### `snowflake/04_dynamic_tables.sql`
- Design your curated aggregations
- Pattern: 3-4 Dynamic Tables, each JOINing 2+ raw tables
- Always include a "performance" table (like PROPERTY_REVPAR) and a "timeseries" table (for ML.FORECAST)

### `snowflake/05_search.sql`
- Create a text table with `CONTENT` column for Cortex Search
- Add 3-5 `ATTRIBUTES` for filtering

### `snowflake/06_ml_models.sql`
- ML.FORECAST needs: SERIES_COLNAME (category), TIMESTAMP_COLNAME (date), TARGET_COLNAME (metric)
- ML.ANOMALY_DETECTION needs the same three columns
- Ensure these columns exist in your CURATED Dynamic Tables

### `snowflake/07_semantic_view.sql`
- Reference your CURATED tables
- Define 6-8 METRICS (aggregations), 5-7 DIMENSIONS (grouping), 2-3 FILTERS

### `snowflake/09_aws_integration.sql`
- Update database/schema references
- Change S3 path in `STORAGE_ALLOWED_LOCATIONS`
- Update Kinesis stream ARN
- Update SNS topic ARN
- Keep Bedrock region as `ap-southeast-1`

### `app/src/app/page.tsx`
- Tab 1: Domain KPIs (4 cards) + trend chart + breakdown chart + at-risk table
- Tab 2: Secondary analytics (demand/pace/forecast equivalent)
- Tab 3: Action/recommendation tab (with ActionMemo)
- Tab 4: Ask AI (update sample questions)
- Tab 5: Architecture (update feature/AWS lists)

### `app/src/app/api/data/route.ts`
- Write 5-8 SQL queries against your CURATED tables
- Include fallback demo data for offline mode

### `scripts/generate_data.py`
- Define your domain entities and relationships
- Generate data proportional to README claims (e.g. "250K records")
- Use realistic distributions (seasonal, geographic, etc.)

## Architecture Pattern (Consistent Across All Repos)

```
RAW Tables (typed, columnar)
    ↓ Dynamic Tables (5-min lag)
CURATED Layer (analytics-ready)
    ↓ ML.FORECAST + ML.ANOMALY_DETECTION
ML Results
    ↓ Cortex Agent (Semantic View + Search)
APP Layer (React on SPCS)
    ↓ AWS Integration (Bedrock, S3, SNS, Kinesis)
External Services
```

## AWS Services Selection Guide

| Use Case | AWS Service | Snowflake Equivalent |
|----------|-------------|---------------------|
| Real-time streaming | Amazon Kinesis | Snowpipe Streaming SDK |
| Batch landing zone | Amazon S3 | Internal Stage |
| ML training | Amazon SageMaker | ML.FORECAST / ML.ANOMALY_DETECTION |
| Event-driven triggers | Amazon EventBridge | Tasks + Streams |
| LLM generation | Amazon Bedrock (Claude) | Cortex Complete |
| Notifications | Amazon SNS | Alerts + Notification Integration |
| BI Dashboard | Amazon QuickSight + Q | Snowflake Intelligence |
| IoT ingestion | AWS IoT Core | Snowpipe Streaming SDK |
| ETL | AWS Glue | Dynamic Tables |
| Data sharing | Apache Iceberg (S3) | Snowflake-managed Iceberg Tables |

## Deployment Checklist

- [ ] Run `snowflake/00_setup.sql` through `08_agent.sql`
- [ ] Run `python scripts/generate_data.py`
- [ ] Verify Dynamic Tables refresh: `SELECT COUNT(*) FROM CURATED.*`
- [ ] (Optional) Run `snowflake/09_aws_integration.sql` for AWS mode
- [ ] Build and push Docker image: `cd app && npm ci && npm run build && docker build/push`
- [ ] Create SPCS service and verify app loads
- [ ] Test Ask AI tab with sample questions
- [ ] Open with `?demo=true` for presenter mode
