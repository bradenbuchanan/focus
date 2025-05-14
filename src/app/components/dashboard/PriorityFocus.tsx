// src/app/components/dashboard/PriorityFocus.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Task, Goal, calculateGoalProgress } from '@/lib/timer';
import styles from './priorityFocus.module.css';
import { useData } from '@/providers/DataProvider';

export default function PriorityFocus() {
  const { getTasks, getGoals, updateTask } = useData();

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
      // Update the task using the data provider
      await updateTask({
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
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setCompletingTask(null);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        // Get all tasks and goals using the data provider
        const [dbTasks, dbGoals] = await Promise.all([getTasks(), getGoals()]);

        // Convert database tasks to app format
        const allTasks: Task[] = dbTasks.map((task) => ({
          id: task.id,
          goalId: task.goal_id || undefined,
          text: task.text,
          completed: task.completed,
          createdAt: task.created_at,
          dueDate: task.due_date || undefined,
          activity: task.activity || undefined,
          priority: (task.priority as 'low' | 'medium' | 'high') || 'medium',
          completedAt: task.completed_at || undefined,
        }));

        // Convert database goals to app format
        const allGoals: Goal[] = dbGoals.map((goal) => ({
          id: goal.id,
          title: goal.title,
          description: goal.description || undefined,
          type: goal.type as 'time' | 'sessions',
          target: goal.target,
          period: goal.period as 'daily' | 'weekly' | 'monthly' | 'yearly',
          startDate: goal.start_date,
          endDate: goal.end_date || undefined,
          createdAt: goal.created_at,
          activity: goal.activity || undefined,
        }));

        // Filter for high priority standalone tasks (tasks without a goalId)
        const standaloneUrgentTasks = allTasks
          .filter(
            (task) =>
              !task.completed && task.priority === 'high' && !task.goalId
          )
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
          .slice(0, 2); // Only show top 2 standalone tasks

        setHighPriorityTasks(standaloneUrgentTasks);

        // Get goals that need attention (less than 40% progress)
        const needAttentionGoals = allGoals
          .filter((goal) => {
            // We need sessions to calculate progress
            // For now, we'll use a simple check
            return true; // Just include all goals for simplicity
          })
          .slice(0, 2); // Only show top 2

        // For each goal, find associated tasks
        const goalsWithTheirTasks = needAttentionGoals.map((goal) => {
          const goalTasks = allTasks
            .filter((task) => task.goalId === goal.id && !task.completed)
            .sort((a, b) => {
              if (a.priority !== b.priority) {
                if (a.priority === 'high') return -1;
                if (b.priority === 'high') return 1;
                if (a.priority === 'medium') return -1;
                return 1;
              }
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            })
            .slice(0, 2); // Limit to 2 tasks per goal

          return {
            goal,
            progress: 0, // We'll set this to 0 for now since we need sessions to calculate
            tasks: goalTasks,
          };
        });

        setGoalsWithTasks(goalsWithTheirTasks);
      } catch (error) {
        console.error('Error in PriorityFocus component:', error);
      }
    }

    loadData();
  }, [getTasks, getGoals]);

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
