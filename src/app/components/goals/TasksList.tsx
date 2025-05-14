// src/app/components/goals/TasksList.tsx
'use client';

import { useEffect, useState } from 'react';
import { getTasksForGoal } from '@/lib/timer';
import { TaskList } from '../../components/ui/TaskList';
import TaskForm from './TaskForm';
import styles from './TaskList.module.css';

interface TasksListProps {
  goalId: string;
}

export default function TasksList({ goalId }: TasksListProps) {
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [availableActivities, setAvailableActivities] = useState<string[]>([]);

  useEffect(() => {
    const tasks = getTasksForGoal(goalId);
    const activities = new Set(
      tasks
        .map((t) => t.activity)
        .filter((activity): activity is string => Boolean(activity))
    );
    setAvailableActivities(Array.from(activities));
  }, [goalId]);

  const handleTaskUpdate = () => {
    // Refresh tasks
    const tasks = getTasksForGoal(goalId);
    const activities = new Set(
      tasks
        .map((t) => t.activity)
        .filter((activity): activity is string => Boolean(activity))
    );
    setAvailableActivities(Array.from(activities));
  };

  return (
    <div className={styles.tasksContainer}>
      <h4 className={styles.tasksHeader}>Tasks for this Goal</h4>

      {availableActivities.length > 0 && (
        <div className={styles.filterBar}>
          <div className={styles.activityFilters}>
            <span className={styles.filterLabel}>Filter by Activity:</span>
            <div className={styles.activityButtons}>
              <button
                className={`${styles.activityButton} ${
                  activityFilter === 'all' ? styles.active : ''
                }`}
                onClick={() => setActivityFilter('all')}
              >
                All Activities
              </button>
              {availableActivities.map((activity) => (
                <button
                  key={activity}
                  className={`${styles.activityButton} ${
                    activityFilter === activity ? styles.active : ''
                  }`}
                  onClick={() => setActivityFilter(activity)}
                >
                  {activity}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <TaskForm
        goalId={goalId}
        onAdd={handleTaskUpdate}
        activity={activityFilter !== 'all' ? activityFilter : undefined}
      />

      <TaskList
        goalId={goalId}
        filter={showCompleted ? 'all' : 'active'}
        activityFilter={activityFilter}
        onTaskUpdate={handleTaskUpdate}
      />

      <button
        className={styles.toggleCompletedButton}
        onClick={() => setShowCompleted(!showCompleted)}
      >
        {showCompleted ? 'Hide' : 'Show'} completed tasks
      </button>
    </div>
  );
}
