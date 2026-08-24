import { NextResponse } from 'next/server';
import { executeQuery, callCortexComplete, callCortexAnalyst } from '@/lib/snowflake';

// Keywords that signal a data/SQL question (route to Cortex Analyst)
const DATA_SIGNALS = [
  'how many', 'how much', 'total', 'average', 'sum', 'count', 'revenue',
  'revpar', 'adr', 'occupancy rate', 'top', 'bottom', 'compare',
  'which properties', 'which hotels', 'show me', 'list', 'breakdown',
  'by month', 'by region', 'by property', 'trend', 'last month',
  'year over year', 'yoy', 'forecast number', 'bookings', 'nights',
];

function shouldUseAnalyst(question: string): boolean {
  const lower = question.toLowerCase();
  const matchCount = DATA_SIGNALS.filter((s) => lower.includes(s)).length;
  // If 2+ data signals or starts with data-oriented phrasing, use analyst
  if (matchCount >= 2) return true;
  if (/^(how many|how much|what is the|what are the|show me|list|which)/.test(lower)) return true;
  return false;
}

export async function POST(request: Request) {
  try {
    const { question } = await request.json();

    const useAnalyst = shouldUseAnalyst(question);

    if (useAnalyst) {
      // Route to Cortex Analyst via Semantic View for data queries
      const result = await callCortexAnalyst(
        'TOURISM_REVENUE.APP.REVENUE_MANAGEMENT_ANALYTICS',
        question
      );
      return NextResponse.json({
        answer: result.answer,
        sql: result.sql,
        source: 'Cortex Analyst',
      });
    } else {
      // Route to Cortex Complete for strategy/advice questions
      const prompt = `You are the Revenue Intelligence Agent for 120 Thai resort properties across Phuket, Koh Samui, Bangkok, and Chiang Mai. 
      
Answer this revenue management question concisely with specific, actionable recommendations:
${question}

Context: Portfolio RevPAR is 7% below competitive set average. Demand surge from Chinese market predicted for Phuket (+23% next 30 days). 34 properties currently underpriced vs OTA market. High-season shoulder period approaching.`;

      const answer = await callCortexComplete('claude-3-5-sonnet', prompt);
      return NextResponse.json({
        answer,
        source: 'Cortex Search & Complete',
      });
    }
  } catch (error: any) {
    console.error('Ask AI error:', error.message);
    return NextResponse.json({
      answer: `[Demo Mode] Unable to reach Cortex Agent. Deploy to SPCS with Snowflake credentials for live responses. Error: ${error.message}`,
    });
  }
}
