-- ============================================================================
-- 08_AGENT.SQL — Cortex Agent for Revenue Management & Dynamic Pricing
-- ============================================================================
USE DATABASE TOURISM_REVENUE;
USE SCHEMA APP;

CREATE OR REPLACE CORTEX AGENT APP.REVENUE_INTELLIGENCE_AGENT
  COMMENT = 'Revenue Management & Dynamic Pricing AI Assistant'
  MODEL = 'claude-opus-4-8'
  TOOLS = (
    SEMANTIC_VIEW_TOOL(SEMANTIC_VIEW => 'TOURISM_REVENUE.APP.REVENUE_MANAGEMENT_ANALYTICS'),    CORTEX_SEARCH_TOOL(CORTEX_SEARCH_SERVICE => 'TOURISM_REVENUE.SEARCH.REVENUE_STRATEGY_SEARCH', TOOL_DESCRIPTION => 'Search documents for Tourism & Hospitality information')
  )
  SYSTEM_PROMPT = 'You are the Revenue Intelligence Agent for 120 Thai resort properties across Phuket, Koh Samui, Bangkok, and Chiang Mai.';
