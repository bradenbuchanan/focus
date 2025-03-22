// src/app/components/analytics/WeeklySummaryCard.tsx
'use client';

import { useState, useEffect } from 'react';
import styles from './weeklySummary.module.css';
import { getSessions } from '@/lib/timer'; // Import localStorage function

interface WeeklySummaryProps {
  userId: string;
}

// Interface for interacting with Gemini API
interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

export default function WeeklySummaryCard({ userId }: WeeklySummaryProps) {
  // ====================================================
  // NOTE: This is a temporary implementation that uses localStorage data
  // In the future, this will be replaced with data from the database API
  // Current limitations:
  // - Limited analysis capabilities (no pattern detection)
  // - AI-generated insights via Gemini API
  // - Basic statistics only
  // ====================================================

  const [loading, setLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [insights, setInsights] = useState<string | null>(null);

  // Filtering options
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'custom'>(
    'week'
  );
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [availableActivities, setAvailableActivities] = useState<string[]>([]);

  // Load available activities on component mount
  useEffect(() => {
    const sessions = getSessions();
    const activities = new Set<string>();

    sessions.forEach((session) => {
      if (session.activity) {
        activities.add(session.activity);
      }
    });

    setAvailableActivities(Array.from(activities));

    // Set default date ranges
    const today = new Date();

    // Set default week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(today);
    if (today.getDay() === 0) {
      // If today is Sunday
      endOfWeek.setHours(23, 59, 59, 999);
    } else {
      endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
      endOfWeek.setHours(23, 59, 59, 999);
    }

    setStartDate(startOfWeek.toISOString().split('T')[0]);
    setEndDate(endOfWeek.toISOString().split('T')[0]);
  }, []);

  const handleActivityToggle = (activity: string) => {
    setSelectedActivities((prev) => {
      if (prev.includes(activity)) {
        return prev.filter((a) => a !== activity);
      } else {
        return [...prev, activity];
      }
    });
  };

  // Function to call Gemini API directly
  // Function to call Gemini API directly
  const generateInsightsWithAI = async (summaryData: any): Promise<string> => {
    // Make sure you have an API key
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      console.error('Gemini API key not found');
      throw new Error('API key not configured');
    }

    try {
      // Format the data for the LLM
      const prompt = formatSummaryForLLM(summaryData);

      console.log(
        'Calling Gemini API with key:',
        apiKey.substring(0, 5) + '...'
      );

      // Use the correct model and endpoint from your curl example
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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

      // Add detailed response logging
      console.log('API Response Status:', response.status);
      console.log('API Response Status Text:', response.statusText);

      const data = (await response.json()) as GeminiResponse;
      console.log('API Response Data:', data);

      if (!data.candidates || data.candidates.length === 0) {
        console.error('No candidates in response:', data);
        throw new Error('No response from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  };

  function formatSummaryForLLM(summary: any): string {
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    // Format the start and end dates
    const startDate = new Date(summary.startDate).toLocaleDateString(
      'en-US',
      dateOptions
    );
    const endDate = new Date(summary.endDate).toLocaleDateString(
      'en-US',
      dateOptions
    );

    // Format accomplishments
    const accomplishmentsList =
      summary.allAccomplishments && summary.allAccomplishments.length > 0
        ? summary.allAccomplishments
            .map(
              (acc: any) =>
                `- ${acc.text}${acc.category ? ` (${acc.category})` : ''}`
            )
            .join('\n')
        : '';

    // Format daily summaries if available
    let dailySummariesText = '';
    if (summary.dailySummaries && summary.dailySummaries.length > 0) {
      dailySummariesText = summary.dailySummaries
        .map((day: any) => {
          const dayDate = new Date(day.date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          });
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
- Most Productive Day: ${new Date(
      summary.mostProductiveDay.day
    ).toLocaleDateString('en-US', { weekday: 'long' })} (${
      summary.mostProductiveDay.minutes
    } minutes)
- Top Focus Categories: ${summary.topCategories
      .map((c: any) => `${c.name} (${c.minutes} min)`)
      .join(', ')}

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

  const generateSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get date range based on timeframe
      let start: Date;
      let end: Date;

      const today = new Date();

      if (timeframe === 'week') {
        // Set to start of current week (Sunday)
        start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        start.setHours(0, 0, 0, 0);

        // Set to end of current week (Saturday)
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      } else if (timeframe === 'month') {
        // Set to start of current month
        start = new Date(today.getFullYear(), today.getMonth(), 1);

        // Set to end of current month
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
      } else {
        // Custom timeframe - use selected dates
        start = new Date(startDate);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      }

      // TEMPORARY: Use localStorage data to create a summary
      const localSessions = getSessions();

      // Filter for focus sessions within the date range
      let filteredSessions = localSessions.filter((session) => {
        const sessionDate = new Date(session.date);
        return (
          sessionDate >= start && sessionDate <= end && session.type === 'focus'
        );
      });

      // Apply activity filter if any activities are selected
      if (selectedActivities.length > 0) {
        filteredSessions = filteredSessions.filter((session) =>
          selectedActivities.includes(session.activity || 'Other')
        );
      }

      if (filteredSessions.length === 0) {
        setError(
          'No focus sessions found for the selected time period and activities'
        );
        setLoading(false);
        return;
      }

      // TEMPORARY: Generate a basic summary from localStorage data
      const totalFocusTime = Math.round(
        filteredSessions.reduce(
          (sum, session) => sum + session.duration / 60,
          0
        )
      );
      const totalSessions = filteredSessions.length;

      // Group by day to find most productive day
      const dayMap = new Map();
      filteredSessions.forEach((session) => {
        const dateStr = session.localDate || session.date.split('T')[0];
        const minutes = session.duration / 60;
        dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + minutes);
      });

      // Find most productive day
      let mostProductiveDay = {
        day: today.toISOString().split('T')[0],
        minutes: 0,
      };
      dayMap.forEach((minutes, day) => {
        if (minutes > mostProductiveDay.minutes) {
          mostProductiveDay = { day, minutes: Math.round(minutes) };
        }
      });

      // Group activities to find top categories
      const categoryMap = new Map();
      filteredSessions.forEach((session) => {
        const category = session.activity || 'Other';
        const minutes = session.duration / 60;
        categoryMap.set(category, (categoryMap.get(category) || 0) + minutes);
      });

      const topCategories = Array.from(categoryMap.entries())
        .map(([name, minutes]) => ({
          name,
          minutes: Math.round(minutes as number),
        }))
        .sort((a, b) => b.minutes - a.minutes)
        .slice(0, 3);

      // Get accomplishments if any
      const accomplishments = filteredSessions
        .filter((session) => session.accomplishment)
        .map((session) => ({
          text: session.accomplishment || '',
          category: session.accomplishmentCategory || null,
        }));

      // Create daily summaries
      const dailySummaries = Array.from(dayMap).map(([day, minutes]) => ({
        date: day,
        totalMinutes: Math.round(minutes as number),
        sessions: filteredSessions.filter(
          (s) => (s.localDate || s.date.split('T')[0]) === day
        ).length,
        topCategory: 'Various',
      }));

      // Create a summary object
      const generatedSummary = {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        totalFocusTime,
        totalSessions,
        mostProductiveDay,
        topCategories,
        dailySummaries,
        allAccomplishments: accomplishments,
      };

      setSummary(generatedSummary);
      setLoading(false);

      // Format time period for basic fallback insights if needed
      let periodText;
      if (timeframe === 'week') {
        periodText = 'this week';
      } else if (timeframe === 'month') {
        periodText = 'this month';
      } else {
        periodText = `from ${new Date(
          startDate
        ).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
      }

      // Format activities for the insights text
      let activitiesText = '';
      if (selectedActivities.length === 1) {
        activitiesText = ` focusing on ${selectedActivities[0]}`;
      } else if (selectedActivities.length > 1) {
        activitiesText = ` focusing on ${selectedActivities.join(', ')}`;
      }

      // Generate AI insights using Gemini
      setApiLoading(true);
      try {
        const aiInsights = await generateInsightsWithAI(generatedSummary);
        setInsights(aiInsights);
      } catch (error) {
        console.error('Error generating AI insights:', error);

        // Fall back to basic insights if the API call fails
        const basicInsight = `You've completed ${totalSessions} focus sessions ${periodText}${activitiesText}, totaling ${totalFocusTime} minutes. Your most productive day was ${new Date(
          mostProductiveDay.day
        ).toLocaleDateString('en-US', { weekday: 'long' })} with ${
          mostProductiveDay.minutes
        } minutes of focus time.

${
  topCategories.length > 0
    ? `Your top focus categories were ${topCategories
        .map((c) => `${c.name} (${c.minutes} min)`)
        .join(', ')}.`
    : ''
}

${
  accomplishments.length > 0
    ? `You've recorded ${accomplishments.length} accomplishments during this period. Keep up the good work!`
    : 'Consider recording your accomplishments after focus sessions to track your progress better.'
}`;

        setInsights(basicInsight);
      } finally {
        setApiLoading(false);
      }
    } catch (err) {
      setError('Failed to generate insights');
      console.error(err);
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className={styles.summaryCard}>
      {/* TEMPORARY: User-visible note that this is a preliminary feature */}
      <div className={styles.betaIndicator}>
        <span>BETA</span>
        <p>
          Weekly insights feature with AI-powered analytics. Limited API calls
          available.
        </p>
      </div>

      {/* Filtering controls */}
      <div className={styles.filterControls}>
        <h3>Generate Productivity Insights</h3>

        <div className={styles.apiInfo}>
          <p>
            <strong>Note:</strong> Generating insights uses the Gemini API and
            counts toward your API usage limit. Choose your time periods
            carefully.
          </p>
        </div>

        <div className={styles.timeframeSelector}>
          <label>Time Period:</label>
          <div className={styles.timeframeButtons}>
            <button
              className={`${styles.timeframeButton} ${
                timeframe === 'week' ? styles.active : ''
              }`}
              onClick={() => setTimeframe('week')}
            >
              This Week
            </button>
            <button
              className={`${styles.timeframeButton} ${
                timeframe === 'month' ? styles.active : ''
              }`}
              onClick={() => setTimeframe('month')}
            >
              This Month
            </button>
            <button
              className={`${styles.timeframeButton} ${
                timeframe === 'custom' ? styles.active : ''
              }`}
              onClick={() => setTimeframe('custom')}
            >
              Custom Range
            </button>
          </div>
        </div>

        {timeframe === 'custom' && (
          <div className={styles.dateRangePicker}>
            <div className={styles.dateInput}>
              <label htmlFor="startDate">Start Date:</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className={styles.dateInput}>
              <label htmlFor="endDate">End Date:</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {availableActivities.length > 0 && (
          <div className={styles.activitySelector}>
            <label>Filter by Activities (optional):</label>
            <div className={styles.activityButtons}>
              {availableActivities.map((activity) => (
                <button
                  key={activity}
                  className={`${styles.activityButton} ${
                    selectedActivities.includes(activity) ? styles.active : ''
                  }`}
                  onClick={() => handleActivityToggle(activity)}
                >
                  {activity}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          className={styles.generateButton}
          onClick={generateSummary}
          disabled={loading || apiLoading}
        >
          {loading
            ? 'Processing Data...'
            : apiLoading
            ? 'Generating AI Insights...'
            : 'Generate Insights'}
        </button>
      </div>

      {(loading || apiLoading) && (
        <div className={styles.loadingIndicator}>
          <div className={styles.spinner}></div>
          <p>
            {loading
              ? 'Processing your focus data...'
              : 'Generating AI insights...'}
          </p>
        </div>
      )}

      {error && !loading && !apiLoading && (
        <div className={styles.noDataMessage}>
          <h3>Insights Not Available</h3>
          <p>{error}</p>
          <p className={styles.suggestion}>
            Try selecting a different time period or complete more focus
            sessions.
          </p>
        </div>
      )}

      {summary && !loading && !apiLoading && !error && (
        <>
          <div className={styles.summaryHeader}>
            <h2>Productivity Insights</h2>
            <p className={styles.dateRange}>
              {formatDate(summary.startDate)} - {formatDate(summary.endDate)}
            </p>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{summary.totalFocusTime}</span>
              <span className={styles.statLabel}>Minutes Focused</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{summary.totalSessions}</span>
              <span className={styles.statLabel}>Sessions</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue}>
                {summary.mostProductiveDay
                  ? new Date(summary.mostProductiveDay.day).toLocaleDateString(
                      'en-US',
                      { weekday: 'short' }
                    )
                  : 'N/A'}
              </span>
              <span className={styles.statLabel}>Best Day</span>
            </div>
          </div>

          {summary.topCategories.length > 0 && (
            <div className={styles.topCategories}>
              <h3>Top Focus Categories</h3>
              <div className={styles.categoryBars}>
                {summary.topCategories.map((category: any, index: number) => (
                  <div key={index} className={styles.categoryBar}>
                    <div className={styles.categoryName}>{category.name}</div>
                    <div className={styles.categoryBarContainer}>
                      <div
                        className={styles.categoryBarFill}
                        style={{
                          width: `${Math.min(
                            100,
                            (category.minutes / summary.totalFocusTime) * 100
                          )}%`,
                          backgroundColor:
                            index === 0
                              ? 'var(--primary-color)'
                              : index === 1
                              ? 'var(--secondary-color)'
                              : 'var(--tertiary-color)',
                        }}
                      ></div>
                    </div>
                    <div className={styles.categoryMinutes}>
                      {category.minutes} min
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.insightsContainer}>
            {insights ? (
              <>
                <h3>Your Insights</h3>
                <div className={styles.insights}>
                  {insights.split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.noInsights}>
                <p>No insights available for this period yet.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
