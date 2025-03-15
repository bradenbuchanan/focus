// src/app/dashboard/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import styles from './dashboard.module.css';

export default function Dashboard() {
  const { data: session } = useSession();

  return (
    <div className={styles.dashboard}>
      <h1>Dashboard</h1>
      <p>Welcome, {session?.user?.name || 'User'}!</p>
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h3>Focus Time Today</h3>
          <p className={styles.statValue}>0 minutes</p>
        </div>
        <div className={styles.statCard}>
          <h3>Sessions Completed</h3>
          <p className={styles.statValue}>0</p>
        </div>
        <div className={styles.statCard}>
          <h3>Current Streak</h3>
          <p className={styles.statValue}>0 days</p>
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
