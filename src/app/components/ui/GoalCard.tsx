// src/components/ui/GoalCard.tsx
'use client';

import { Goal } from '@/lib/timer';
import { ProgressBar } from './ProgressBar';
import styles from './GoalCard.module.css';
import cardStyles from '@/app/styles/shared/cards.module.css';

interface GoalCardProps {
  goal: Goal;
  progress: {
    current: number;
    percentage: number;
  };
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
  onGoalClick?: (goal: Goal) => void;
  isCompact?: boolean;
  showActions?: boolean;
  className?: string;
}

export function GoalCard({
  goal,
  progress,
  onEdit,
  onDelete,
  onGoalClick,
  isCompact = false,
  showActions = true,
  className = '',
}: GoalCardProps) {
  const formatPeriod = (period: string) => {
    const periodMap: Record<string, string> = {
      daily: 'Today',
      weekly: 'This Week',
      monthly: 'This Month',
      yearly: 'This Year',
    };
    return periodMap[period] || period;
  };

  const handleCardClick = () => {
    if (onGoalClick) {
      onGoalClick(goal);
    }
  };

  return (
    <div
      className={`${cardStyles.card} ${
        isCompact ? cardStyles.compactCard : ''
      } ${className}`}
      onClick={handleCardClick}
      style={{ cursor: onGoalClick ? 'pointer' : 'default' }}
    >
      <div className={cardStyles.cardHeader}>
        <h3 className={cardStyles.cardTitle}>{goal.title}</h3>
        {showActions && (onEdit || onDelete) && (
          <div className={styles.goalActions}>
            {onEdit && (
              <button
                className={styles.editButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(goal);
                }}
                title="Edit goal"
              >
                ✎
              </button>
            )}
            {onDelete && (
              <button
                className={styles.deleteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(goal.id);
                }}
                title="Delete goal"
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>

      {!isCompact && goal.description && (
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

        <ProgressBar
          percentage={progress.percentage}
          showLabel={true}
          label={`${progress.current} / ${goal.target} (${progress.percentage}%)`}
          className={styles.goalProgress}
        />
      </div>
    </div>
  );
}
