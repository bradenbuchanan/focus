// src/lib/llm-service.ts

interface WeeklySummary {
    startDate: string;
    endDate: string;
    totalFocusTime: number;
    totalSessions: number;
    mostProductiveDay: { day: string; minutes: number };
    topCategories: { name: string; minutes: number }[];
    dailySummaries: any[];
    allAccomplishments: { text: string; category: string | null }[];
  }
  
  interface GeminiResponse {
    candidates: {
      content: {
        parts: {
          text: string;
        }[];
      };
    }[];
  }
  
  export async function generateInsightsFromData(
    summary: WeeklySummary
  ): Promise<string> {
    // Make sure you have an API key
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('Gemini API key not found');
      throw new Error('API key not configured');
    }
    
    try {
      // Format the data for the LLM
      const prompt = formatSummaryForLLM(summary);
      
      // Call the Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        }
      );
      
      const data = await response.json() as GeminiResponse;
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }
      
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }
  
  function formatSummaryForLLM(summary: WeeklySummary): string {
    const dateOptions: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    // Format the start and end dates
    const startDate = new Date(summary.startDate).toLocaleDateString('en-US', dateOptions);
    const endDate = new Date(summary.endDate).toLocaleDateString('en-US', dateOptions);
    
    // Format accomplishments
    const accomplishmentsList = summary.allAccomplishments
      .map(acc => `- ${acc.text}${acc.category ? ` (${acc.category})` : ''}`)
      .join('\n');
    
    // Format daily summaries if available
    let dailySummariesText = '';
    if (summary.dailySummaries && summary.dailySummaries.length > 0) {
      dailySummariesText = summary.dailySummaries
        .map(day => {
          const dayDate = new Date(day.date).toLocaleDateString('en-US', 
            { weekday: 'long', month: 'short', day: 'numeric' });
          return `${dayDate}: ${day.totalMinutes} minutes across ${day.sessions} sessions`;
        })
        .join('\n');
    }
    
    // Build the prompt
    return `
  You are a productivity coach analyzing a user's focus session data. 
  Generate personalized, insightful and encouraging productivity feedback based on the following summary:
  
  FOCUS SUMMARY (${startDate} to ${endDate}):
  - Total Focus Time: ${summary.totalFocusTime} minutes
  - Total Sessions: ${summary.totalSessions}
  - Most Productive Day: ${new Date(summary.mostProductiveDay.day).toLocaleDateString('en-US', { weekday: 'long' })} (${summary.mostProductiveDay.minutes} minutes)
  - Top Focus Categories: ${summary.topCategories.map(c => `${c.name} (${c.minutes} min)`).join(', ')}
  
  ${dailySummariesText ? `DAILY BREAKDOWN:\n${dailySummariesText}\n\n` : ''}
  
  ${accomplishmentsList ? `ACCOMPLISHMENTS:\n${accomplishmentsList}\n\n` : ''}
  
  Based on this data, please:
  1. Provide a concise summary of the user's productive period (2-3 sentences)
  2. Highlight 2-3 specific achievements or positive patterns
  3. Suggest 1-2 actionable tips to improve focus or productivity
  4. Offer encouragement for the upcoming week
  
  Make your response personal, specific to the data, and limited to 4-5 paragraphs total.
  `;
  }