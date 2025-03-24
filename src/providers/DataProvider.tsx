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

interface DataProviderProps {
  children: ReactNode;
}

interface DataContextType {
  // Sessions
  saveSession: (session: any) => Promise<string>;
  getSessions: () => Promise<any[]>;

  // Accomplishments
  saveAccomplishment: (data: any) => Promise<string>;
  getAccomplishments: () => Promise<any[]>;

  // Goals
  saveGoal: (goal: any) => Promise<string>;
  getGoals: () => Promise<any[]>;

  // Tasks
  saveTask: (task: any) => Promise<string>;
  updateTask: (task: any) => Promise<void>;
  getTasks: () => Promise<any[]>;
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
      async (session: any) => {
        if (!isAuthenticated()) {
          // Use localStorage fallback
          // ...
          return '';
        }
        return await saveSession(session);
      },
      [isAuthenticated]
    ),

    getSessions: useCallback(async () => {
      if (!isAuthenticated()) {
        // Use localStorage fallback
        // ...
        return [];
      }
      return await getSessions();
    }, [isAuthenticated]),

    saveAccomplishment: useCallback(
      async (data: any) => {
        if (!isAuthenticated()) {
          // Use localStorage fallback
          // ...
          return '';
        }
        return await saveAccomplishment(data);
      },
      [isAuthenticated]
    ),

    getAccomplishments: useCallback(async () => {
      if (!isAuthenticated()) {
        // Use localStorage fallback
        // ...
        return [];
      }
      return await getAccomplishments();
    }, [isAuthenticated]),

    saveGoal: useCallback(
      async (goal: any) => {
        if (!isAuthenticated()) {
          // Use localStorage fallback
          // ...
          return '';
        }
        return await saveGoal(goal);
      },
      [isAuthenticated]
    ),

    getGoals: useCallback(async () => {
      if (!isAuthenticated()) {
        // Use localStorage fallback
        // ...
        return [];
      }
      return await getGoals();
    }, [isAuthenticated]),

    saveTask: useCallback(
      async (task: any) => {
        if (!isAuthenticated()) {
          // Use localStorage fallback
          // ...
          return '';
        }
        return await saveTask(task);
      },
      [isAuthenticated]
    ),

    updateTask: useCallback(
      async (task: any) => {
        if (!isAuthenticated()) {
          // Use localStorage fallback
          // ...
          return;
        }
        await updateTask(task);
      },
      [isAuthenticated]
    ),

    getTasks: useCallback(async () => {
      if (!isAuthenticated()) {
        // Use localStorage fallback
        // ...
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
