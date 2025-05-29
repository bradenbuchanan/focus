// src/app/components/timer/TimerGoalsTasksPanel.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Goal, Task, calculateGoalProgress } from '@/lib/timer';
import { Database } from '../../../types/supabase';
import { TaskItem } from '../../components/ui/TaskItem';
import { GoalCard } from '../../components/ui/GoalCard';
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
      <div className="card card--compact">
        <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.7 }}>
          Loading your tasks and goals...
        </div>
      </div>
    );
  }

  return (
    <div
      className="card card--compact"
      style={{
        marginTop: '2rem',
        maxWidth: '800px',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      <div
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          paddingRight: '0.5rem',
        }}
      >
        {/* Debug section */}
        <div
          style={{
            backgroundColor: 'rgba(30, 30, 30, 0.7)',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h4
            style={{
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Development Tools
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              onClick={debugTaskCreation}
              style={{
                backgroundColor: 'rgba(60, 60, 60, 0.6)',
                color: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0.375rem',
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Create Test Task
            </button>
            <button
              onClick={debugAllTasks}
              style={{
                backgroundColor: 'rgba(60, 60, 60, 0.6)',
                color: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0.375rem',
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              List All Tasks
            </button>
            <button
              onClick={debugTasks}
              style={{
                backgroundColor: 'rgba(60, 60, 60, 0.6)',
                color: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0.375rem',
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Debug Tasks
            </button>
          </div>
        </div>

        {/* Tasks section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3
            className="list-title"
            style={{
              textAlign: 'center',
              fontSize: '1.2rem',
              marginBottom: '1.25rem',
            }}
          >
            {activity ? `Tasks for ${activity}` : 'Current Tasks'}
          </h3>

          {relevantTasks.length > 0 ? (
            <div className="list">
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
            <div className="list-empty">
              <p>No active tasks for {activity || 'any activity'}.</p>
              <Link
                href="/tasks"
                className="btn btn--secondary btn--sm"
                style={{
                  marginTop: '0.5rem',
                  display: 'inline-block',
                  textDecoration: 'underline',
                }}
              >
                Add a task
              </Link>
            </div>
          )}
        </div>

        {/* Goals section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3
            className="list-title"
            style={{
              textAlign: 'center',
              fontSize: '1.2rem',
              marginBottom: '1.25rem',
            }}
          >
            {activity ? `Goals for ${activity}` : 'Current Goals'}
          </h3>

          {relevantGoals.length > 0 ? (
            <div className="list">
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
            <div className="list-empty">
              <p>No active goals for {activity || 'any activity'}.</p>
              <Link
                href="/goals"
                className="btn btn--secondary btn--sm"
                style={{
                  marginTop: '0.5rem',
                  display: 'inline-block',
                  textDecoration: 'underline',
                }}
              >
                Create a goal
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
