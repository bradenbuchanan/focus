// src/app/api/summaries/weekly/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { generateUserWeeklySummary } from '@/lib/aggregation-service';
import { generateInsightsFromData } from '@/lib/llm-service';

export async function GET() {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }
    
    // Get user's weekly summary data
    const weeklySummary = await generateUserWeeklySummary(session.user.id);
    
    if (!weeklySummary) {
      return NextResponse.json({ 
        success: false, 
        message: 'No focus sessions found for this week' 
      });
    }
    
    // Generate insights using the LLM
    const insights = await generateInsightsFromData(weeklySummary);
    
    // Return the summary and insights
    return NextResponse.json({
      success: true,
      summary: weeklySummary,
      insights
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}