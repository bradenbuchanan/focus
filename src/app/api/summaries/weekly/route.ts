// src/app/api/summaries/weekly/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateUserWeeklySummary } from '@/lib/aggregation-service';
import { generateInsightsFromData } from '@/lib/llm-service';

// Simple server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export async function GET() {
  try {
    // Authenticate user with Supabase
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }
    
    // Get user's weekly summary data
    const weeklySummary = await generateUserWeeklySummary(user.id);
    
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