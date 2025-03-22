// src/app/components/goals/TasksList.tsx
'use client';

import { useState, useEffect } from 'react';
import { Task, getTasksForGoal, defaultActivityCategories } from '@/lib/timer';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import styles from './TaskList.module.css';

interface TasksListProps {
  goalId: string;
}

export default function TasksList({ goalId }: TasksListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [availableActivities, setAvailableActivities] = useState<string[]>([]);

  const loadTasks = () => {
    const goalTasks = getTasksForGoal(goalId);

    // Sort by completion status (incomplete first)
    goalTasks.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    setTasks(goalTasks);

    // Extract unique activities
    const activities = new Set<string>();
    goalTasks.forEach((task) => {
      if (task.activity) {
        activities.add(task.activity);
      }
    });

    setAvailableActivities(Array.from(activities));
  };

  useEffect(() => {
    loadTasks();
  }, [goalId]);

  // Filter tasks by activity
  const filteredTasks = tasks.filter((task) => {
    if (activityFilter === 'all') return true;
    return task.activity === activityFilter;
  });

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
        onAdd={loadTasks}
        activity={activityFilter !== 'all' ? activityFilter : undefined}
      />

      <div className={styles.tasksList}>
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskItem key={task.id} task={task} onUpdate={loadTasks} />
          ))
        ) : (
          <div className={styles.noTasks}>
            {activityFilter === 'all'
              ? 'No tasks yet. Break down your goal into manageable steps!'
              : `No tasks for ${activityFilter} yet. Add one above!`}
          </div>
        )}
      </div>
    </div>
  );
}
