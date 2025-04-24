// src/app/components/timer/TimerGoalsTasksPanel.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Goal,
  Task,
  getGoals,
  getTasks,
  calculateGoalProgress,
  updateTask,
} from '@/lib/timer';
import styles from './timerGoalsTasks.module.css';

interface TimerGoalsTasksPanelProps {
  activity: string;
  onTaskComplete: (taskId: string) => void;
}

export default function TimerGoalsTasksPanel({
  activity,
  onTaskComplete,
}: TimerGoalsTasksPanelProps) {
  const [relevantTasks, setRelevantTasks] = useState<Task[]>([]);
  const [relevantGoals, setRelevantGoals] = useState<
    (Goal & { progress: number })[]
  >([]);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  // Function to load tasks and goals
  const loadData = useCallback(() => {
    const allTasks = getTasks();
    const filteredTasks = allTasks.filter((task) => {
      const isNotCompleted = !task.completed;
      const matchesActivity = !task.activity || task.activity === activity;
      return isNotCompleted && matchesActivity;
    });
    setRelevantTasks(filteredTasks);

    const allGoals = getGoals();
    const filteredGoals = allGoals.filter(
      (goal) => !goal.activity || goal.activity === activity
    );
    const goalsWithProgress = filteredGoals.map((goal) => ({
      ...goal,
      progress: calculateGoalProgress(goal).percentage,
    }));
    setRelevantGoals(goalsWithProgress);
  }, [activity]);

  // Load data on mount and when activity changes
  useEffect(() => {
    loadData();
  }, [activity, loadData]);

  // Handle task completion
  const handleTaskComplete = async (taskId: string) => {
    setCompletingTaskId(taskId);
    try {
      // Get the task
      const tasks = getTasks();
      const task = tasks.find((t) => t.id === taskId);

      if (task) {
        // Update the task
        const updatedTask = {
          ...task,
          completed: true,
          completedAt: new Date().toISOString(),
        };

        // Save the updated task
        await onTaskComplete(taskId);

        // Update local storage
        updateTask(updatedTask);

        // Remove from current view
        setRelevantTasks((prevTasks) =>
          prevTasks.filter((t) => t.id !== taskId)
        );

        // Force a reload of all data
        loadData();
      }
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setCompletingTaskId(null);
    }
  };

  return (
    <div className={styles.panelContainer}>
      <div className={styles.tasksSection}>
        <h3 className={styles.sectionTitle}>
          {activity ? `Tasks for ${activity}` : 'Current Tasks'}
        </h3>

        {relevantTasks.length > 0 ? (
          <div className={styles.tasksList}>
            {relevantTasks.map((task) => (
              <div
                key={task.id}
                className={`${styles.taskItem} ${
                  completingTaskId === task.id ? styles.completing : ''
                }`}
              >
                <div className={styles.taskCheckbox}>
                  <input
                    type="checkbox"
                    onChange={() => handleTaskComplete(task.id)}
                    disabled={completingTaskId === task.id}
                  />
                </div>
                <div className={styles.taskContent}>
                  <div className={styles.taskText}>{task.text}</div>
                  <div className={styles.taskMeta}>
                    {task.priority && (
                      <span
                        className={`${styles.priorityTag} ${
                          styles[
                            `priority${
                              task.priority.charAt(0).toUpperCase() +
                              task.priority.slice(1)
                            }`
                          ]
                        }`}
                      >
                        {task.priority}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className={styles.dueDate}>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No active tasks for {activity || 'any activity'}.</p>
          </div>
        )}
      </div>

      {/* Show goals section */}
      <div className={styles.goalsSection}>
        <h3 className={styles.sectionTitle}>
          {activity ? `Goals for ${activity}` : 'Current Goals'}
        </h3>

        {relevantGoals.length > 0 ? (
          <div className={styles.goalsList}>
            {relevantGoals.map((goal) => (
              <div key={goal.id} className={styles.goalItem}>
                <div className={styles.goalHeader}>
                  <h4>{goal.title}</h4>
                  <span className={styles.goalProgress}>
                    {Math.round(goal.progress)}%
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${goal.progress}%`,
                      backgroundColor:
                        goal.progress >= 100 ? '#4CAF50' : '#3B82F6',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No active goals for {activity || 'any activity'}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
