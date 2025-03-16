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

  // Helper function to create a date in local time to avoid timezone issues
  const createLocalDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0); // Using noon to avoid any timezone shift issues
  };

  // Helper function to get a consistent date string from a session
  const getSessionDateString = (session: any): string => {
    return session.localDate || session.date.split('T')[0];
  };

  useEffect(() => {
    // Get all sessions from local storage
    const sessions = getSessions();
    const focusSessions = sessions.filter((s) => s.type === 'focus');

    // Calculate stats from sessions
    const today = getLocalDateString(new Date());

    // Calculate focus time for today (in minutes)
    const focusTimeToday =
      focusSessions
        .filter((s) => getSessionDateString(s) === today)
        .reduce((total, session) => total + session.duration, 0) / 60;

    // Count completed sessions
    const sessionsCompleted = focusSessions.filter((s) => s.completed).length;

    // Calculate streak with proper timezone handling
    const uniqueDaysWithSessions = new Set(
      focusSessions
        .filter((s) => s.completed)
        .map((s) => getSessionDateString(s))
    );
    

    const calculateStreak = () => {
      // Get all dates with completed sessions
      const datesWithSessions = focusSessions
        .filter(s => s.completed)
        .map(s => getSessionDateString(s))
        .sort()
        .reverse(); // Sort in descending order (most recent first)
      
      // Remove duplicates
      const uniqueDates = [...new Set(datesWithSessions)];
      
      if (uniqueDates.length === 0) return 0;
      
      // Check if the streak includes today
      const todayFormatted = getLocalDateString(new Date());
      const hasActivityToday = uniqueDates.includes(todayFormatted);
      
      // If no activity today, check if there was activity yesterday
      if (!hasActivityToday) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayFormatted = getLocalDateString(yesterday);
        
        if (!uniqueDates.includes(yesterdayFormatted)) {
          return 0; // No activity today or yesterday, no streak
        }
      }
      
      // Start with the most recent day (today or yesterday)
      const startDate = hasActivityToday ? todayFormatted : getLocalDateString(new Date(Date.now() - 86400000));
      const startIndex = uniqueDates.indexOf(startDate);
      
      if (startIndex === -1) return 0;
      
      let currentStreak = 1; // Start with 1 for the most recent day
      
      // Count consecutive days
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const currentDate = createLocalDate(uniqueDates[i]);
        const nextDate = createLocalDate(uniqueDates[i + 1]);
        
        // Check if dates are consecutive (1 day apart)
        const diffTime = currentDate.getTime() - nextDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break; // Break the streak when we find a gap
        }
      }
      
      return currentStreak;
    };
    
    const currentStreak = calculateStreak();

    // Calculate weekly data (last 7 days) with proper date handling
    const weeklyLabels: string[] = [];
    const weeklyValues: number[] = [];

    for (let i = 6; i >= 0; i--) {
      // Create date in consistent local time
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = getLocalDateString(date);

      // Format day name directly from the date object for consistent day-of-week
      const dayObj = createLocalDate(dateString);
      const dayName = dayObj.toLocaleDateString('en-US', {
        weekday: 'short',
      });
      weeklyLabels.push(dayName);

      // Sum up minutes for this day
      const dayMinutes = focusSessions
        .filter((s) => getSessionDateString(s) === dateString)
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