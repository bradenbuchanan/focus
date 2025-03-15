// src/app/components/goals/GoalCard.tsx
'use client';

import { useState } from 'react';
import { Goal, calculateGoalProgress, deleteGoal } from '@/lib/timer';
import styles from '../../../app/goals/goals.module.css';

interface GoalCardProps {
  goal: Goal;
  onDelete: () => void;
}

export default function GoalCard({ goal, onDelete }: GoalCardProps) {
  const { current, percentage } = calculateGoalProgress(goal);

  const formatPeriod = (period: string) => {
    switch (period) {
      case 'daily':
        return 'Today';
      case 'weekly':
        return 'This Week';
      case 'monthly':
        return 'This Month';
      case 'yearly':
        return 'This Year';
      default:
        return period;
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this goal?')) {
      deleteGoal(goal.id);
      onDelete();
    }
  };

  return (
    <div className={styles.goalCard}>
      <div className={styles.goalHeader}>
        <h3>{goal.title}</h3>
        <button
          className={styles.deleteButton}
          onClick={handleDelete}
          title="Delete goal"
        >
          ×
        </button>
      </div>

      {goal.description && (
        <p className={styles.goalDescription}>{goal.description}</p>
      )}

      <div className={styles.goalInfo}>
        <div className={styles.goalTarget}>
          Target: {goal.target} {goal.type === 'time' ? 'minutes' : 'sessions'}{' '}
          {formatPeriod(goal.period)}
          {goal.activity && (
            <span className={styles.activityTag}> • {goal.activity}</span>
          )}
        </div>

        <div className={styles.goalProgress}>
          <div className={styles.progressText}>
            {current} / {goal.target} ({percentage}%)
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${percentage}%`,
                backgroundColor: percentage >= 100 ? '#4CAF50' : '#3B82F6',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
