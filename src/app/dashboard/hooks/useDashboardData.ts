// src/app/dashboard/hooks/useDashboardData.ts
'use client';

import { useState, useEffect } from 'react';
import { getSessions, getGoals, calculateGoalProgress, getLocalDateString } from '@/lib/timer';

// Define proper types for the Goal and Progress interfaces
interface Goal {
  id: string;
  title: string;
  description?: string;
  type: 'time' | 'sessions';
  target: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  createdAt: string;
  activity?: string;
}

interface GoalProgress {
  current: number;
  percentage: number;
}

export function useDashboardData() {
  const [stats, setStats] = useState({
    focusTimeToday: 0,
    sessionsCompleted: 0,
    currentStreak: 0,
    weeklyData: {
      labels: [] as string[],
      values: [] as number[],
    },
    topActivities: [] as { name: string; minutes: number }[],
  });

  const [activeGoals, setActiveGoals] = useState<Array<{
    goal: Goal;
    progress: GoalProgress;
  }>>([]);

  useEffect(() => {
    // Get all sessions from local storage
    const sessions = getSessions();
    const focusSessions = sessions.filter((s) => s.type === 'focus');

    // Calculate stats from sessions
    const today = getLocalDateString(new Date());

    // Calculate focus time for today (in minutes)
    const focusTimeToday =
      focusSessions
        .filter((s) => (s.localDate || s.date.split('T')[0]) === today)
        .reduce((total, session) => total + session.duration, 0) / 60;

    // Count completed sessions
    const sessionsCompleted = focusSessions.filter((s) => s.completed).length;

    // Calculate streak (simplified version)
    const uniqueDaysWithSessions = new Set(
      focusSessions.filter((s) => s.completed).map((s) => s.date.split('T')[0])
    );
    const currentStreak = uniqueDaysWithSessions.has(today) ? 1 : 0;

    // Calculate weekly data (last 7 days)
    const weeklyLabels: string[] = [];
    const weeklyValues: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = getLocalDateString(date);

      // Format as "Mon", "Tue", etc. for better readability
      const dayName = new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
      });
      weeklyLabels.push(dayName);

      const dayMinutes = focusSessions
        .filter((s) => (s.localDate || s.date.split('T')[0]) === dateString)
        .reduce((total, session) => total + session.duration / 60, 0);

      weeklyValues.push(Math.round(dayMinutes));
    }

    // Get top activities
    const activityMap = new Map<string, number>();

    focusSessions.forEach((session) => {
      const activity = session.activity || 'Other';
      const minutes = session.duration / 60;
      if (activityMap.has(activity)) {
        activityMap.set(activity, activityMap.get(activity)! + minutes);
      } else {
        activityMap.set(activity, minutes);
      }
    });

    const topActivities = Array.from(activityMap.entries())
      .map(([name, minutes]) => ({ name, minutes: Math.round(minutes) }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);

    setStats({
      focusTimeToday: Math.round(focusTimeToday),
      sessionsCompleted,
      currentStreak,
      weeklyData: {
        labels: weeklyLabels,
        values: weeklyValues,
      },
      topActivities,
    });

    // Load active goals
    try {
      const goals = getGoals();
      const goalsWithProgress = goals.slice(0, 3).map((goal) => ({
        goal,
        progress: calculateGoalProgress(goal),
      }));
      setActiveGoals(goalsWithProgress);
    } catch (error) {
      console.error('Error loading goals:', error);
      // Set empty goals if there's an error
      setActiveGoals([]);
    }
  }, []);

  return { stats, activeGoals };
}