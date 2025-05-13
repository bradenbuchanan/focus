// src/components/ui/TaskItem.tsx
'use client';

import { useState } from 'react';
import { Task } from '@/lib/timer';
import styles from './TaskItem.module.css';

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

  const priorityClass =
    styles[
      `priority${task.priority?.charAt(0).toUpperCase()}${task.priority?.slice(
        1
      )}`
    ];
  const dueDateStatus = getDueDateStatus();

  return (
    <div
      className={`${styles.taskItem} ${
        task.completed ? styles.completed : ''
      } ${isCompact ? styles.compact : ''} ${className}`}
    >
      <div className={styles.taskCheckbox}>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={handleToggle}
          disabled={isLoading}
        />
      </div>

      <div className={styles.taskContent}>
        <div className={styles.taskText}>{task.text}</div>

        {showMeta && (task.priority || task.activity || task.dueDate) && (
          <div className={styles.taskMeta}>
            {task.priority && (
              <span className={`${styles.priorityTag} ${priorityClass}`}>
                {task.priority}
              </span>
            )}
            {task.activity && (
              <span className={styles.activityTag}>{task.activity}</span>
            )}
            {task.dueDate && (
              <span
                className={`${styles.dueDate} ${
                  styles[
                    `dueDate${dueDateStatus
                      .charAt(0)
                      .toUpperCase()}${dueDateStatus.slice(1)}`
                  ]
                }`}
              >
                {formatDueDate(task.dueDate)}
              </span>
            )}
          </div>
        )}
      </div>

      {showActions && (onEdit || onDelete) && (
        <div className={styles.taskActions}>
          {onEdit && (
            <button
              className={styles.editButton}
              onClick={() => onEdit(task)}
              title="Edit task"
            >
              ✎
            </button>
          )}
          {onDelete && (
            <button
              className={styles.deleteButton}
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
