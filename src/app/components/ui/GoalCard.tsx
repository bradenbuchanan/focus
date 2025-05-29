// src/components/ui/GoalCard.tsx
'use client';

import { Goal } from '@/lib/timer';
import { ProgressBar } from './ProgressBar';

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
      className={`card ${isCompact ? 'card--compact' : ''} ${
        onGoalClick ? 'card--interactive' : ''
      } ${className}`}
      onClick={handleCardClick}
      style={{ cursor: onGoalClick ? 'pointer' : 'default' }}
    >
      <div className="card__header">
        <h3 className="card__title">{goal.title}</h3>
        {showActions && (onEdit || onDelete) && (
          <div className="card__actions">
            {onEdit && (
              <button
                className="btn--icon-action"
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
                className="btn--icon-action"
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

      <div className="card__body">
        {!isCompact && goal.description && (
          <p style={{ marginBottom: '1rem', opacity: '0.8' }}>
            {goal.description}
          </p>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>
            Target: {goal.target}{' '}
            {goal.type === 'time' ? 'minutes' : 'sessions'}{' '}
            {formatPeriod(goal.period)}
            {goal.activity && (
              <span className="activity-tag"> • {goal.activity}</span>
            )}
          </div>

          <ProgressBar
            percentage={progress.percentage}
            showLabel={true}
            label={`${progress.current} / ${goal.target} (${progress.percentage}%)`}
          />
        </div>
      </div>
    </div>
  );
}
