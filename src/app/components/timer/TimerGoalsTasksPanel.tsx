// src/app/components/timer/TimerGoalsTasksPanel.tsx
'use client';

import { useState, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState<'goals' | 'tasks'>('goals');
  const [relevantGoals, setRelevantGoals] = useState<
    (Goal & { progress: number })[]
  >([]);
  const [relevantTasks, setRelevantTasks] = useState<Task[]>([]);

  // Load relevant goals and tasks based on selected activity
  useEffect(() => {
    // Get all goals
    const allGoals = getGoals();

    // Filter goals based on selected activity or show all if none is selected
    const filteredGoals = allGoals.filter(
      (goal) => !goal.activity || goal.activity === activity
    );

    // Add progress information to each goal
    const goalsWithProgress = filteredGoals.map((goal) => ({
      ...goal,
      progress: calculateGoalProgress(goal).percentage,
    }));

    // Sort by progress (least to most)
    goalsWithProgress.sort((a, b) => a.progress - b.progress);

    setRelevantGoals(goalsWithProgress);

    // Get all tasks
    const allTasks = getTasks();

    // Filter active tasks based on activity or show all if none is selected
    const filteredTasks = allTasks.filter(
      (task) =>
        !task.completed && (!task.activity || task.activity === activity)
    );

    // Sort by priority (high to low) and then by due date
    filteredTasks.sort((a, b) => {
      // First sort by priority
      if (a.priority && b.priority) {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        if (a.priority === 'medium' && b.priority === 'low') return -1;
        if (a.priority === 'low' && b.priority === 'medium') return 1;
      }

      // Then by due date if available
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (a.dueDate) {
        return -1; // a has due date, b doesn't, a comes first
      } else if (b.dueDate) {
        return 1; // b has due date, a doesn't, b comes first
      }

      // Finally by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    setRelevantTasks(filteredTasks);
  }, [activity]);

  // Handle completing a task
  const handleCompleteTask = (taskId: string) => {
    onTaskComplete(taskId);

    // Update local state to reflect the change immediately
    setRelevantTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  // Format progress percentage for display
  const formatProgress = (progress: number) => {
    return Math.min(100, Math.round(progress));
  };

  return (
    <div className={styles.panelContainer}>
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${
            activeTab === 'goals' ? styles.activeTab : ''
          }`}
          onClick={() => setActiveTab('goals')}
        >
          Goals
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === 'tasks' ? styles.activeTab : ''
          }`}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks
        </button>
      </div>

      <div className={styles.panelContent}>
        {activeTab === 'goals' ? (
          <div className={styles.goalsList}>
            <h3 className={styles.sectionTitle}>
              {activity ? `Goals for ${activity}` : 'Current Goals'}
            </h3>

            {relevantGoals.length > 0 ? (
              relevantGoals.map((goal) => (
                <div key={goal.id} className={styles.goalItem}>
                  <div className={styles.goalHeader}>
                    <h4>{goal.title}</h4>
                    <span className={styles.goalProgress}>
                      {formatProgress(goal.progress)}%
                    </span>
                  </div>

                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${formatProgress(goal.progress)}%`,
                        backgroundColor:
                          goal.progress >= 100 ? '#4CAF50' : '#3B82F6',
                      }}
                    />
                  </div>

                  <div className={styles.goalDetails}>
                    <span>
                      {goal.target}{' '}
                      {goal.type === 'time' ? 'minutes' : 'sessions'}{' '}
                      {goal.period}
                    </span>
                    {goal.activity && (
                      <span className={styles.activityTag}>
                        {goal.activity}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No active goals for this activity.</p>
                <a href="/goals" className={styles.actionLink}>
                  Create a goal
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.tasksList}>
            <h3 className={styles.sectionTitle}>
              {activity ? `Tasks for ${activity}` : 'Current Tasks'}
            </h3>

            {relevantTasks.length > 0 ? (
              relevantTasks.map((task) => (
                <div key={task.id} className={styles.taskItem}>
                  <div className={styles.taskCheckbox}>
                    <input
                      type="checkbox"
                      onChange={() => handleCompleteTask(task.id)}
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
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No active tasks for this activity.</p>
                <a href="/tasks" className={styles.actionLink}>
                  Add a task
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
