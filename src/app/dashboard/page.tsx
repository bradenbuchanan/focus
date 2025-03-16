// src/app/dashboard/page.tsx
'use client';

import ProtectedRoute from '../components/auth/ProtectedRoute';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TimerSession,
  getSessions,
  getLocalDateString,
  getGoals,
  calculateGoalProgress,
} from '@/lib/timer';
import styles from './dashboard.module.css';

// Import a simple chart component for dashboard preview
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

// Define the Goal interface if it's not properly exported from timer.ts
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
}

// Define the progress interface
interface GoalProgress {
  current: number;
  percentage: number;
}

export default function Dashboard() {
  const { data: session } = useSession();
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

  const [activeGoals, setActiveGoals] = useState<
    Array<{
      goal: Goal;
      progress: GoalProgress;
    }>
  >([]);

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
    const weeklyLabels = [];
    const weeklyValues = [];

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

  // Helper function to format time
  const formatTimeValue = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  };

  // Update the chart options for better styling
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 10,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          title: function (context: any) {
            return `${context[0].label}`;
          },
          label: function (context: any) {
            return `${context.raw} minutes`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(var(--gray-rgb), 0.1)',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          color: 'rgba(var(--gray-rgb), 0.7)',
          padding: 10,
          callback: function (value: any) {
            if (value % 1 === 0) {
              return value;
            }
          },
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          color: 'rgba(var(--gray-rgb), 0.7)',
          padding: 10,
        },
      },
    },
  };

  // Update the chart data with better styling
  const chartData = {
    labels: stats.weeklyData.labels,
    datasets: [
      {
        data: stats.weeklyData.values,
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        hoverBackgroundColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 0,
        borderRadius: 6,
        barThickness: 16,
      },
    ],
  };

  return (
    <ProtectedRoute>
      <div className={styles.dashboard}>
        <h1>Dashboard</h1>
        <p>
          Welcome back, {session?.user?.name || 'User'}! Here's an overview of
          your focus activity.
        </p>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <h3>Today's Focus Time</h3>
            <p className={styles.statValue}>
              {formatTimeValue(stats.focusTimeToday)}
            </p>
          </div>
          <div className={styles.statCard}>
            <h3>Sessions Completed</h3>
            <p className={styles.statValue}>{stats.sessionsCompleted}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Current Streak</h3>
            <p className={styles.statValue}>{stats.currentStreak} days</p>
          </div>
        </div>

        <div className={styles.chartsPreview}>
          <div className={styles.chartCard}>
            <h3>Weekly Focus Time</h3>
            <div className={styles.miniChart}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          <div className={styles.topActivitiesCard}>
            <h3>Top Activities</h3>
            {stats.topActivities.length > 0 ? (
              <ul className={styles.topActivitiesList}>
                {stats.topActivities.map((activity, index) => (
                  <li key={index} className={styles.topActivity}>
                    <span className={styles.activityName}>{activity.name}</span>
                    <span className={styles.activityTime}>
                      {formatTimeValue(activity.minutes)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.noData}>No activities recorded yet</p>
            )}
          </div>
        </div>

        {activeGoals.length > 0 && (
          <div className={styles.goalsSection}>
            <h2 className={styles.sectionTitle}>Active Goals</h2>
            <div className={styles.goalCards}>
              {activeGoals.map(({ goal, progress }) => (
                <div key={goal.id} className={styles.goalOverviewCard}>
                  <h3>{goal.title}</h3>
                  <div className={styles.goalStats}>
                    <div className={styles.goalType}>
                      {goal.type === 'time' ? 'Focus Time' : 'Sessions'} •{' '}
                      {goal.period}
                    </div>
                    <div className={styles.goalValue}>
                      {progress.current} / {goal.target} ({progress.percentage}
                      %)
                    </div>
                  </div>
                  <div className={styles.goalProgressBar}>
                    <div
                      className={styles.goalProgress}
                      style={{
                        width: `${progress.percentage}%`,
                        backgroundColor:
                          progress.percentage >= 100 ? '#4CAF50' : '#3B82F6',
                      }}
                    />
                  </div>
                </div>
              ))}
              <Link href="/goals" className={styles.viewAllGoals}>
                View All Goals
              </Link>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <Link href="/timer" className={styles.actionButton}>
            Start Focus Session
          </Link>
          <Link
            href="/analytics"
            className={`${styles.actionButton} ${styles.secondaryAction}`}
          >
            View Detailed Analytics
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
