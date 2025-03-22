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
    // Format dates
    const startDate = new Date(summary.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endDate = new Date(summary.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Format accomplishments
    const accomplishmentsList = summary.allAccomplishments
      .map(acc => `- ${acc.text}${acc.category ? ` (${acc.category})` : ''}`)
      .join('\n');
    
    // Build the prompt
    return `
  Generate an ultra-concise productivity analysis (max 150 words total):
  
  SUMMARY (${startDate}-${endDate}):
  - Focus: ${summary.totalFocusTime} min, ${summary.totalSessions} sessions
  - Top day: ${new Date(summary.mostProductiveDay.day).toLocaleDateString('en-US', {weekday: 'short'})} (${summary.mostProductiveDay.minutes} min)
  - Categories: ${summary.topCategories.map(c => `${c.name} (${c.minutes})`).join(', ')}
  
  ACCOMPLISHMENTS:
  ${accomplishmentsList || "None recorded"}
  
  Write:
  1. ONE sentence summary
  2. ONE sentence highlighting user's recorded accomplishments
  3. TWO specific, actionable recommendations
  4. ONE brief encouragement
  
  Be direct, specific, and actionable.
  `;
  }