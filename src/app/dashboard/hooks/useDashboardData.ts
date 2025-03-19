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
    

// Replace the entire calculateStreak function with this implementation:
const calculateStreak = () => {
  console.log("======= STREAK DEBUGGING =======");
  
  // Get today's date at midnight in local time to avoid time issues
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  console.log("Today (local midnight):", today.toISOString());
  
  // Format to YYYY-MM-DD consistently
  const formatToDateString = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  
  const todayString = formatToDateString(today);
  console.log("Today formatted:", todayString);
  
  // Get all completed focus sessions
  const completedSessions = focusSessions.filter(s => s.completed);
  if (completedSessions.length === 0) return 0;
  
  // Extract all unique session dates and normalize them to YYYY-MM-DD format
  const sessionDates = completedSessions.map(session => {
    // Use localDate if available, otherwise parse from ISO date
    if (session.localDate) return session.localDate;
    const sessionDate = new Date(session.date);
    return formatToDateString(sessionDate);
  });
  
  // Get unique dates and sort in descending order (newest first)
  const uniqueDates = [...new Set(sessionDates)].sort().reverse();
  console.log("All session dates (newest first):", uniqueDates);
  
  // Check if there's activity today
  const hasActivityToday = uniqueDates.includes(todayString);
  console.log("Has activity today:", hasActivityToday);
  
  // If no activity today, check yesterday
  if (!hasActivityToday) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = formatToDateString(yesterday);
    console.log("Yesterday formatted:", yesterdayString);
    
    const hasActivityYesterday = uniqueDates.includes(yesterdayString);
    console.log("Has activity yesterday:", hasActivityYesterday);
    
    if (!hasActivityYesterday) {
      console.log("No recent activity. Streak is 0.");
      return 0;
    }
  }
  
  // Start counting the streak
  let currentStreak = 0;
  let currentDate = new Date(today);
  
  // If we don't have activity today, start from yesterday
  if (!hasActivityToday) {
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  // Check each day backwards until we find a gap
  while (true) {
    const dateString = formatToDateString(currentDate);
    console.log("Checking date:", dateString);
    
    if (uniqueDates.includes(dateString)) {
      currentStreak++;
      console.log("Found activity, streak now:", currentStreak);
    } else {
      console.log("No activity on", dateString, "- breaking streak");
      break; // Break the streak when we find a day with no activity
    }
    
    // Move to the previous day
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  console.log("Final streak count:", currentStreak);
  console.log("======= END STREAK DEBUG =======");
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