// src/app/components/dashboard/PriorityFocus.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Task, Goal } from '@/lib/timer';
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
        const allGoals: Goal[] = dbGoals.map((goalItem) => ({
          id: goalItem.id,
          title: goalItem.title,
          description: goalItem.description || undefined,
          type: goalItem.type as 'time' | 'sessions',
          target: goalItem.target,
          period: goalItem.period as 'daily' | 'weekly' | 'monthly' | 'yearly',
          startDate: goalItem.start_date,
          endDate: goalItem.end_date || undefined,
          createdAt: goalItem.created_at,
          activity: goalItem.activity || undefined,
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
          .filter(() => {
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
            .slice(0, 2); // Limit to 2 tasks per goal

          return {
            goal: goalItem,
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
    <div className="card">
      <h2 className="card__title">⚡ Priority Focus</h2>

      {(() => {
        const urgentTasks = getUrgentTasksFromAllSources();
        return urgentTasks.length > 0 ? (
          <div className="card__body">
            <h3 className="list-title">Urgent Tasks ({urgentTasks.length})</h3>
            <ul className="list">
              {urgentTasks.map((task: Task) => (
                <li
                  key={task.id}
                  className={`list-item ${
                    completingTask === task.id ? 'list-item--loading' : ''
                  }`}
                >
                  <div className="list-item__leading">
                    <div className="task-checkbox">
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        onChange={() => handleCompleteTask(task.id)}
                        disabled={completingTask === task.id}
                      />
                    </div>
                  </div>
                  <div className="list-item__content">
                    <span className="priority-badge">High</span>
                    <span className="list-item__text">{task.text}</span>
                  </div>
                  <div className="list-item__trailing">
                    {task.activity && (
                      <span className="activity-tag">{task.activity}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/tasks" className="btn btn--ghost btn--sm">
              View all tasks →
            </Link>
          </div>
        ) : (
          <div className="card__body">
            <h3 className="list-title">Urgent Tasks</h3>
            <p>No high priority tasks found</p>
          </div>
        );
      })()}

      {goalsWithTasks.length > 0 ? (
        <div className="card__body">
          <h3 className="list-title">
            Goals Needing Attention ({goalsWithTasks.length})
          </h3>
          <ul className="list">
            {goalsWithTasks.map((goalWithTask) => {
              const goal = goalWithTask.goal;
              const progress = goalWithTask.progress;
              const tasks = goalWithTask.tasks;

              return (
                <li key={goal.id} className="card card--compact">
                  <div className="card__header">
                    <div
                      className="progress-bar"
                      style={{ width: '3rem', height: '0.5rem' }}
                    >
                      <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="card__title">{goal.title}</span>
                    <span className="list-item__text">{progress}%</span>
                  </div>

                  {tasks.length > 0 ? (
                    <ul className="list list--compact">
                      {tasks.map((task) => (
                        <li
                          key={task.id}
                          className={`list-item list-item--compact ${
                            completingTask === task.id
                              ? 'list-item--loading'
                              : ''
                          }`}
                        >
                          <div className="list-item__leading">
                            <div className="task-checkbox">
                              <input
                                type="checkbox"
                                className="form-checkbox"
                                onChange={() => handleCompleteTask(task.id)}
                                disabled={completingTask === task.id}
                              />
                            </div>
                          </div>
                          <div className="list-item__content">
                            {task.priority === 'high' && (
                              <span className="priority-badge">High</span>
                            )}
                            <span className="list-item__text">{task.text}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="list-empty">
                      <p>No tasks for this goal</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <Link href="/goals" className="btn btn--ghost btn--sm">
            View all goals →
          </Link>
        </div>
      ) : (
        <div className="card__body">
          <h3 className="list-title">Goals Needing Attention</h3>
          <p>No goals with low progress found</p>
        </div>
      )}
    </div>
  );
}
