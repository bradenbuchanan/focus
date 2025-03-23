// src/app/components/goals/TasksList.tsx
'use client';

import { useState, useEffect } from 'react';
import { Task, getTasksForGoal } from '@/lib/timer';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import styles from './TaskList.module.css';

interface TasksListProps {
  goalId: string;
}

export default function TasksList({ goalId }: TasksListProps) {
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [availableActivities, setAvailableActivities] = useState<string[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);

  const loadTasks = () => {
    const goalTasks = getTasksForGoal(goalId);

    // Separate active and completed
    const active = goalTasks.filter((task) => !task.completed);
    const completed = goalTasks.filter((task) => task.completed);

    // Sort active tasks by due date and creation date
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

    // Sort completed by completion date
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
  const getFilteredTasks = (tasks: Task[]) => {
    if (activityFilter === 'all') return tasks;
    return tasks.filter((task) => task.activity === activityFilter);
  };

  const filteredActiveTasks = getFilteredTasks(activeTasks);
  const filteredCompletedTasks = getFilteredTasks(completedTasks);

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
        {filteredActiveTasks.length > 0 ? (
          filteredActiveTasks.map((task) => (
            <TaskItem key={task.id} task={task} onUpdate={loadTasks} />
          ))
        ) : (
          <div className={styles.noTasks}>
            {activityFilter === 'all'
              ? 'No active tasks yet. Break down your goal into manageable steps!'
              : `No active tasks for ${activityFilter} yet. Add one above!`}
          </div>
        )}
      </div>

      {/* Toggle for completed tasks */}
      {filteredCompletedTasks.length > 0 && (
        <div className={styles.completedTasksSection}>
          <button
            className={styles.toggleCompletedButton}
            onClick={() => setShowCompleted(!showCompleted)}
          >
            {showCompleted ? 'Hide' : 'Show'} completed tasks (
            {filteredCompletedTasks.length})
            <span className={styles.toggleIcon}>
              {showCompleted ? '▲' : '▼'}
            </span>
          </button>

          {showCompleted && (
            <div className={styles.completedTasksList}>
              {filteredCompletedTasks.map((task) => (
                <TaskItem key={task.id} task={task} onUpdate={loadTasks} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
