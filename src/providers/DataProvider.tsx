'use client';

import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { saveSession, getSessions } from '@/services/sessionService';
import {
  saveAccomplishment,
  getAccomplishments,
} from '@/services/accomplishmentService';
import { saveGoal, getGoals } from '@/services/goalService';
import { saveTask, updateTask, getTasks } from '@/services/taskService';
import { Database } from '@/types/supabase';
import { supabase } from '@/lib/supabase';

type Session = Database['public']['Tables']['focus_sessions']['Row'];
type Accomplishment = Database['public']['Tables']['accomplishments']['Row'];
type Goal = Database['public']['Tables']['goals']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

interface SessionInput {
  startTime: Date;
  endTime?: Date | null;
  duration: number;
  type: 'focus' | 'break';
  completed: boolean;
  activity?: string;
}

interface AccomplishmentInput {
  sessionId: string;
  text: string;
  categories?: string;
}

interface GoalInput {
  title: string;
  description?: string;
  type: 'time' | 'sessions';
  target: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  activity?: string;
  startDate: string;
  endDate?: string;
}

interface TaskInput {
  goalId?: string;
  text: string;
  activity?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

interface TaskUpdateInput {
  id: string;
  goalId?: string;
  text?: string;
  completed?: boolean;
  activity?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  completedAt?: string;
}

interface DataProviderProps {
  children: ReactNode;
}

interface DataContextType {
  saveSession: (session: SessionInput) => Promise<string>;
  getSessions: () => Promise<Session[]>;
  saveAccomplishment: (data: AccomplishmentInput) => Promise<string>;
  getAccomplishments: () => Promise<Accomplishment[]>;
  saveGoal: (goal: GoalInput) => Promise<string>;
  getGoals: () => Promise<Goal[]>;
  deleteGoal: (goalId: string) => Promise<void>;
  saveTask: (task: TaskInput) => Promise<string>;
  updateTask: (task: TaskUpdateInput) => Promise<void>;
  getTasks: () => Promise<Task[]>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: DataProviderProps) {
  const { user } = useAuth();

  const isAuthenticated = useCallback(() => {
    if (!user) {
      console.warn('User not authenticated. Using localStorage fallback.');
      return false;
    }
    return true;
  }, [user]);

  const wrappedServices = {
    saveSession: useCallback(
      async (session: SessionInput) => {
        if (!isAuthenticated()) {
          return '';
        }
        return await saveSession(session);
      },
      [isAuthenticated]
    ),

    getSessions: useCallback(async () => {
      if (!isAuthenticated()) {
        return [];
      }
      return await getSessions();
    }, [isAuthenticated]),

    saveAccomplishment: useCallback(
      async (data: AccomplishmentInput) => {
        if (!isAuthenticated()) {
          return '';
        }
        return await saveAccomplishment(data);
      },
      [isAuthenticated]
    ),

    getAccomplishments: useCallback(async () => {
      if (!isAuthenticated()) {
        return [];
      }
      return await getAccomplishments();
    }, [isAuthenticated]),

    saveGoal: useCallback(
      async (goal: GoalInput) => {
        console.log('saveGoal called with:', goal);

        try {
          if (!isAuthenticated()) {
            console.log('User not authenticated, falling back to localStorage');
            return '';
          }

          const { data: userData } = await supabase.auth.getUser();
          console.log('Current user:', userData);

          if (!userData?.user) {
            throw new Error('User data not found');
          }

          const { data, error } = await supabase
            .from('goals')
            .insert({
              user_id: userData.user.id,
              title: goal.title,
              description: goal.description || null,
              type: goal.type,
              target: goal.target,
              period: goal.period,
              activity: goal.activity || null,
              start_date: goal.startDate,
              end_date: goal.endDate || null,
            })
            .select()
            .single();

          if (error) {
            console.error('Supabase error saving goal:', error);
            throw error;
          }

          console.log('Goal saved successfully:', data);
          return data.id;
        } catch (error) {
          console.error('Error in saveGoal:', error);
          if (error instanceof Error) {
            console.error('Error details:', error.message);
          }
          return '';
        }
      },
      [isAuthenticated]
    ),

    getGoals: useCallback(async () => {
      console.log('getGoals called');

      try {
        if (!isAuthenticated()) {
          console.log('User not authenticated, falling back to localStorage');
          return getGoals();
        }

        const { data: userData } = await supabase.auth.getUser();
        console.log('Current user for getGoals:', userData);

        if (!userData?.user) {
          throw new Error('User data not found');
        }

        const { data, error } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', userData.user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase error getting goals:', error);
          throw error;
        }

        console.log('Goals retrieved:', data);
        return data || [];
      } catch (error) {
        console.error('Error in getGoals:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
        return [];
      }
    }, [isAuthenticated]),

    deleteGoal: useCallback(
      async (goalId: string) => {
        if (!isAuthenticated()) {
          try {
            const localGoals = JSON.parse(
              localStorage.getItem('focusGoals') || '[]'
            );
            const updatedGoals = localGoals.filter((g: any) => g.id !== goalId);
            localStorage.setItem('focusGoals', JSON.stringify(updatedGoals));
            return;
          } catch (error) {
            console.error('Error with localStorage fallback:', error);
          }
        }

        const { error } = await supabase
          .from('goals')
          .delete()
          .eq('id', goalId);

        if (error) throw error;
      },
      [isAuthenticated]
    ),

    saveTask: useCallback(
      async (task: TaskInput) => {
        console.log('saveTask called with:', task);
        try {
          if (!isAuthenticated()) {
            console.log('User not authenticated, falling back to localStorage');
            return saveTask(task);
          }

          const { data: userData } = await supabase.auth.getUser();
          console.log('Attempting to save task for user:', userData?.user?.id);

          // Log the exact data being sent to Supabase
          const taskData = {
            user_id: userData?.user?.id,
            goal_id: task.goalId || null,
            text: task.text,
            completed: false,
            activity: task.activity || null,
            priority: task.priority || 'medium',
            due_date: task.dueDate || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          console.log('Task data being sent to Supabase:', taskData);

          const { data, error } = await supabase
            .from('tasks')
            .insert(taskData)
            .select()
            .single();

          if (error) {
            console.error('Supabase insert error:', error);
            throw error;
          }

          console.log('Task successfully saved to Supabase:', data);
          return data.id;
        } catch (error) {
          console.error('Error in saveTask:', error);
          console.log('Falling back to localStorage');
          return saveTask(task);
        }
      },
      [isAuthenticated]
    ),

    updateTask: useCallback(
      async (task: TaskUpdateInput) => {
        if (!isAuthenticated()) {
          return;
        }
        await updateTask(task);
      },
      [isAuthenticated]
    ),

    // In DataProvider.tsx
    getTasks: useCallback(async () => {
      console.log('getTasks called from Timer');
      try {
        const { data: userData } = await supabase.auth.getUser();
        console.log('Current user for getTasks:', userData?.user?.id);

        // Direct query for tasks
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userData?.user?.id);

        console.log('Tasks query result:', {
          success: !error,
          count: data?.length || 0,
          data,
          error,
        });

        if (error) {
          console.error('Supabase error getting tasks:', error);
          throw error;
        }

        const mappedTasks =
          data?.map((task) => ({
            id: task.id,
            user_id: task.user_id,
            goal_id: task.goal_id,
            text: task.text,
            completed: task.completed,
            activity: task.activity,
            priority: task.priority,
            due_date: task.due_date,
            completed_at: task.completed_at,
            created_at: task.created_at,
            updated_at: task.updated_at,
          })) || [];

        console.log('Mapped tasks:', {
          count: mappedTasks.length,
          tasks: mappedTasks,
        });

        return mappedTasks;
      } catch (error) {
        console.error('Error in getTasks:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
        return [];
      }
    }, [isAuthenticated]),
  };

  return (
    <DataContext.Provider value={wrappedServices}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
