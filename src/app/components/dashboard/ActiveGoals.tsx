// src/app/dashboard/components/ActiveGoals.tsx
'use client';

import Link from 'next/link';
import styles from './dashboardActiveGoals.module.css';

interface GoalsProps {
  goals: Array<{
    goal: {
      id: string;
      title: string;
      type: string;
      period: string;
      target: number;
    };
    progress: {
      current: number;
      percentage: number;
    };
  }>;
}

export default function ActiveGoals({ goals }: GoalsProps) {
  return (
    <div className={styles.goalsSection}>
      <h2 className={styles.sectionTitle}>Active Goals</h2>
      <div className={styles.goalCards}>
        {goals.map(({ goal, progress }) => (
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
  );
}
