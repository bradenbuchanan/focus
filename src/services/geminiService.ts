// src/services/geminiService.ts
import { WeeklySummary } from '@/types/analytics';

export async function callGeminiAPI(summary: WeeklySummary): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error('API key not configured');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: formatSummaryForLLM(summary) }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    }
  );

  const data = await response.json();
  if (!data.candidates?.length) {
    throw new Error('No response from Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
}

function formatSummaryForLLM(summary: WeeklySummary): string {
  const startDate = new Date(summary.startDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const endDate = new Date(summary.endDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
You are a productivity coach analyzing a user's focus session data. 
Generate personalized, insightful and encouraging productivity feedback based on the following summary:

FOCUS SUMMARY (${startDate} to ${endDate}):
- Total Focus Time: ${summary.totalFocusTime} minutes
- Total Sessions: ${summary.totalSessions}
- Most Productive Day: ${new Date(summary.mostProductiveDay.day).toLocaleDateString('en-US', { weekday: 'long' })} (${summary.mostProductiveDay.minutes} minutes)
- Top Focus Categories: ${summary.topCategories.map(c => `${c.name} (${c.minutes} min)`).join(', ')}

Write:
1. ONE sentence summary
2. ONE sentence highlighting user's patterns
3. TWO specific, actionable recommendations
4. ONE brief encouragement

Make your response personal, specific to the data, and limited to 2-3 paragraphs total.
`;
}