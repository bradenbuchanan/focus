// src/app/components/dashboard/DashboardActions.tsx
'use client';

import Link from 'next/link';
import styles from '../../dashboard/dashboard.module.css';
import buttonStyles from '@/app/styles/shared/buttons.module.css';

export default function DashboardActions() {
  return (
    <div className={styles.actionsContainer}>
      <div className={styles.actions}>
        <Link href="/timer" className={buttonStyles.primaryButton}>
          Start Focus Session
        </Link>
        <Link href="/analytics" className={buttonStyles.secondaryButton}>
          View Detailed Analytics
        </Link>
      </div>
    </div>
  );
}
