// src/app/components/analytics/DailyBarChart.tsx
'use client';

import { useState, useEffect } from 'react';
import { useData } from '@/providers/DataProvider';

// Type definitions remain the same
type TimeFrame = '7d' | '30d' | '90d' | '6m' | '1y';

interface DatabaseSession {
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
  type?: string;
  date?: string;
  localDate?: string;
}

export default function DailyBarChart() {
  const [timeframe, setTimeframe] = useState<TimeFrame>('7d');
  const [chartData, setChartData] = useState<{
    labels: string[];
    values: number[];
  }>({
    labels: [],
    values: [],
  });

  const { getSessions } = useData();
  const [isLoading, setIsLoading] = useState(true);

  // Data loading logic remains the same
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Get sessions from provider (will use Supabase or fall back to localStorage)
        const sessions = await getSessions();

        // Filter for focus sessions only
        const focusSessions = sessions.filter((session: DatabaseSession) => {
          if ('type' in session && typeof session.type === 'string') {
            return session.type === 'focus';
          }
          if (session.category) {
            return session.category === 'focus';
          }
          return false;
        });

        if (focusSessions.length === 0) {
          setChartData({ labels: [], values: [] });
          setIsLoading(false);
          return;
        }

        // Determine date range based on timeframe
        let daysToShow: number;
        let labelFormat: 'day' | 'week' | 'month' = 'day';

        switch (timeframe) {
          case '30d':
            daysToShow = 30;
            break;
          case '90d':
            daysToShow = 90;
            labelFormat = 'week';
            break;
          case '6m':
            daysToShow = 180;
            labelFormat = 'month';
            break;
          case '1y':
            daysToShow = 365;
            labelFormat = 'month';
            break;
          default: // '7d'
            daysToShow = 7;
            break;
        }

        // Create appropriate date bins based on timeframe
        const days: string[] = [];
        const dailyMinutes: number[] = [];

        if (labelFormat === 'day') {
          // Create a map to store minutes for each day
          const dateMap = new Map<string, number>();

          // Today's date (at midnight for consistent comparison)
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Initialize all dates in the range
          const dateStrings: string[] = [];
          for (let i = daysToShow - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);

            // Format for display (MM/DD)
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const displayDate = `${month}/${day}`;
            days.push(displayDate);

            // Format for date comparison (YYYY-MM-DD)
            const isoDate = date.toISOString().split('T')[0];
            dateStrings.push(isoDate);
            dateMap.set(isoDate, 0);
          }

          // Process focus sessions
          focusSessions.forEach((session: DatabaseSession) => {
            // Extract date based on session format
            let sessionDate: string | undefined;

            if (session.localDate) {
              sessionDate = session.localDate;
            } else if (session.date) {
              sessionDate = new Date(session.date).toISOString().split('T')[0];
            } else if (session.start_time) {
              sessionDate = new Date(session.start_time)
                .toISOString()
                .split('T')[0];
            }

            if (!sessionDate) {
              return;
            }

            // Calculate minutes based on session format
            let minutes = 0;
            if (session.duration) {
              minutes = Math.round(session.duration / 60);
            }

            // Check if this session falls within our date range
            if (dateMap.has(sessionDate)) {
              const currentValue = dateMap.get(sessionDate) || 0;
              const newValue = currentValue + minutes;
              dateMap.set(sessionDate, newValue);
            }
          });

          // Build data array in the same order as the labels
          dateStrings.forEach((dateStr) => {
            dailyMinutes.push(dateMap.get(dateStr) || 0);
          });
        } else if (labelFormat === 'week' || labelFormat === 'month') {
          // Implementation for weekly/monthly view would go here
          // This is a basic placeholder for weeks/months
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const periodMap = new Map<string, number>();
          const labelMap = new Map<string, string>();

          if (labelFormat === 'week') {
            // Generate weeks
            for (let i = 0; i < daysToShow / 7; i++) {
              const startDate = new Date(today);
              startDate.setDate(today.getDate() - (i * 7 + 6));
              const endDate = new Date(today);
              endDate.setDate(today.getDate() - i * 7);

              const startMonth = startDate.getMonth() + 1;
              const startDay = startDate.getDate();
              const endMonth = endDate.getMonth() + 1;
              const endDay = endDate.getDate();

              const weekLabel = `${startMonth}/${startDay}-${endMonth}/${endDay}`;
              const weekKey = `week-${i}`;

              days.unshift(weekLabel);
              periodMap.set(weekKey, 0);

              // Calculate start/end dates for filtering
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(23, 59, 59, 999);

              // Process focus sessions for this week
              focusSessions.forEach((session: DatabaseSession) => {
                let sessionDate = new Date();

                if (session.localDate) {
                  sessionDate = new Date(session.localDate);
                } else if (session.date) {
                  sessionDate = new Date(session.date);
                } else if (session.start_time) {
                  sessionDate = new Date(session.start_time);
                }

                if (sessionDate >= startDate && sessionDate <= endDate) {
                  let minutes = 0;
                  if (session.duration) {
                    minutes = Math.round(session.duration / 60);
                  }
                  periodMap.set(
                    weekKey,
                    (periodMap.get(weekKey) || 0) + minutes
                  );
                }
              });
            }
          } else {
            // Generate months
            for (let i = 0; i < 12; i++) {
              const date = new Date(
                today.getFullYear(),
                today.getMonth() - i,
                1
              );
              const monthName = date.toLocaleString('default', {
                month: 'short',
              });
              const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

              days.unshift(monthName);
              periodMap.set(monthKey, 0);
              labelMap.set(monthKey, monthName);

              // Calculate start/end dates for this month
              const startDate = new Date(
                date.getFullYear(),
                date.getMonth(),
                1
              );
              const endDate = new Date(
                date.getFullYear(),
                date.getMonth() + 1,
                0,
                23,
                59,
                59
              );

              // Process focus sessions for this month
              focusSessions.forEach((session: DatabaseSession) => {
                let sessionDate = new Date();

                if (session.localDate) {
                  sessionDate = new Date(session.localDate);
                } else if (session.date) {
                  sessionDate = new Date(session.date);
                } else if (session.start_time) {
                  sessionDate = new Date(session.start_time);
                }

                if (sessionDate >= startDate && sessionDate <= endDate) {
                  let minutes = 0;
                  if (session.duration) {
                    minutes = Math.round(session.duration / 60);
                  }
                  periodMap.set(
                    monthKey,
                    (periodMap.get(monthKey) || 0) + minutes
                  );
                }
              });
            }
          }

          // Convert map to array in the correct order
          // For now, just use the order of the days array
          for (let i = 0; i < days.length; i++) {
            const key =
              labelFormat === 'week'
                ? `week-${days.length - i - 1}`
                : Array.from(labelMap.entries()).find(
                    ([k]) => labelMap.get(k) === days[i]
                  )?.[0] || '';

            dailyMinutes.push(periodMap.get(key) || 0);
          }
        }

        setChartData({
          labels: days,
          values: dailyMinutes,
        });
      } catch (error) {
        console.error('Error fetching data for chart:', error);
        setChartData({ labels: [], values: [] });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [timeframe, getSessions]);

  // Helper to get chart title based on timeframe
  function getChartTitle(timeframe: TimeFrame): string {
    switch (timeframe) {
      case '7d':
        return 'Daily Focus Time (Past 7 Days)';
      case '30d':
        return 'Daily Focus Time (Past 30 Days)';
      case '90d':
        return 'Weekly Focus Time (Past 90 Days)';
      case '6m':
        return 'Monthly Focus Time (Past 6 Months)';
      case '1y':
        return 'Monthly Focus Time (Past Year)';
      default:
        return 'Focus Time';
    }
  }

  // Calculate the maximum value for scaling
  const maxValue = Math.max(...chartData.values, 1); // Use at least 1 to avoid division by zero

  return (
    <div className="card chart-container">
      <div className="chart-controls">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${
              timeframe === '7d' ? 'filter-tab--active' : ''
            }`}
            onClick={() => setTimeframe('7d')}
          >
            7 Days
          </button>
          <button
            className={`filter-tab ${
              timeframe === '30d' ? 'filter-tab--active' : ''
            }`}
            onClick={() => setTimeframe('30d')}
          >
            30 Days
          </button>
          <button
            className={`filter-tab ${
              timeframe === '90d' ? 'filter-tab--active' : ''
            }`}
            onClick={() => setTimeframe('90d')}
          >
            90 Days
          </button>
          <button
            className={`filter-tab ${
              timeframe === '6m' ? 'filter-tab--active' : ''
            }`}
            onClick={() => setTimeframe('6m')}
          >
            6 Months
          </button>
          <button
            className={`filter-tab ${
              timeframe === '1y' ? 'filter-tab--active' : ''
            }`}
            onClick={() => setTimeframe('1y')}
          >
            1 Year
          </button>
        </div>
      </div>

      <h3 className="card__title">{getChartTitle(timeframe)}</h3>

      {isLoading ? (
        <div
          className="loading-shimmer"
          style={{ height: '300px', borderRadius: '8px' }}
        >
          <p style={{ textAlign: 'center', paddingTop: '140px', opacity: 0.6 }}>
            Loading data...
          </p>
        </div>
      ) : chartData.values.length === 0 ? (
        <div className="list-empty">
          <p>No focus sessions found for this time period.</p>
          <p>Complete some focus sessions to see your data here.</p>
        </div>
      ) : (
        <div>
          {/* Custom chart implementation */}
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              height: '300px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
            }}
          >
            {chartData.values.map((value, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                }}
              >
                <div
                  style={{
                    height: `${Math.max(
                      (value / maxValue) * 200,
                      value > 0 ? 20 : 0
                    )}px`,
                    width: '30px',
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    marginBottom: '8px',
                    borderRadius: '4px 4px 0 0',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    padding: '2px',
                  }}
                >
                  {value > 0 && (
                    <span
                      style={{
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      {value}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px' }}>
                  {chartData.labels[index]}
                </div>
              </div>
            ))}
          </div>

          {/* Data summary */}
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: 'var(--gray-alpha-100)',
              borderRadius: '8px',
              fontSize: '0.9rem',
            }}
          >
            <p>
              <strong>Summary:</strong>{' '}
              {chartData.values.reduce((sum, val) => sum + val, 0)} total
              minutes
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginTop: '8px',
              }}
            >
              {chartData.labels.map((label, i) => (
                <div
                  key={i}
                  style={{
                    padding: '4px 8px',
                    backgroundColor:
                      chartData.values[i] > 0
                        ? 'rgba(54, 162, 235, 0.2)'
                        : 'var(--gray-alpha-200)',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                  }}
                >
                  {label}: {chartData.values[i]} min
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
