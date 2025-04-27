'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Goal, Task, calculateGoalProgress } from '@/lib/timer';
import { Database } from '@/types/supabase';
import styles from './timerGoalsTasks.module.css';
import { useData } from '@/providers/DataProvider';
import { supabase } from '@/lib/supabase';

type SupabaseTask = Database['public']['Tables']['tasks']['Row'];
type SupabaseGoal = Database['public']['Tables']['goals']['Row'];

interface TimerGoalsTasksPanelProps {
  activity: string | undefined;
  onTaskComplete: (taskId: string) => Promise<void>;
}

// Helper function to convert Supabase task to local Task type
const convertSupabaseTask = (task: SupabaseTask): Task => ({
  id: task.id,
  goalId: task.goal_id || undefined,
  text: task.text,
  completed: task.completed,
  createdAt: task.created_at,
  dueDate: task.due_date || undefined,
  activity: task.activity || undefined,
  priority: (task.priority as 'low' | 'medium' | 'high') || undefined,
  completedAt: task.completed_at || undefined,
});

// Helper function to convert Supabase goal to local Goal type
const convertSupabaseGoal = (goal: SupabaseGoal): Goal => ({
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
});

export default function TimerGoalsTasksPanel({
  activity,
  onTaskComplete,
}: TimerGoalsTasksPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [relevantTasks, setRelevantTasks] = useState<Task[]>([]);
  const [relevantGoals, setRelevantGoals] = useState<
    (Goal & { progress: number })[]
  >([]);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const { getTasks, getGoals, updateTask } = useData();

  const debugTasks = async () => {
    try {
      console.log('Starting task debug...');
      const allTasks = await getTasks();
      console.log('Tasks from service:', {
        count: allTasks.length,
        tasks: allTasks,
      });

      const { data: userData } = await supabase.auth.getUser();
      console.log('Debug - Current user:', userData?.user?.id);

      const { data: directTasks, error } = await supabase
        .from('tasks')
        .select('*');

      console.log('Direct query results:', {
        success: !error,
        count: directTasks?.length || 0,
        tasks: directTasks,
        error,
      });
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dbTasks, dbGoals] = await Promise.all([getTasks(), getGoals()]);

      // Convert Supabase data to local types
      const convertedTasks = dbTasks.map(convertSupabaseTask);
      const convertedGoals = dbGoals.map(convertSupabaseGoal);

      console.log('Converted data:', {
        tasks: convertedTasks,
        goals: convertedGoals,
        currentActivity: activity,
      });

      // Filter tasks
      const filteredTasks = convertedTasks.filter((task) => {
        const taskActivity = task.activity?.trim();
        const currentActivity = activity?.trim();

        return (
          !task.completed &&
          (!taskActivity ||
            taskActivity === currentActivity ||
            currentActivity === 'All Activities' ||
            !currentActivity)
        );
      });

      // Filter and process goals
      const filteredGoals = convertedGoals
        .filter((goal) => {
          const goalActivity = goal.activity?.trim();
          const currentActivity = activity?.trim();

          return (
            !goalActivity ||
            goalActivity === currentActivity ||
            currentActivity === 'All Activities' ||
            !currentActivity
          );
        })
        .map((goal) => ({
          ...goal,
          progress: calculateGoalProgress(goal).percentage,
        }));

      setRelevantTasks(filteredTasks);
      setRelevantGoals(filteredGoals);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activity, getTasks, getGoals]);

  useEffect(() => {
    loadData();
  }, [activity, loadData]);

  const handleTaskComplete = async (taskId: string) => {
    setCompletingTaskId(taskId);
    try {
      await onTaskComplete(taskId);
      await updateTask({
        id: taskId,
        completed: true,
        completedAt: new Date().toISOString(),
      });
      setRelevantTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
      await loadData();
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setCompletingTaskId(null);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.panelContainer}>
        <div className={styles.loadingState}>
          Loading your tasks and goals...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panelContainer}>
      <button onClick={debugTasks} className={styles.secondaryButton}>
        Debug Tasks
      </button>
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
            <Link href="/tasks" className={styles.actionLink}>
              Add a task
            </Link>
          </div>
        )}
      </div>

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
            <Link href="/goals" className={styles.actionLink}>
              Create a goal
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
