// src/providers/DataProvider.tsx
'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useEffect,
} from 'react';
import {
  DataService,
  type SessionInput,
  type AccomplishmentInput,
  type GoalInput,
  type TaskInput,
  type TaskUpdateInput,
} from '@/services/DataService';
import { Database } from '@/types/supabase';
import { Goal } from '@/lib/timer';

// Keep only the types that aren't exported from DataService
type Session = Database['public']['Tables']['focus_sessions']['Row'];
type Accomplishment = Database['public']['Tables']['accomplishments']['Row'];
type SupabaseGoal = Database['public']['Tables']['goals']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

interface DataProviderProps {
  children: ReactNode;
}

interface DataContextType {
  saveSession: (session: SessionInput) => Promise<string>;
  getSessions: () => Promise<Session[]>;
  saveAccomplishment: (data: AccomplishmentInput) => Promise<string>;
  getAccomplishments: () => Promise<Accomplishment[]>;
  saveGoal: (goal: GoalInput) => Promise<string>;
  getGoals: () => Promise<SupabaseGoal[]>;
  deleteGoal: (goalId: string) => Promise<void>;
  saveTask: (task: TaskInput) => Promise<string>;
  updateTask: (task: TaskUpdateInput) => Promise<void>;
  getTasks: () => Promise<Task[]>;
  deleteTask: (taskId: string) => Promise<void>;
  updateGoal: (goalToUpdate: Goal) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: DataProviderProps) {
  // Create single instance of DataService
  const dataService = useMemo(() => new DataService(), []);

  // Process offline queue when coming back online
  useEffect(() => {
    const handleOnline = () => {
      console.log('Back online, processing offline queue...');
      dataService.processOfflineQueue();
    };

    window.addEventListener('online', handleOnline);

    // Process queue on mount if online
    if (navigator.onLine) {
      dataService.processOfflineQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [dataService]);

  // Create the context value
  const contextValue = useMemo(
    () => ({
      saveSession: (session: SessionInput) => dataService.saveSession(session),
      getSessions: () => dataService.getSessions(),
      saveAccomplishment: (data: AccomplishmentInput) =>
        dataService.saveAccomplishment(data),
      getAccomplishments: () => dataService.getAccomplishments(),
      saveGoal: (goal: GoalInput) => dataService.saveGoal(goal),
      getGoals: () => dataService.getGoals(),
      deleteGoal: (goalId: string) => dataService.deleteGoal(goalId),
      saveTask: (task: TaskInput) => dataService.saveTask(task),
      updateTask: (task: TaskUpdateInput) => dataService.updateTask(task),
      getTasks: () => dataService.getTasks(),
      deleteTask: (taskId: string) => dataService.deleteTask(taskId),
      updateGoal: async (goalToUpdate: Goal): Promise<void> => {
        // For now, we'll delete and recreate
        await dataService.deleteGoal(goalToUpdate.id);
        await dataService.saveGoal({
          title: goalToUpdate.title,
          description: goalToUpdate.description,
          type: goalToUpdate.type,
          target: goalToUpdate.target,
          period: goalToUpdate.period,
          activity: goalToUpdate.activity,
          startDate: goalToUpdate.startDate,
          endDate: goalToUpdate.endDate,
        });
      },
    }),
    [dataService]
  );

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
