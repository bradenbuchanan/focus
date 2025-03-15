// src/app/dashboard/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { TimerSession, getSessions } from '@/lib/timer';
import styles from './dashboard.module.css';

export default function Dashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    focusTimeToday: 0,
    sessionsCompleted: 0,
    currentStreak: 0,
  });

  useEffect(() => {
    // Get all sessions from local storage
    const sessions = getSessions();

    // Calculate stats from sessions
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    // Calculate focus time for today (in minutes)
    const focusTimeToday =
      sessions
        .filter((s) => s.type === 'focus' && s.date.startsWith(today))
        .reduce((total, session) => total + session.duration, 0) / 60;

    // Count completed sessions
    const sessionsCompleted = sessions.filter((s) => s.completed).length;

    // Calculate streak (simplified version)
    // This is a basic implementation - for a more accurate streak calculation,
    // you would need to check consecutive days with completed sessions
    const uniqueDaysWithSessions = new Set(
      sessions.filter((s) => s.completed).map((s) => s.date.split('T')[0])
    );
    const currentStreak = uniqueDaysWithSessions.has(today) ? 1 : 0;

    setStats({
      focusTimeToday: Math.round(focusTimeToday),
      sessionsCompleted,
      currentStreak,
    });
  }, []);

  return (
    <div className={styles.dashboard}>
      <h1>Dashboard</h1>
      <p>Welcome, {session?.user?.name || 'User'}!</p>
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h3>Focus Time Today</h3>
          <p className={styles.statValue}>{stats.focusTimeToday} minutes</p>
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

      <div className={styles.actions}>
        <a href="/timer" className={styles.actionButton}>
          Start Focus Session
        </a>
      </div>
    </div>
  );
}
