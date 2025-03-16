// src/app/dashboard/components/DashboardActions.tsx
'use client';

import Link from 'next/link';
import styles from '../../dashboard/dashboard.module.css';

export default function DashboardActions() {
  return (
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
  );
}
