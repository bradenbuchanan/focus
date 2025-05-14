// src/providers/DataProvider.tsx
'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { SessionRepository } from '@/repositories/SessionRepository';
import { GoalRepository } from '@/repositories/GoalRepository';
import { TaskRepository } from '@/repositories/TaskRepository';
import { AccomplishmentRepository } from '@/repositories/AccomplishmentRepository';
import { Database } from '@/types/supabase';
import { Goal } from '@/lib/timer';

// Keep all your EXISTING type definitions from your old DataProvider
type Session = Database['public']['Tables']['focus_sessions']['Row'];
type Accomplishment = Database['public']['Tables']['accomplishments']['Row'];
type SupabaseGoal = Database['public']['Tables']['goals']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

interface SessionInput {
  startTime: Date;
  endTime?: Date;
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
  getGoals: () => Promise<SupabaseGoal[]>;
  deleteGoal: (goalId: string) => Promise<void>;
  saveTask: (task: TaskInput) => Promise<string>;
  updateTask: (task: TaskUpdateInput) => Promise<void>;
  getTasks: () => Promise<Task[]>;
  deleteTask: (taskId: string) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: DataProviderProps) {
  // Create repositories once using useMemo
  const sessionRepo = useMemo(() => new SessionRepository(), []);
  const goalRepo = useMemo(() => new GoalRepository(), []);
  const taskRepo = useMemo(() => new TaskRepository(), []);
  const accomplishmentRepo = useMemo(() => new AccomplishmentRepository(), []);

  // Create the context value with methods delegated to repositories
  const contextValue = useMemo(
    () => ({
      saveSession: (session: SessionInput) => sessionRepo.saveSession(session),
      getSessions: () => sessionRepo.getSessions(),
      saveAccomplishment: (data: AccomplishmentInput) =>
        accomplishmentRepo.saveAccomplishment(data),
      getAccomplishments: () => accomplishmentRepo.getAccomplishments(),
      saveGoal: (goal: GoalInput) => goalRepo.saveGoal(goal),
      getGoals: () => goalRepo.getGoals(),
      deleteGoal: (goalId: string) => goalRepo.deleteGoal(goalId),
      saveTask: (task: TaskInput) => taskRepo.saveTask(task),
      updateTask: (task: TaskUpdateInput) => taskRepo.updateTask(task),
      getTasks: () => taskRepo.getTasks(),
      deleteTask: (taskId: string) => taskRepo.deleteTask(taskId),
      updateGoal: async (goal: Goal): Promise<void> => {
        const result = await goalRepo.updateGoal(goal);
        // Just ignore the boolean result to match the void return type
        return;
      },
    }),
    [sessionRepo, goalRepo, taskRepo, accomplishmentRepo]
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
