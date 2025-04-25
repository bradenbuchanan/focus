// src/providers/DataProvider.tsx
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

// Define types based on your Supabase database schema
type Session = Database['public']['Tables']['focus_sessions']['Row'];
type Accomplishment = Database['public']['Tables']['accomplishments']['Row'];
type Goal = Database['public']['Tables']['goals']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

// Define types for the input data
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
  // Sessions
  saveSession: (session: SessionInput) => Promise<string>;
  getSessions: () => Promise<Session[]>;

  // Accomplishments
  saveAccomplishment: (data: AccomplishmentInput) => Promise<string>;
  getAccomplishments: () => Promise<Accomplishment[]>;

  // Goals
  saveGoal: (goal: GoalInput) => Promise<string>;
  getGoals: () => Promise<Goal[]>;
  deleteGoal: (goalId: string) => Promise<void>; // Added this line

  // Tasks
  saveTask: (task: TaskInput) => Promise<string>;
  updateTask: (task: TaskUpdateInput) => Promise<void>;
  getTasks: () => Promise<Task[]>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: DataProviderProps) {
  const { user } = useAuth();

  // Check if user is authenticated before performing data operations
  const isAuthenticated = useCallback(() => {
    if (!user) {
      console.warn('User not authenticated. Using localStorage fallback.');
      return false;
    }
    return true;
  }, [user]);

  // Create wrapper functions that check authentication
  const wrappedServices = {
    saveSession: useCallback(
      async (session: SessionInput) => {
        if (!isAuthenticated()) {
          // Use localStorage fallback
          return '';
        }
        return await saveSession(session);
      },
      [isAuthenticated]
    ),

    getSessions: useCallback(async () => {
      if (!isAuthenticated()) {
        // Use localStorage fallback
        return [];
      }
      return await getSessions();
    }, [isAuthenticated]),

    saveAccomplishment: useCallback(
      async (data: AccomplishmentInput) => {
        if (!isAuthenticated()) {
          // Use localStorage fallback
          return '';
        }
        return await saveAccomplishment(data);
      },
      [isAuthenticated]
    ),

    getAccomplishments: useCallback(async () => {
      if (!isAuthenticated()) {
        // Use localStorage fallback
        return [];
      }
      return await getAccomplishments();
    }, [isAuthenticated]),

    saveGoal: useCallback(
      async (goal: GoalInput) => {
        if (!isAuthenticated()) {
          // Use localStorage fallback
          return '';
        }
        return await saveGoal(goal);
      },
      [isAuthenticated]
    ),

    getGoals: useCallback(async () => {
      if (!isAuthenticated()) {
        // Use localStorage fallback
        return [];
      }
      return await getGoals();
    }, [isAuthenticated]),

    // Add the deleteGoal function here
    deleteGoal: useCallback(
      async (goalId: string) => {
        if (!isAuthenticated()) {
          // Use localStorage fallback from @/lib/timer
          // We need to import the local version or get it from the window
          try {
            // This assumes you have a local function called getLocalGoals()
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

        // Delete from Supabase database
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
        if (!isAuthenticated()) {
          // Use localStorage fallback
          return '';
        }
        return await saveTask(task);
      },
      [isAuthenticated]
    ),

    updateTask: useCallback(
      async (task: TaskUpdateInput) => {
        if (!isAuthenticated()) {
          // Use localStorage fallback
          return;
        }
        await updateTask(task);
      },
      [isAuthenticated]
    ),

    getTasks: useCallback(async () => {
      if (!isAuthenticated()) {
        // Use localStorage fallback
        return [];
      }
      return await getTasks();
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
