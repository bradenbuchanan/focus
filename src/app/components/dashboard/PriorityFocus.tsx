// src/app/components/dashboard/PriorityFocus.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Task, Goal } from '@/lib/timer';
import styles from './priorityFocus.module.css';
import cardStyles from '@/app/styles/shared/cards.module.css';
import listStyles from '@/app/styles/shared/lists.module.css';
import { useData } from '@/providers/DataProvider';

interface GoalWithTasks {
  goal: Goal;
  progress: number;
  tasks: Task[];
}

export default function PriorityFocus() {
  const { getTasks, getGoals, updateTask } = useData();

  const [highPriorityTasks, setHighPriorityTasks] = useState<Task[]>([]);
  const [goalsWithTasks, setGoalsWithTasks] = useState<GoalWithTasks[]>([]);
  const [completingTask, setCompletingTask] = useState<string | null>(null);

  // Helper functions and data fetching remain the same
  const getUrgentTasksFromAllSources = () => {
    const standaloneUrgent = highPriorityTasks;
    const goalUrgent = goalsWithTasks
      .flatMap(({ tasks }: GoalWithTasks) => tasks)
      .filter((task: Task) => task.priority === 'high');
    return [...standaloneUrgent, ...goalUrgent].slice(0, 3);
  };

  const handleCompleteTask = async (taskId: string) => {
    setCompletingTask(taskId);

    try {
      await updateTask({
        id: taskId,
        completed: true,
        completedAt: new Date().toISOString(),
      });

      setHighPriorityTasks((prev: Task[]) =>
        prev.filter((t: Task) => t.id !== taskId)
      );
      setGoalsWithTasks((prev: GoalWithTasks[]) =>
        prev.map((goalWithTasks: GoalWithTasks) => ({
          ...goalWithTasks,
          tasks: goalWithTasks.tasks.filter((t: Task) => t.id !== taskId),
        }))
      );
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setCompletingTask(null);
    }
  };

  // Data fetching useEffect remains the same
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
        const goalsWithTheirTasks = needAttentionGoals.map((goalItem) => {
          const goalTasks = allTasks
            .filter((task) => task.goalId === goalItem.id && !task.completed)
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
            .slice(0, 2);

          return {
            goal: goalItem,
            progress: 0,
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
    <div className={`${cardStyles.card} ${styles.priorityContainer}`}>
      <h2 className={styles.priorityTitle}>Priority Focus</h2>

      {(() => {
        const urgentTasks = getUrgentTasksFromAllSources();
        return urgentTasks.length > 0 ? (
          <div className={styles.section}>
            <h3 className={`${listStyles.listTitle} ${styles.sectionTitle}`}>
              Urgent Tasks ({urgentTasks.length})
            </h3>
            <ul
              className={`${listStyles.listContainer} ${styles.priorityList}`}
            >
              {urgentTasks.map((task: Task) => (
                <li
                  key={task.id}
                  className={`${listStyles.listItem} ${styles.priorityItem} ${
                    completingTask === task.id ? styles.completing : ''
                  }`}
                >
                  <div className={styles.taskCheckbox}>
                    <input
                      type="checkbox"
                      onChange={() => handleCompleteTask(task.id)}
                      disabled={completingTask === task.id}
                    />
                  </div>
                  <span className={styles.priorityBadge}>High</span>
                  <span
                    className={`${listStyles.listItemText} ${styles.priorityText}`}
                  >
                    {task.text}
                  </span>
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
            <h3 className={`${listStyles.listTitle} ${styles.sectionTitle}`}>
              Urgent Tasks
            </h3>
            <p>No high priority tasks found</p>
          </div>
        );
      })()}

      {goalsWithTasks.length > 0 ? (
        <div className={styles.section}>
          <h3 className={`${listStyles.listTitle} ${styles.sectionTitle}`}>
            Goals Needing Attention ({goalsWithTasks.length})
          </h3>
          <ul className={`${listStyles.listContainer} ${styles.priorityList}`}>
            {goalsWithTasks.map(({ goal, progress, tasks }: GoalWithTasks) => (
              <li
                key={goal.id}
                className={`${cardStyles.card} ${cardStyles.compactCard} ${styles.goalItem}`}
              >
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
                  <ul
                    className={`${listStyles.listContainer} ${styles.goalTasks}`}
                  >
                    {tasks.map((task) => (
                      <li
                        key={task.id}
                        className={`${listStyles.listItem} ${
                          listStyles.compactListItem
                        } ${styles.goalTask} ${
                          completingTask === task.id ? styles.completing : ''
                        }`}
                      >
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
                        <span
                          className={`${listStyles.listItemText} ${styles.taskText}`}
                        >
                          {task.text}
                        </span>
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
          <h3 className={`${listStyles.listTitle} ${styles.sectionTitle}`}>
            Goals Needing Attention
          </h3>
          <p>No goals with low progress found</p>
        </div>
      )}
    </div>
  );
}
