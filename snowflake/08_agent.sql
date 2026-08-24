-- ============================================================================
-- 08_AGENT.SQL — Cortex Agent for Revenue Management & Dynamic Pricing
-- NOTE: CREATE CORTEX AGENT DDL requires the feature to be enabled on your account.
-- If not available, use Snowflake Intelligence UI to create the agent manually.
-- ============================================================================
USE DATABASE TOURISM_REVENUE;
USE SCHEMA APP;

-- Cortex Agent (requires agent DDL feature - may not be available on all accounts)
-- If this fails, create via Snowflake Intelligence UI with these settings:
--   Name: REVENUE_INTELLIGENCE_AGENT
--   Model: claude-3-5-sonnet
--   Tools: Semantic View (TOURISM_REVENUE.APP.REVENUE_MANAGEMENT_ANALYTICS)
--          Cortex Search (TOURISM_REVENUE.SEARCH.REVENUE_STRATEGY_SEARCH)
--   System Prompt: (see below)

CREATE OR REPLACE CORTEX AGENT APP.REVENUE_INTELLIGENCE_AGENT
  COMMENT = 'Revenue Management & Dynamic Pricing AI Assistant'
  MODEL = 'claude-3-5-sonnet'
  TOOLS = (
    SEMANTIC_VIEW_TOOL(SEMANTIC_VIEW => 'TOURISM_REVENUE.APP.REVENUE_MANAGEMENT_ANALYTICS'),
    CORTEX_SEARCH_TOOL(CORTEX_SEARCH_SERVICE => 'TOURISM_REVENUE.SEARCH.REVENUE_STRATEGY_SEARCH', TOOL_DESCRIPTION => 'Search strategy documents for revenue management, pricing, and market intelligence')
  )
  SYSTEM_PROMPT = 'You are the Revenue Intelligence Agent for 120 Thai resort properties across Phuket, Koh Samui, Bangkok, and Chiang Mai. Help revenue managers optimize pricing, understand demand patterns, and improve competitive positioning.';
