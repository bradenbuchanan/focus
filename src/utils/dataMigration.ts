// src/utils/dataMigration.ts
import { supabase } from '@/lib/supabase';

interface MigrationResult {
  success: boolean;
  sessionsMigrated: number;
  accomplishmentsMigrated: number;
  goalsMigrated: number;
  tasksMigrated: number;
  error?: string;
}

// Define interfaces for each localStorage data type
interface LocalSession {
  id: string;
  date: string;
  localDate?: string;
  endTime?: string;
  duration: number;
  type: 'focus' | 'break';
  completed: boolean;
  activity?: string;
}

interface LocalAccomplishment {
  id: string;
  text: string;
  date: string;
  sessionId?: string;
  categories?: string;
}

interface LocalGoal {
  id: string;
  title: string;
  description?: string;
  type: 'time' | 'sessions';
  target: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  activity?: string;
}

interface LocalTask {
  id: string;
  goalId?: string;
  text: string;
  completed: boolean;
  activity?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  completedAt?: string;
}

export async function migrateLocalDataToSupabase(): Promise<MigrationResult> {
  try {
    // Check if user is authenticated
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw new Error('Authentication required to migrate data');
    
    const userId = authData.user.id;
    
    // Get all data from localStorage with proper typing
    const sessions = JSON.parse(localStorage.getItem('timerSessions') || '[]') as LocalSession[];
    const accomplishments = JSON.parse(localStorage.getItem('focusAccomplishments') || '[]') as LocalAccomplishment[];
    const goals = JSON.parse(localStorage.getItem('focusGoals') || '[]') as LocalGoal[];
    const tasks = JSON.parse(localStorage.getItem('focusTasks') || '[]') as LocalTask[];
    
    // Map from local IDs to Supabase IDs
    const sessionIdMap = new Map<string, string>();
    
    // Migrate sessions
    const sessionPromises = sessions.map(async (session: LocalSession) => {
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: userId,
          start_time: session.date,
          end_time: session.endTime || new Date(new Date(session.date).getTime() + (session.duration * 1000)).toISOString(),
          duration: session.duration,
          category: session.type,
          activity: session.activity,
          completed: session.completed,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Store the mapping from local ID to Supabase ID
      sessionIdMap.set(session.id, data.id);
      
      return data;
    });
    
    // Wait for all session migrations to complete
    const migratedSessions = await Promise.all(sessionPromises);
    
    // Migrate accomplishments
    const accomplishmentPromises = accomplishments.map(async (accomplishment: LocalAccomplishment) => {
      const supabaseSessionId = accomplishment.sessionId ? sessionIdMap.get(accomplishment.sessionId) : null;
      
      const { data, error } = await supabase
        .from('accomplishments')
        .insert({
          user_id: userId,
          session_id: supabaseSessionId,
          text: accomplishment.text,
          categories: accomplishment.categories,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    });
    
    // Wait for all accomplishment migrations to complete
    const migratedAccomplishments = await Promise.all(accomplishmentPromises);
    
    // Migrate goals
    const goalPromises = goals.map(async (goal: LocalGoal) => {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: userId,
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
      
      if (error) throw error;
      
      // Store the mapping from local ID to Supabase ID
      sessionIdMap.set(goal.id, data.id);
      
      return data;
    });
    
    // Wait for all goal migrations to complete
    const migratedGoals = await Promise.all(goalPromises);
    
    // Migrate tasks
    const taskPromises = tasks.map(async (task: LocalTask) => {
      const supabaseGoalId = task.goalId ? sessionIdMap.get(task.goalId) : null;
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          goal_id: supabaseGoalId,
          text: task.text,
          completed: task.completed,
          activity: task.activity || null,
          priority: task.priority || null,
          due_date: task.dueDate || null,
          completed_at: task.completedAt || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    });
    
    // Wait for all task migrations to complete
    const migratedTasks = await Promise.all(taskPromises);
    
    return {
      success: true,
      sessionsMigrated: migratedSessions.length,
      accomplishmentsMigrated: migratedAccomplishments.length,
      goalsMigrated: migratedGoals.length,
      tasksMigrated: migratedTasks.length,
    };
  } catch (error) {
    console.error('Migration error:', error);
    return {
      success: false,
      sessionsMigrated: 0,
      accomplishmentsMigrated: 0,
      goalsMigrated: 0,
      tasksMigrated: 0,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}