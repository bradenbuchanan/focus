// src/app/analytics/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { TimerSession, getSessions } from '@/lib/timer';
import styles from './analytics.module.css';

// Import analytics components
import ActivityPieChart from '@/app/components/analytics/ActivityPieChart';
import WeeklyHeatmap from '@/app/components/analytics/WeeklyHeatmap';
import DailyBarChart from '@/app/components/analytics/DailyBarChart';
import ProductivityTrends from '@/app/components/analytics/ProductivityTrends';
import ActivityHeatmap from '@/app/components/analytics/ActivityHeatmap';

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState({
    totalFocusTime: 0,
    totalSessions: 0,
    avgSessionLength: 0,
    favoriteActivity: '',
    mostProductiveDay: '',
    mostProductiveHour: 0,
    completionRate: 0,
  });

  useEffect(() => {
    const sessions = getSessions();

    // Calculate summary stats
    const focusSessions = sessions.filter((s) => s.type === 'focus');
    const totalFocusTime = focusSessions.reduce(
      (total, s) => total + s.duration / 60,
      0
    );
    const avgSessionLength = focusSessions.length
      ? totalFocusTime / focusSessions.length
      : 0;

    // Favorite activity
    const activityMap = new Map<string, number>();
    focusSessions.forEach((session) => {
      const activity = session.activity || 'Other';
      if (activityMap.has(activity)) {
        activityMap.set(activity, activityMap.get(activity)! + 1);
      } else {
        activityMap.set(activity, 1);
      }
    });

    let favoriteActivity = '';
    let maxCount = 0;
    activityMap.forEach((count, activity) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteActivity = activity;
      }
    });

    // Most productive day and hour
    const dayMap = new Map<number, number>();
    const hourMap = new Map<number, number>();

    focusSessions.forEach((session) => {
      const date = new Date(session.date);
      const day = date.getDay();
      const hour = date.getHours();

      const minutes = session.duration / 60;

      if (dayMap.has(day)) {
        dayMap.set(day, dayMap.get(day)! + minutes);
      } else {
        dayMap.set(day, minutes);
      }

      if (hourMap.has(hour)) {
        hourMap.set(hour, hourMap.get(hour)! + minutes);
      } else {
        hourMap.set(hour, minutes);
      }
    });

    let mostProductiveDay = '';
    let maxDayMinutes = 0;
    dayMap.forEach((minutes, day) => {
      if (minutes > maxDayMinutes) {
        maxDayMinutes = minutes;
        mostProductiveDay = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ][day];
      }
    });

    let mostProductiveHour = 0;
    let maxHourMinutes = 0;
    hourMap.forEach((minutes, hour) => {
      if (minutes > maxHourMinutes) {
        maxHourMinutes = minutes;
        mostProductiveHour = hour;
      }
    });

    // Completion rate
    const completionRate = focusSessions.length
      ? (focusSessions.filter((s) => s.completed).length /
          focusSessions.length) *
        100
      : 0;

    setSummary({
      totalFocusTime: Math.round(totalFocusTime),
      totalSessions: focusSessions.length,
      avgSessionLength: Math.round(avgSessionLength),
      favoriteActivity,
      mostProductiveDay,
      mostProductiveHour,
      completionRate: Math.round(completionRate),
    });
  }, []);

  // Helper function for formatting time
  const formatTimeValue = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  };

  return (
    <div className={styles.analyticsPage}>
      <h1>Analytics & Insights</h1>
      <p>Detailed breakdown of your focus habits and productivity patterns.</p>

      <div className={styles.statsSection}>
        <div className={styles.summaryCard}>
          <h2 className={styles.summaryTitle}>Performance Summary</h2>
          <ul className={styles.summaryList}>
            <li className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total Focus Time</span>
              <span className={styles.summaryValue}>
                {formatTimeValue(summary.totalFocusTime)}
              </span>
            </li>
            <li className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Sessions Completed</span>
              <span className={styles.summaryValue}>
                {summary.totalSessions}
              </span>
            </li>
            <li className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Average Session</span>
              <span className={styles.summaryValue}>
                {formatTimeValue(summary.avgSessionLength)}
              </span>
            </li>
            <li className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Favorite Activity</span>
              <span className={styles.summaryValue}>
                {summary.favoriteActivity || 'N/A'}
              </span>
            </li>
            <li className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Most Productive Day</span>
              <span className={styles.summaryValue}>
                {summary.mostProductiveDay || 'N/A'}
              </span>
            </li>
            <li className={styles.summaryItem}>
              <span className={styles.summaryLabel}>
                Peak Productivity Hour
              </span>
              <span className={styles.summaryValue}>
                {summary.mostProductiveHour !== undefined
                  ? `${summary.mostProductiveHour}:00`
                  : 'N/A'}
              </span>
            </li>
            <li className={styles.summaryItem}>
              <span className={styles.summaryLabel}>
                Session Completion Rate
              </span>
              <span className={styles.summaryValue}>
                {summary.completionRate}%
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.chartGrid}>
        <div className={styles.chartSection}>
          <h3 className={styles.sectionTitle}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Activity Calendar
          </h3>
          <ActivityHeatmap />
        </div>

        <div className={styles.chartSection}>
          <h3 className={styles.sectionTitle}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 20V10"></path>
              <path d="M18 20V4"></path>
              <path d="M6 20v-4"></path>
            </svg>
            Focus Time Distribution
          </h3>
          <DailyBarChart />
        </div>

        <div className={styles.chartSection}>
          <h3 className={styles.sectionTitle}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
            Productivity Patterns
          </h3>
          <div className={styles.analyticsGrid}>
            <ProductivityTrends />
            <ActivityPieChart />
          </div>
        </div>

        <div className={styles.chartSection}>
          <h3 className={styles.sectionTitle}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2"></rect>
              <path d="M3 9h18"></path>
              <path d="M9 21V9"></path>
            </svg>
            Weekly Activity Pattern
          </h3>
          <WeeklyHeatmap />
        </div>
      </div>
    </div>
  );
}
