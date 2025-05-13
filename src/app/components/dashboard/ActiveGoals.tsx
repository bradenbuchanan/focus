// src/app/components/dashboard/ActiveGoals.tsx
'use client';

import Link from 'next/link';
import { GoalCard } from '../../components/ui/GoalCard';
import styles from './dashboardActiveGoals.module.css';

interface GoalsProps {
  goals: Array<{
    goal: {
      id: string;
      title: string;
      type: 'time' | 'sessions'; // Change from string to union type
      period: 'daily' | 'weekly' | 'monthly' | 'yearly'; // Also update period to be more specific
      target: number;
      startDate: string;
      createdAt: string;
      activity?: string;
      description?: string;
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
          <GoalCard
            key={goal.id}
            goal={goal}
            progress={progress}
            isCompact={true}
            showActions={false}
          />
        ))}
        <Link href="/goals" className={styles.viewAllGoals}>
          View All Goals
        </Link>
      </div>
    </div>
  );
}
