import { NextResponse } from 'next/server';
import { executeQuery, callCortexComplete, callCortexAnalyst } from '@/lib/snowflake';

export async function POST(request: Request) {
  try {
    const { question, mode } = await request.json();

    if (mode === 'sql') {
      // Use Cortex Analyst via Semantic View
      const result = await callCortexAnalyst(
        'TOURISM_REVENUE.APP.REVENUE_MANAGEMENT_ANALYTICS',
        question
      );
      return NextResponse.json({
        answer: result.answer,
        sql: result.sql,
      });
    } else {
      // Use Cortex Complete for strategic advice
      const prompt = `You are the Revenue Intelligence Agent for 120 Thai resort properties across Phuket, Koh Samui, Bangkok, and Chiang Mai. 
      
Answer this revenue management question concisely with specific recommendations:
${question}

Context: Portfolio RevPAR is 7% below competitive set average. Demand surge from Chinese market predicted for Phuket (+23% next 30 days). 34 properties currently underpriced vs OTA market.`;

      const answer = await callCortexComplete('claude-3-5-sonnet', prompt);
      return NextResponse.json({ answer });
    }
  } catch (error: any) {
    console.error('Ask AI error:', error.message);
    return NextResponse.json({
      answer: `[Demo Mode] Unable to reach Cortex Agent. Deploy to SPCS with Snowflake credentials for live responses. Error: ${error.message}`,
    });
  }
}
