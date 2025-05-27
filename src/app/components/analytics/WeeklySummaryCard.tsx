// src/app/components/analytics/WeeklySummaryCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { useData } from '@/providers/DataProvider';
import {
  isFocusSession,
  getSessionDateString,
  getSessionMinutes,
  getSessionActivity,
} from '@/utils/dataConversion';

interface WeeklySummary {
  startDate: string;
  endDate: string;
  totalFocusTime: number;
  totalSessions: number;
  mostProductiveDay: { day: string; minutes: number };
  topCategories: Array<{ name: string; minutes: number }>;
  dailySummaries?: Array<{
    date: string;
    totalMinutes: number;
    sessions: number;
    topCategory?: string;
    accomplishments?: Array<{ text: string; category: string | null }>;
  }>;
  allAccomplishments?: Array<{ text: string; category: string | null }>;
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

// Interface for Supabase session structure
interface SupabaseSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration: number | null;
  category: string | null;
  activity: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export default function WeeklySummaryCard() {
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
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [insights, setInsights] = useState<string | null>(null);

  // Filtering options
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'custom'>(
    'week'
  );
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [availableActivities, setAvailableActivities] = useState<string[]>([]);

  // Get the data provider
  const { getSessions } = useData();

  // Load available activities on component mount
  useEffect(() => {
    async function loadActivities() {
      const sessions = await getSessions();
      const activities = new Set<string>();

      sessions.forEach((session: SupabaseSession) => {
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
    }

    loadActivities();
  }, [getSessions]);

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
  const generateInsightsWithAI = async (
    summaryData: WeeklySummary
  ): Promise<string> => {
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

  function formatSummaryForLLM(summary: WeeklySummary): string {
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
              (acc: { text: string; category: string | null }) =>
                `- ${acc.text}${acc.category ? ` (${acc.category})` : ''}`
            )
            .join('\n')
        : '';

    // Format daily summaries if available
    let dailySummariesText = '';
    if (summary.dailySummaries && summary.dailySummaries.length > 0) {
      dailySummariesText = summary.dailySummaries
        .map(
          (day: { date: string; totalMinutes: number; sessions: number }) => {
            const dayDate = new Date(day.date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            });
            return `${dayDate}: ${day.totalMinutes} minutes across ${day.sessions} sessions`;
          }
        )
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
      .map(
        (c: { name: string; minutes: number }) => `${c.name} (${c.minutes} min)`
      )
      .join(', ')}

${dailySummariesText ? `DAILY BREAKDOWN:\n${dailySummariesText}\n\n` : ''}

${accomplishmentsList ? `ACCOMPLISHMENTS:\n${accomplishmentsList}\n\n` : ''}

  Write:
  1. ONE sentence summary
  2. ONE sentence highlighting user's recorded accomplishments
  3. TWO specific, actionable recommendations
  4. ONE brief encouragement
Make your response personal, specific to the data, and limited to 2-3 paragraphs total.
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

      // Get sessions from DataProvider
      const supabaseSessions = await getSessions();

      // Filter for focus sessions within the date range
      let filteredSessions = supabaseSessions.filter((session) => {
        if (!isFocusSession(session)) return false;

        const sessionDate = new Date(session.start_time);
        return sessionDate >= start && sessionDate <= end;
      });

      // Apply activity filter if any activities are selected
      if (selectedActivities.length > 0) {
        filteredSessions = filteredSessions.filter((session) =>
          selectedActivities.includes(getSessionActivity(session))
        );
      }

      if (filteredSessions.length === 0) {
        setError(
          'No focus sessions found for the selected time period and activities'
        );
        setLoading(false);
        return;
      }

      // Generate a basic summary from the sessions
      const totalFocusTime = Math.round(
        filteredSessions.reduce(
          (sum: number, session) => sum + getSessionMinutes(session),
          0
        )
      );
      const totalSessions = filteredSessions.length;

      // Group by day to find most productive day
      const dayMap = new Map<string, number>();
      filteredSessions.forEach((session) => {
        const dateStr = getSessionDateString(session);
        const minutes = getSessionMinutes(session);
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
      const categoryMap = new Map<string, number>();
      filteredSessions.forEach((session) => {
        const category = getSessionActivity(session);
        const minutes = getSessionMinutes(session);
        categoryMap.set(category, (categoryMap.get(category) || 0) + minutes);
      });

      const topCategories = Array.from(categoryMap.entries())
        .map(([name, minutes]) => ({
          name,
          minutes: Math.round(minutes),
        }))
        .sort((a, b) => b.minutes - a.minutes)
        .slice(0, 3);

      // Get accomplishments if any (Note: this won't work with Supabase sessions as accomplishments are separate)
      const accomplishments: Array<{ text: string; category: string | null }> =
        [];

      // Create daily summaries
      const dailySummaries = Array.from(dayMap).map(([day, minutes]) => ({
        date: day,
        totalMinutes: Math.round(minutes),
        sessions: filteredSessions.filter(
          (s) => getSessionDateString(s) === day
        ).length,
        topCategory: 'Various',
      }));

      // Create a summary object
      const generatedSummary: WeeklySummary = {
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
    <div className="card">
      {/* TEMPORARY: User-visible note that this is a preliminary feature */}
      <div
        className="card--surface card--compact"
        style={{ marginBottom: '1rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            className="priority-badge"
            style={{ backgroundColor: '#f59e0b' }}
          >
            BETA
          </span>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            Weekly insights feature with AI-powered analytics. Limited API calls
            available.
          </p>
        </div>
      </div>

      {/* Filtering controls */}
      <div className="filter-container">
        <h3 className="card__title">Generate Productivity Insights</h3>

        <div
          className="card--surface card--compact"
          style={{ marginBottom: '1rem' }}
        >
          <p>
            <strong>Note:</strong> Generating insights uses the Gemini API and
            counts toward your API usage limit. Choose your time periods
            carefully.
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Time Period:</label>
          <div className="filter-tabs">
            <button
              className={`filter-tab ${
                timeframe === 'week' ? 'filter-tab--active' : ''
              }`}
              onClick={() => setTimeframe('week')}
            >
              This Week
            </button>
            <button
              className={`filter-tab ${
                timeframe === 'month' ? 'filter-tab--active' : ''
              }`}
              onClick={() => setTimeframe('month')}
            >
              This Month
            </button>
            <button
              className={`filter-tab ${
                timeframe === 'custom' ? 'filter-tab--active' : ''
              }`}
              onClick={() => setTimeframe('custom')}
            >
              Custom Range
            </button>
          </div>
        </div>

        {timeframe === 'custom' && (
          <div className="filter-date-range">
            <div className="filter-date-input">
              <label className="form-label" htmlFor="startDate">
                Start Date:
              </label>
              <input
                type="date"
                id="startDate"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="filter-date-input">
              <label className="form-label" htmlFor="endDate">
                End Date:
              </label>
              <input
                type="date"
                id="endDate"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {availableActivities.length > 0 && (
          <div className="form-group">
            <label className="form-label">
              Filter by Activities (optional):
            </label>
            <div className="filter-buttons">
              {availableActivities.map((activity) => (
                <button
                  key={activity}
                  className={`filter-button ${
                    selectedActivities.includes(activity)
                      ? 'filter-button--active'
                      : ''
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
          className="btn btn--primary btn--full"
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
        <div
          className="card--surface"
          style={{ textAlign: 'center', padding: '2rem' }}
        >
          <div
            className="animate-spin"
            style={{
              display: 'inline-block',
              width: '2.5rem',
              height: '2.5rem',
              border: '3px solid var(--gray-alpha-200)',
              borderTopColor: 'var(--color-foreground)',
              borderRadius: '50%',
              marginBottom: '1rem',
            }}
          ></div>
          <p>
            {loading
              ? 'Processing your focus data...'
              : 'Generating AI insights...'}
          </p>
        </div>
      )}

      {error && !loading && !apiLoading && (
        <div
          className="card--surface"
          style={{ textAlign: 'center', padding: '2rem' }}
        >
          <h3 className="card__title">Insights Not Available</h3>
          <p>{error}</p>
          <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
            Try selecting a different time period or complete more focus
            sessions.
          </p>
        </div>
      )}

      {summary && !loading && !apiLoading && !error && (
        <>
          <div className="card__header" style={{ textAlign: 'center' }}>
            <div>
              <h2 className="card__title">Productivity Insights</h2>
              <p className="card__subtitle">
                {formatDate(summary.startDate)} - {formatDate(summary.endDate)}
              </p>
            </div>
          </div>

          <div
            className="card-grid card-grid--stats"
            style={{ marginBottom: '2rem' }}
          >
            <div className="card card--stats">
              <span className="stats-value">{summary.totalFocusTime}</span>
              <span className="stats-label">Minutes Focused</span>
            </div>
            <div className="card card--stats">
              <span className="stats-value">{summary.totalSessions}</span>
              <span className="stats-label">Sessions</span>
            </div>
            <div className="card card--stats">
              <span className="stats-value">
                {summary.mostProductiveDay
                  ? new Date(summary.mostProductiveDay.day).toLocaleDateString(
                      'en-US',
                      { weekday: 'short' }
                    )
                  : 'N/A'}
              </span>
              <span className="stats-label">Best Day</span>
            </div>
          </div>

          {summary.topCategories.length > 0 && (
            <div
              className="card--surface card--compact"
              style={{ marginBottom: '2rem' }}
            >
              <h3 className="card__title">Top Focus Categories</h3>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {summary.topCategories.map((category, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontWeight: '500' }}>{category.name}</span>
                      <span style={{ fontSize: '0.9rem', opacity: '0.8' }}>
                        {category.minutes} min
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            (category.minutes / summary.totalFocusTime) * 100
                          )}%`,
                          backgroundColor:
                            index === 0
                              ? 'var(--color-primary)'
                              : index === 1
                              ? 'var(--color-success)'
                              : 'var(--color-warning)',
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card--surface card--compact">
            {insights ? (
              <>
                <h3 className="card__title">Your Insights</h3>
                <div className="card__body">
                  {insights.split('\n\n').map((paragraph, index) => (
                    <p key={index} style={{ marginBottom: '1rem' }}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>No insights available for this period yet.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
