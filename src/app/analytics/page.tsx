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
import ActivityHeatmap from '@/app/components/analytics/ActivityHeatmap'; // Import the new component

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

  return (
    <div className={styles.analyticsPage}>
      <h1>Analytics & Insights</h1>
      <p>Detailed breakdown of your focus habits and productivity patterns.</p>

      <div className={styles.statsSection}>
        <div className={styles.summaryCard}>
          <h2 className={styles.summaryTitle}>Summary</h2>
          <ul className={styles.summaryList}>
            <li className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total Focus Time</span>
              <span className={styles.summaryValue}>
                {summary.totalFocusTime} minutes
              </span>
            </li>
            <li className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total Sessions</span>
              <span className={styles.summaryValue}>
                {summary.totalSessions}
              </span>
            </li>
            <li className={styles.summaryItem}>
              <span className={styles.summaryLabel}>
                Average Session Length
              </span>
              <span className={styles.summaryValue}>
                {summary.avgSessionLength} minutes
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
              <span className={styles.summaryLabel}>Most Productive Hour</span>
              <span className={styles.summaryValue}>
                {summary.mostProductiveHour !== undefined
                  ? `${summary.mostProductiveHour}:00`
                  : 'N/A'}
              </span>
            </li>
            <li className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Completion Rate</span>
              <span className={styles.summaryValue}>
                {summary.completionRate}%
              </span>
            </li>
          </ul>
        </div>
      </div>

      <ActivityHeatmap />

      <DailyBarChart />

      <div className={styles.analyticsGrid}>
        <ActivityPieChart />
        <ProductivityTrends />
      </div>

      <WeeklyHeatmap />
    </div>
  );
}
