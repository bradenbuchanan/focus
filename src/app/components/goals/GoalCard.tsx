// src/app/components/goals/GoalCard.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Goal,
  calculateGoalProgress,
  deleteGoal,
  getTasksForGoal,
} from '@/lib/timer';
import styles from '../../../app/goals/goals.module.css';
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
  const [tasks, setTasks] = useState<any[]>([]);
  const { current, percentage } = calculateGoalProgress(goal);

  // Load tasks associated with this goal
  const loadTasks = () => {
    const goalTasks = getTasksForGoal(goal.id);
    // Sort by completion status (incomplete first)
    goalTasks.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setTasks(goalTasks);
  };

  useEffect(() => {
    loadTasks();
  }, [goal.id]);

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
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <TaskItem key={task.id} task={task} onUpdate={handleTaskUpdate} />
            ))
          ) : (
            <div className={styles.noTasks}>
              No tasks yet. Break down your goal into manageable steps!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
