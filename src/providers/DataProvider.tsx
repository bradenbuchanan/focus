// src/providers/DataProvider.tsx
'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useEffect,
} from 'react';
import { ServiceFactory } from '@/services/ServiceFactory';
import { Database } from '@/types/supabase';
import { Goal } from '@/lib/timer';

// Types
type Session = Database['public']['Tables']['focus_sessions']['Row'];
type Accomplishment = Database['public']['Tables']['accomplishments']['Row'];
type SupabaseGoal = Database['public']['Tables']['goals']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

// Import input types from services
import type { SessionInput, GoalInput } from '@/services/SessionService';
import type { TaskInput, TaskUpdateInput } from '@/services/TaskService';
import type { AccomplishmentInput } from '@/services/AccomplishmentService';

interface DataProviderProps {
  children: ReactNode;
}

interface DataContextType {
  // Session operations
  saveSession: (session: SessionInput) => Promise<string>;
  getSessions: () => Promise<Session[]>;
  getSessionsInDateRange: (
    startDate: Date,
    endDate: Date
  ) => Promise<Session[]>;
  deleteSession: (sessionId: string) => Promise<void>;

  // Accomplishment operations
  saveAccomplishment: (data: AccomplishmentInput) => Promise<string>;
  getAccomplishments: () => Promise<Accomplishment[]>;

  // Goal operations
  saveGoal: (goal: GoalInput) => Promise<string>;
  getGoals: () => Promise<SupabaseGoal[]>;
  deleteGoal: (goalId: string) => Promise<void>;
  updateGoal: (goalToUpdate: Goal) => Promise<void>;

  // Task operations
  saveTask: (task: TaskInput) => Promise<string>;
  updateTask: (task: TaskUpdateInput) => Promise<void>;
  getTasks: () => Promise<Task[]>;
  deleteTask: (taskId: string) => Promise<void>;

  // Cache operations
  clearCaches: () => void;
  getCacheStats: () => any;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: DataProviderProps) {
  // Get singleton instance of ServiceFactory
  const serviceFactory = useMemo(() => ServiceFactory.getInstance(), []);

  // Process offline queue when coming back online
  useEffect(() => {
    const handleOnline = () => {
      console.log('Back online, processing offline queue...');
      serviceFactory.processOfflineQueue();
    };

    window.addEventListener('online', handleOnline);

    // Process queue on mount if online
    if (navigator.onLine) {
      serviceFactory.processOfflineQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [serviceFactory]);

  // Create the context value using services
  const contextValue = useMemo(
    () => ({
      // Session operations
      saveSession: (session: SessionInput) =>
        serviceFactory.getSessionService().saveSession(session),
      getSessions: () => serviceFactory.getSessionService().getSessions(),
      getSessionsInDateRange: (startDate: Date, endDate: Date) =>
        serviceFactory
          .getSessionService()
          .getSessionsInDateRange(startDate, endDate),
      deleteSession: (sessionId: string) =>
        serviceFactory.getSessionService().deleteSession(sessionId),

      // Accomplishment operations
      saveAccomplishment: (data: AccomplishmentInput) =>
        serviceFactory.getAccomplishmentService().saveAccomplishment(data),
      getAccomplishments: () =>
        serviceFactory.getAccomplishmentService().getAccomplishments(),

      // Goal operations
      saveGoal: (goal: GoalInput) =>
        serviceFactory.getGoalService().saveGoal(goal),
      getGoals: () => serviceFactory.getGoalService().getGoals(),
      deleteGoal: (goalId: string) =>
        serviceFactory.getGoalService().deleteGoal(goalId),
      updateGoal: async (goalToUpdate: Goal): Promise<void> => {
        const goalService = serviceFactory.getGoalService();
        const updates: Partial<GoalInput> = {
          title: goalToUpdate.title,
          description: goalToUpdate.description,
          type: goalToUpdate.type,
          target: goalToUpdate.target,
          period: goalToUpdate.period,
          activity: goalToUpdate.activity,
          startDate: goalToUpdate.startDate,
          endDate: goalToUpdate.endDate,
        };
        await goalService.updateGoal(goalToUpdate.id, updates);
      },

      // Task operations
      saveTask: (task: TaskInput) =>
        serviceFactory.getTaskService().saveTask(task),
      updateTask: (task: TaskUpdateInput) =>
        serviceFactory.getTaskService().updateTask(task),
      getTasks: () => serviceFactory.getTaskService().getTasks(),
      deleteTask: (taskId: string) =>
        serviceFactory.getTaskService().deleteTask(taskId),

      // Cache operations
      clearCaches: () => serviceFactory.clearAllCaches(),
      getCacheStats: () => serviceFactory.getCacheStats(),
    }),
    [serviceFactory]
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
