// src/app/components/goals/GoalCard.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Goal,
  calculateGoalProgress,
  deleteGoal,
  getTasksForGoal,
  Task,
} from '@/lib/timer';
import styles from './GoalCard.module.css';
import GoalEditForm from './GoalEditForm';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';

interface GoalCardProps {
  goal: Goal;
  onDelete: () => void;
  onEdit: () => void;
}

export default function GoalCard({ goal, onDelete, onEdit }: GoalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const { current, percentage } = calculateGoalProgress(goal);

  // Load tasks associated with this goal
  const loadTasks = useCallback(() => {
    const goalTasks = getTasksForGoal(goal.id);

    // Separate active and completed tasks
    const active = goalTasks.filter((task) => !task.completed);
    const completed = goalTasks.filter((task) => task.completed);

    // Sort active tasks by due date then by creation date
    active.sort((a, b) => {
      // First sort by due date (if available)
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (a.dueDate) {
        return -1; // a has due date, b doesn't, a comes first
      } else if (b.dueDate) {
        return 1; // b has due date, a doesn't, b comes first
      }

      // Then by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Sort completed tasks by completion date
    completed.sort((a, b) => {
      const dateA = a.completedAt
        ? new Date(a.completedAt)
        : new Date(a.createdAt);
      const dateB = b.completedAt
        ? new Date(b.completedAt)
        : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    setActiveTasks(active);
    setCompletedTasks(completed);
  }, [goal.id]); // Now goal.id is the only dependency

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

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

  const handleEditComplete = () => {
    setIsEditing(false);
    onEdit();
  };

  const handleTaskUpdate = () => {
    loadTasks();
    onEdit(); // Notify parent component in case goal progress is affected
  };

  if (isEditing) {
    return (
      <GoalEditForm
        goal={goal}
        onCancel={() => setIsEditing(false)}
        onSave={handleEditComplete}
      />
    );
  }

  return (
    <div className={styles.goalCard}>
      <div className={styles.goalHeader}>
        <h3>{goal.title}</h3>
        <div className={styles.goalActions}>
          <button
            className={styles.editButton}
            onClick={() => setIsEditing(true)}
            title="Edit goal"
          >
            ✎
          </button>
          <button
            className={styles.deleteButton}
            onClick={handleDelete}
            title="Delete goal"
          >
            ×
          </button>
        </div>
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

      {/* Tasks section */}
      <div className={styles.tasksContainer}>
        <h4 className={styles.tasksHeader}>Tasks for this Goal</h4>

        <TaskForm goalId={goal.id} onAdd={handleTaskUpdate} />

        <div className={styles.tasksList}>
          {activeTasks.length > 0 ? (
            activeTasks.map((task) => (
              <TaskItem key={task.id} task={task} onUpdate={handleTaskUpdate} />
            ))
          ) : (
            <div className={styles.noTasks}>
              No active tasks yet. Break down your goal into manageable steps!
            </div>
          )}
        </div>

        {/* Toggle for completed tasks */}
        {completedTasks.length > 0 && (
          <div className={styles.completedTasksSection}>
            <button
              className={styles.toggleCompletedButton}
              onClick={() => setShowCompleted(!showCompleted)}
            >
              {showCompleted ? 'Hide' : 'Show'} completed tasks (
              {completedTasks.length})
              <span className={styles.toggleIcon}>
                {showCompleted ? '▲' : '▼'}
              </span>
            </button>

            {showCompleted && (
              <div className={styles.completedTasksList}>
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onUpdate={handleTaskUpdate}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
