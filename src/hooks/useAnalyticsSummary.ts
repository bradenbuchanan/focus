// src/hooks/useAnalyticsSummary.ts
import { useState, useEffect } from 'react';
import { getSessions } from '@/lib/timer';

export interface AnalyticsSummary {
  totalFocusTime: number;
  totalSessions: number;
  avgSessionLength: number;
  favoriteActivity: string;
  mostProductiveDay: string;
  mostProductiveHour: number;
  completionRate: number;
}

export function useAnalyticsSummary() {
  const [summary, setSummary] = useState<AnalyticsSummary>({
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
    const focusSessions = sessions.filter((s) => s.type === 'focus');
    const completedFocusSessions = focusSessions.filter((s) => s.completed);

    // Calculate total and average times
    const totalFocusTime = focusSessions.reduce(
      (total, s) => total + s.duration / 60, 0
    );
    const avgSessionLength = focusSessions.length
      ? totalFocusTime / focusSessions.length : 0;

    // Calculate favorite activity
    const activityMap = new Map<string, number>();
    focusSessions.forEach((session) => {
      const activity = session.activity || 'Other';
      activityMap.set(activity, (activityMap.get(activity) || 0) + 1);
    });

    let favoriteActivity = '';
    let maxCount = 0;
    activityMap.forEach((count, activity) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteActivity = activity;
      }
    });

    // Calculate most productive day and hour
    const dayMap = new Map<number, number>();
    const hourMap = new Map<number, number>();

    focusSessions.forEach((session) => {
      let date;
      if (session.localDate) {
        const [year, month, day] = session.localDate.split('-').map(Number);
        date = new Date(year, month - 1, day, 12, 0, 0);
      } else {
        date = new Date(session.date);
      }
      const day = date.getDay();
      const hour = date.getHours();
      const minutes = session.duration / 60;

      dayMap.set(day, (dayMap.get(day) || 0) + minutes);
      hourMap.set(hour, (hourMap.get(hour) || 0) + minutes);
    });

    // Find most productive day
    let mostProductiveDay = '';
    let maxDayMinutes = 0;
    dayMap.forEach((minutes, day) => {
      if (minutes > maxDayMinutes) {
        maxDayMinutes = minutes;
        mostProductiveDay = [
          'Sunday', 'Monday', 'Tuesday', 'Wednesday',
          'Thursday', 'Friday', 'Saturday'
        ][day];
      }
    });

    // Find most productive hour
    let mostProductiveHour = 0;
    let maxHourMinutes = 0;
    hourMap.forEach((minutes, hour) => {
      if (minutes > maxHourMinutes) {
        maxHourMinutes = minutes;
        mostProductiveHour = hour;
      }
    });

    // Calculate completion rate
    const completionRate = focusSessions.length
      ? (completedFocusSessions.length / focusSessions.length) * 100 : 0;

    setSummary({
      totalFocusTime: Math.round(totalFocusTime),
      totalSessions: completedFocusSessions.length,
      avgSessionLength: Math.round(avgSessionLength),
      favoriteActivity,
      mostProductiveDay,
      mostProductiveHour,
      completionRate: Math.round(completionRate),
    });
  }, []);

  return summary;
}