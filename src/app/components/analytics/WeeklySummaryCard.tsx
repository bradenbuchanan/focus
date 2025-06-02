// src/app/components/analytics/WeeklySummaryCard.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useData } from '@/providers/DataProvider';
import { WeeklySummaryFilters } from './WeeklySummaryFilters';
import { WeeklySummaryStats } from './WeeklySummaryStats';
import { WeeklySummaryInsights } from './WeeklySummaryInsights';
import { generateWeeklySummary } from '@/utils/summaryGenerator';
import { callGeminiAPI } from '@/services/geminiService';
import type { WeeklySummary, TimeFrame } from '../../../types/analytics';

export default function WeeklySummaryCard() {
  const [loading, setLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [insights, setInsights] = useState<string | null>(null);
  const [availableActivities, setAvailableActivities] = useState<string[]>([]);

  // Filtering options
  const [timeframe, setTimeframe] = useState<TimeFrame>('week');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  const { getSessions } = useData();

  // Initialize date range and load activities
  useEffect(() => {
    async function initialize() {
      // Set date range
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      setDateRange({
        start: startOfWeek.toISOString().split('T')[0],
        end: endOfWeek.toISOString().split('T')[0],
      });

      // Load activities
      const sessions = await getSessions();
      const activities = sessions
        .map((s) => s.activity)
        .filter(
          (activity) => activity !== null && activity !== undefined
        ) as string[];
      const uniqueActivities = [...new Set(activities)];
      setAvailableActivities(uniqueActivities);
      setAvailableActivities(activities);
    }

    initialize();
  }, [getSessions]);

  const generateSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const sessions = await getSessions();

      // Generate summary using utility function
      const summaryData = await generateWeeklySummary({
        sessions,
        timeframe,
        dateRange,
        selectedActivities,
      });

      if (!summaryData) {
        setError('No focus sessions found for the selected criteria');
        return;
      }

      setSummary(summaryData);

      // Generate AI insights
      setApiLoading(true);
      try {
        const aiInsights = await callGeminiAPI(summaryData);
        setInsights(aiInsights);
      } catch (error) {
        console.error('Error generating AI insights:', error);
        setInsights(generateFallbackInsights(summaryData));
      } finally {
        setApiLoading(false);
      }
    } catch (err) {
      setError('Failed to generate insights');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getSessions, timeframe, dateRange, selectedActivities]);

  return (
    <div className="card">
      <WeeklySummaryFilters
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        availableActivities={availableActivities}
        selectedActivities={selectedActivities}
        onActivityToggle={(activity: string) => {
          setSelectedActivities((prev) =>
            prev.includes(activity)
              ? prev.filter((a) => a !== activity)
              : [...prev, activity]
          );
        }}
        onGenerate={generateSummary}
        isLoading={loading || apiLoading}
      />

      {(loading || apiLoading) && <LoadingState loading={loading} />}

      {error && !loading && !apiLoading && <ErrorState error={error} />}

      {summary && !loading && !apiLoading && !error && (
        <>
          <WeeklySummaryStats summary={summary} />
          <WeeklySummaryInsights insights={insights} />
        </>
      )}
    </div>
  );
}

// Keep the helper components...
function LoadingState({ loading }: { loading: boolean }) {
  return (
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
      />
      <p>
        {loading
          ? 'Processing your focus data...'
          : 'Generating AI insights...'}
      </p>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div
      className="card--surface"
      style={{ textAlign: 'center', padding: '2rem' }}
    >
      <h3 className="card__title">Insights Not Available</h3>
      <p>{error}</p>
      <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
        Try selecting a different time period or complete more focus sessions.
      </p>
    </div>
  );
}

function generateFallbackInsights(summary: WeeklySummary): string {
  const { totalFocusTime, totalSessions, mostProductiveDay, topCategories } =
    summary;

  return `You've completed ${totalSessions} focus sessions, totaling ${totalFocusTime} minutes. 
Your most productive day was ${new Date(
    mostProductiveDay.day
  ).toLocaleDateString('en-US', { weekday: 'long' })} 
with ${mostProductiveDay.minutes} minutes of focus time.

${
  topCategories.length > 0
    ? `Your top focus categories were ${topCategories
        .map(
          (c: { name: string; minutes: number }) =>
            `${c.name} (${c.minutes} min)`
        )
        .join(', ')}.`
    : ''
}

Consider recording your accomplishments after focus sessions to track your progress better.`;
}
