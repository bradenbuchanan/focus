// src/app/dashboard/components/DashboardStats.tsx
'use client';

import styles from '../../dashboard/dashboard.module.css';
import { formatTimeValue } from '../../dashboard/utils/format';

interface StatsProps {
  stats: {
    focusTimeToday: number;
    sessionsCompleted: number;
    currentStreak: number;
  };
}

export default function DashboardStats({ stats }: StatsProps) {
  return (
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
  );
}
