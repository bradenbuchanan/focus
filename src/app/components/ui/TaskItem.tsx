// src/components/ui/TaskItem.tsx
'use client';

import { useState } from 'react';
import { Task } from '@/lib/timer';

interface TaskItemProps {
  task: Task;
  onToggleComplete?: (taskId: string) => void | Promise<void>;
  onEdit?: (task: Task) => void | Promise<void>;
  onDelete?: (taskId: string) => void | Promise<void>;
  showActions?: boolean;
  showMeta?: boolean;
  isCompact?: boolean;
  className?: string;
}

export function TaskItem({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  showActions = true,
  showMeta = true,
  isCompact = false,
  className = '',
}: TaskItemProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (!onToggleComplete || isLoading) return;

    setIsLoading(true);
    try {
      await onToggleComplete(task.id);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDueDate = (dateString: string) => {
    if (!dateString) return '';

    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const timeDiff = dueDate.getTime() - today.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);

    if (daysDiff < 0) return 'Overdue';
    if (daysDiff === 0) return 'Today';
    if (daysDiff === 1) return 'Tomorrow';

    return dueDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDueDateStatus = () => {
    if (!task.dueDate) return 'none';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    const timeDiff = dueDate.getTime() - today.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);

    if (daysDiff < 0) return 'overdue';
    if (daysDiff <= 2) return 'soon';
    return 'future';
  };

  const getPriorityClass = () => {
    if (!task.priority) return '';
    switch (task.priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  };

  const getDueDateClass = () => {
    const status = getDueDateStatus();
    switch (status) {
      case 'overdue':
        return 'due-date-overdue';
      case 'soon':
        return 'due-date-soon';
      case 'future':
        return 'due-date-future';
      default:
        return '';
    }
  };

  return (
    <div
      className={`list-item ${task.completed ? 'list-item--completed' : ''} ${
        isCompact ? 'list-item--compact' : ''
      } ${isLoading ? 'list-item--loading' : ''} ${className}`}
    >
      <div className="list-item__leading">
        <div className="task-checkbox">
          <input
            type="checkbox"
            className="form-checkbox"
            checked={task.completed}
            onChange={handleToggle}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="list-item__content">
        <div className="list-item__text">{task.text}</div>

        {showMeta && (task.priority || task.activity || task.dueDate) && (
          <div className="task-meta">
            {task.priority && (
              <span className={`priority-tag ${getPriorityClass()}`}>
                {task.priority}
              </span>
            )}
            {task.activity && (
              <span className="activity-tag">{task.activity}</span>
            )}
            {task.dueDate && (
              <span className={`due-date ${getDueDateClass()}`}>
                {formatDueDate(task.dueDate)}
              </span>
            )}
          </div>
        )}
      </div>

      {showActions && (onEdit || onDelete) && (
        <div className="list-item__trailing">
          {onEdit && (
            <button
              className="btn--icon-action"
              onClick={() => onEdit(task)}
              title="Edit task"
            >
              ✎
            </button>
          )}
          {onDelete && (
            <button
              className="btn--icon-action"
              onClick={() => onDelete(task.id)}
              title="Delete task"
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
}
