// src/app/dashboard/hooks/useDashboardData.ts
'use client';

import { useState, useEffect } from 'react';
import { getLocalDateString, calculateGoalProgress } from '@/lib/timer';
import { useData } from '../../../providers/DataProvider';

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

// Define session interface with both Supabase and localStorage fields
interface Session {
  id: string;
  // Supabase fields
  start_time?: string;
  end_time?: string;
  category?: string;
  // localStorage fields
  date?: string;
  localDate?: string;
  type?: 'focus' | 'break';
  duration: number;
  completed: boolean;
  activity?: string;
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

  // Get data methods from the provider
  const { getSessions, getGoals } = useData();

  // Helper function to create a date in local time to avoid timezone issues
  const createLocalDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0); // Using noon to avoid any timezone shift issues
  };

  // Helper function to get a consistent date string from a session
  const getSessionDateString = (session: Session): string => {
    return session.localDate || 
           (session.start_time ? session.start_time.split('T')[0] : 
           (session.date ? session.date.split('T')[0] : ''));
  };

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Get all sessions from Supabase (or localStorage fallback)
        const sessions = await getSessions();
        
        // Filter focus sessions - handle both Supabase and localStorage formats
        const focusSessions = sessions.filter(
          (s) => s.type === 'focus' || s.category === 'focus'
        );

        // Calculate stats from sessions
        const today = getLocalDateString(new Date());

        // Calculate focus time for today (in minutes)
        const focusTimeToday = focusSessions
          .filter((s) => getSessionDateString(s) === today)
          .reduce((total, session) => total + (session.duration || 0) / 60, 0);

        // Count completed sessions
        const sessionsCompleted = focusSessions.filter((s) => s.completed).length;

        // Improved streak calculation function
        const calculateStreak = () => {
          // Get today's date at midnight in local time to avoid time issues
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Format to YYYY-MM-DD consistently
          const formatToDateString = (date: Date): string => {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          };
          
          const todayString = formatToDateString(today);
          
          // Get all completed focus sessions
          const completedSessions = focusSessions.filter(s => s.completed);
          if (completedSessions.length === 0) return 0;
          
          // Extract all unique session dates and normalize them to YYYY-MM-DD format
          const sessionDates = completedSessions.map(session => {
            // Handle multiple date formats - Supabase and localStorage
            if (session.localDate) return session.localDate;
            if (session.start_time) return formatToDateString(new Date(session.start_time));
            if (session.date) return formatToDateString(new Date(session.date));
            return ''; // Should never happen, but TypeScript needs this
          }).filter(date => date !== ''); // Filter out empty dates
          
          // Get unique dates and sort in descending order (newest first)
          const uniqueDates = [...new Set(sessionDates)].sort().reverse();
          
          // Check if there's activity today
          const hasActivityToday = uniqueDates.includes(todayString);
          
          // If no activity today, check yesterday
          if (!hasActivityToday) {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = formatToDateString(yesterday);
            
            const hasActivityYesterday = uniqueDates.includes(yesterdayString);
            
            if (!hasActivityYesterday) {
              return 0;
            }
          }
          
          // Start counting the streak
          let currentStreak = 0;
          const currentDate = new Date(today);
          
          // If we don't have activity today, start from yesterday
          if (!hasActivityToday) {
            currentDate.setDate(currentDate.getDate() - 1);
          }
          
          // Check each day backwards until we find a gap
          while (true) {
            const dateString = formatToDateString(currentDate);
            
            if (uniqueDates.includes(dateString)) {
              currentStreak++;
            } else {
              break; // Break the streak when we find a day with no activity
            }
            
            // Move to the previous day
            currentDate.setDate(currentDate.getDate() - 1);
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

          // Sum up minutes for this day - handle both Supabase and localStorage formats
          const dayMinutes = focusSessions
            .filter((s) => getSessionDateString(s) === dateString)
            .reduce((total, session) => total + (session.duration || 0) / 60, 0);

          weeklyValues.push(Math.round(dayMinutes));
        }

        // Get top activities
        const activityMap = new Map<string, number>();

        focusSessions.forEach((session) => {
          const activity = session.activity || 'Other';
          const minutes = (session.duration || 0) / 60;
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
          const goals = await getGoals();
          // Map Supabase goals to the expected format
          const mappedGoals = goals.map(g => ({
            id: g.id,
            title: g.title,
            description: g.description || undefined,
            type: g.type as 'time' | 'sessions',
            target: g.target,
            period: g.period as 'daily' | 'weekly' | 'monthly' | 'yearly',
            startDate: g.start_date,
            endDate: g.end_date || undefined,
            createdAt: g.created_at,
            activity: g.activity || undefined,
          }));
          
          // Calculate progress for each goal
          const goalsWithProgress = mappedGoals.slice(0, 3).map((goal) => ({
            goal,
            progress: calculateGoalProgress(goal),
          }));
          
          setActiveGoals(goalsWithProgress);
        } catch (error) {
          console.error('Error loading goals:', error);
          setActiveGoals([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    }

    fetchDashboardData();
  }, [getSessions, getGoals]);

  return { stats, activeGoals };
}