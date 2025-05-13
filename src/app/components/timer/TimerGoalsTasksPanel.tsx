// src/app/components/timer/TimerGoalsTasksPanel.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Goal, Task, calculateGoalProgress } from '@/lib/timer';
import { Database } from '../../../types/supabase';
import { TaskItem } from '../../components/ui/TaskItem';
import { GoalCard } from '../../components/ui/GoalCard';
import { TaskList } from '../../components/ui/TaskList';
import styles from './timerGoalsTasks.module.css';
import { useData } from '@/providers/DataProvider';
import { supabase } from '@/lib/supabase';

type SupabaseTask = Database['public']['Tables']['tasks']['Row'];
type SupabaseGoal = Database['public']['Tables']['goals']['Row'];

interface TimerGoalsTasksPanelProps {
  activity: string | undefined;
  onTaskComplete: (taskId: string) => Promise<void>;
}

// Define a type for a goal with progress
type GoalWithProgress = Goal & { progress: number };

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
  const [relevantGoals, setRelevantGoals] = useState<GoalWithProgress[]>([]);
  const { getTasks, getGoals, updateTask } = useData();

  // Debug functions
  const debugTaskCreation = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      console.log('Debug - Creating test task for user:', userData?.user?.id);

      const testTask = {
        user_id: userData?.user?.id,
        text: 'Test task ' + new Date().toISOString(),
        completed: false,
        activity: 'Reading',
        priority: 'medium',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(testTask)
        .select();

      console.log('Direct task creation result:', {
        success: !error,
        data,
        error,
      });
    } catch (e) {
      console.error('Debug task creation error:', e);
    }
  };

  const debugAllTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .limit(100);

      console.log('All tasks in database:', {
        success: !error,
        count: data?.length || 0,
        tasks: data,
        error,
      });
    } catch (e) {
      console.error('Debug all tasks error:', e);
    }
  };

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
      console.log('Loading data with activity filter:', activity);

      const [dbTasks, dbGoals] = await Promise.all([getTasks(), getGoals()]);
      console.log('Raw data from database:', {
        tasks: dbTasks.length,
        goals: dbGoals.length,
      });

      // Convert Supabase data to local types
      const convertedTasks = dbTasks.map(convertSupabaseTask);
      const convertedGoals = dbGoals.map(convertSupabaseGoal);

      // Filter tasks
      const filteredTasks = convertedTasks.filter((task) => {
        const taskActivity = task.activity?.trim();
        const currentActivity = activity?.trim();

        const include =
          !task.completed &&
          (!taskActivity ||
            taskActivity === currentActivity ||
            currentActivity === 'All Activities' ||
            !currentActivity);

        return include;
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
        .map((goal): GoalWithProgress => {
          const progress = calculateGoalProgress(goal);
          return {
            ...goal,
            progress: progress.percentage,
          };
        });

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
  }, [loadData]);

  const handleTaskComplete = async (taskId: string) => {
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
      <div className={styles.debugButtonsContainer}>
        <h4 className={styles.debugTitle}>Development Tools</h4>
        <div className={styles.debugButtons}>
          <button onClick={debugTaskCreation} className={styles.debugButton}>
            Create Test Task
          </button>
          <button onClick={debugAllTasks} className={styles.debugButton}>
            List All Tasks
          </button>
          <button onClick={debugTasks} className={styles.debugButton}>
            Debug Tasks
          </button>
        </div>
      </div>

      <div className={styles.tasksSection}>
        <h3 className={styles.sectionTitle}>
          {activity ? `Tasks for ${activity}` : 'Current Tasks'}
        </h3>

        {relevantTasks.length > 0 ? (
          <div className={styles.tasksList}>
            {relevantTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={handleTaskComplete}
                showActions={false}
                showMeta={true}
                isCompact={true}
              />
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
              <GoalCard
                key={goal.id}
                goal={goal}
                progress={{
                  current: calculateGoalProgress(goal).current,
                  percentage: goal.progress,
                }}
                isCompact={true}
                showActions={false}
              />
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
