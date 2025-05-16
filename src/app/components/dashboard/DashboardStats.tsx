// src/app/dashboard/components/DashboardStats.tsx
'use client';

import styles from '../../dashboard/dashboard.module.css';
import cardStyles from '@/app/styles/shared/cards.module.css';
import { formatTimeValue } from '@/utils/formatTime';

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
      <div className={`${cardStyles.card} ${cardStyles.statsCard}`}>
        <h3>Today&apos;s Focus Time</h3>
        <p className={cardStyles.statsValue}>
          {formatTimeValue(stats.focusTimeToday)}
        </p>
      </div>
      <div className={`${cardStyles.card} ${cardStyles.statsCard}`}>
        <h3>Sessions Completed</h3>
        <p className={cardStyles.statsValue}>{stats.sessionsCompleted}</p>
      </div>
      <div className={`${cardStyles.card} ${cardStyles.statsCard}`}>
        <h3>Current Streak</h3>
        <p className={cardStyles.statsValue}>{stats.currentStreak} days</p>
      </div>
    </div>
  );
}
