// src/app/components/dashboard/PriorityFocus.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Task,
  Goal,
  getTasks,
  getGoals,
  getTasksForGoal,
  calculateGoalProgress,
  updateTask,
} from '@/lib/timer';
import styles from './priorityFocus.module.css';
import { useData } from '@/providers/DataProvider';

export default function PriorityFocus() {
  // Move the useData call inside the component
  const { updateTask: updateServerTask } = useData();

  const [highPriorityTasks, setHighPriorityTasks] = useState<Task[]>([]);
  const [goalsWithTasks, setGoalsWithTasks] = useState<
    Array<{
      goal: Goal;
      progress: number;
      tasks: Task[];
    }>
  >([]);
  const [completingTask, setCompletingTask] = useState<string | null>(null);

  // Helper function to get urgent tasks from all sources
  const getUrgentTasksFromAllSources = () => {
    // Standalone urgent tasks
    const standaloneUrgent = highPriorityTasks;

    // Urgent tasks from goals
    const goalUrgent = goalsWithTasks
      .flatMap(({ tasks }) => tasks)
      .filter((task) => task.priority === 'high');

    // Combine and limit to 3 total
    return [...standaloneUrgent, ...goalUrgent].slice(0, 3);
  };

  // Handle completing a task
  const handleCompleteTask = async (taskId: string) => {
    setCompletingTask(taskId);

    try {
      // Find the task
      const allTasks = getTasks();
      const task = allTasks.find((t) => t.id === taskId);

      if (task) {
        // Update the task in Supabase
        await updateServerTask({
          id: taskId,
          completed: true,
          completedAt: new Date().toISOString(),
        });

        // Update the UI immediately
        setHighPriorityTasks((prev) => prev.filter((t) => t.id !== taskId));
        setGoalsWithTasks((prev) =>
          prev.map((goalWithTasks) => ({
            ...goalWithTasks,
            tasks: goalWithTasks.tasks.filter((t) => t.id !== taskId),
          }))
        );
      }
    } catch (error) {
      console.error('Error completing task:', error);
      // Fallback to localStorage
      const allTasks = getTasks();
      const taskIndex = allTasks.findIndex((t) => t.id === taskId);

      if (taskIndex !== -1) {
        const task = allTasks[taskIndex];
        const updatedTask = {
          ...task,
          completed: true,
          completedAt: new Date().toISOString(),
        };

        updateTask(updatedTask);
      }
    } finally {
      setCompletingTask(null);
    }
  };

  useEffect(() => {
    try {
      // Get all tasks
      const allTasks = getTasks();

      // Filter for high priority standalone tasks (tasks without a goalId)
      const standaloneUrgentTasks = allTasks
        .filter(
          (task) => !task.completed && task.priority === 'high' && !task.goalId
        )
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        .slice(0, 2); // Only show top 2 standalone tasks

      setHighPriorityTasks(standaloneUrgentTasks);

      // Get goals that need attention
      const allGoals = getGoals();
      const needAttentionGoals = allGoals
        .filter((goal) => {
          const progress = calculateGoalProgress(goal);
          return progress.percentage < 40 && progress.percentage < 100;
        })
        .slice(0, 2); // Only show top 2

      // For each goal, find associated tasks
      const goalsWithTheirTasks = needAttentionGoals.map((goal) => {
        const goalTasks = getTasksForGoal(goal.id)
          .filter((task) => !task.completed)
          .sort((a, b) => {
            if (a.priority !== b.priority) {
              if (a.priority === 'high') return -1;
              if (b.priority === 'high') return 1;
              if (a.priority === 'medium') return -1;
              return 1;
            }
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          })
          .slice(0, 2); // Limit to 2 tasks per goal

        return {
          goal,
          progress: calculateGoalProgress(goal).percentage,
          tasks: goalTasks,
        };
      });

      setGoalsWithTasks(goalsWithTheirTasks);
    } catch (error) {
      console.error('Error in PriorityFocus component:', error);
    }
  }, []);

  return (
    <div className={styles.priorityContainer}>
      <h2 className={styles.priorityTitle}>Priority Focus</h2>

      {(() => {
        const urgentTasks = getUrgentTasksFromAllSources();
        return urgentTasks.length > 0 ? (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              Urgent Tasks ({urgentTasks.length})
            </h3>
            <ul className={styles.priorityList}>
              {urgentTasks.map((task) => (
                <li key={task.id} className={styles.priorityItem}>
                  <div className={styles.taskCheckbox}>
                    <input
                      type="checkbox"
                      onChange={() => handleCompleteTask(task.id)}
                      disabled={completingTask === task.id}
                    />
                  </div>
                  <span className={styles.priorityBadge}>High</span>
                  <span className={styles.priorityText}>{task.text}</span>
                  {task.activity && (
                    <span className={styles.activityTag}>{task.activity}</span>
                  )}
                </li>
              ))}
            </ul>
            <Link href="/tasks" className={styles.viewAllLink}>
              View all tasks →
            </Link>
          </div>
        ) : (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Urgent Tasks</h3>
            <p>No high priority tasks found</p>
          </div>
        );
      })()}

      {goalsWithTasks.length > 0 ? (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Goals Needing Attention ({goalsWithTasks.length})
          </h3>
          <ul className={styles.priorityList}>
            {goalsWithTasks.map(({ goal, progress, tasks }) => (
              <li key={goal.id} className={styles.goalItem}>
                <div className={styles.goalHeader}>
                  <div className={styles.goalProgress}>
                    <div
                      className={styles.progressBar}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className={styles.priorityText}>{goal.title}</span>
                  <span className={styles.progressText}>{progress}%</span>
                </div>

                {tasks.length > 0 ? (
                  <ul className={styles.goalTasks}>
                    {tasks.map((task) => (
                      <li key={task.id} className={styles.goalTask}>
                        <div className={styles.taskCheckbox}>
                          <input
                            type="checkbox"
                            onChange={() => handleCompleteTask(task.id)}
                            disabled={completingTask === task.id}
                          />
                        </div>
                        {task.priority === 'high' && (
                          <span className={styles.taskPriority}>High</span>
                        )}
                        <span className={styles.taskText}>{task.text}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={styles.noTasks}>No tasks for this goal</div>
                )}
              </li>
            ))}
          </ul>
          <Link href="/goals" className={styles.viewAllLink}>
            View all goals →
          </Link>
        </div>
      ) : (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Goals Needing Attention</h3>
          <p>No goals with low progress found</p>
        </div>
      )}
    </div>
  );
}
