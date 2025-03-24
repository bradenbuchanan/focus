// src/services/goalService.ts
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { Goal } from '@/lib/timer';

type SupabaseGoal = Database['public']['Tables']['goals']['Row'];

export async function saveGoal(goal: {
  title: string;
  description?: string;
  type: 'time' | 'sessions';
  target: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  activity?: string;
  startDate: string;
  endDate?: string;
}): Promise<string> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    
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

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error saving goal to Supabase:', error);
    
    // Fallback to localStorage
    const localGoal: Goal = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      title: goal.title,
      description: goal.description,
      type: goal.type,
      target: goal.target,
      period: goal.period,
      activity: goal.activity,
      startDate: goal.startDate,
      endDate: goal.endDate,
      createdAt: new Date().toISOString(),
    };
    
    // Save to localStorage
    const goals = getLocalGoals();
    goals.push(localGoal);
    localStorage.setItem('focusGoals', JSON.stringify(goals));
    
    return localGoal.id;
  }
}

export async function getGoals(): Promise<SupabaseGoal[]> {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching goals from Supabase:', error);
    
    // Fallback to localStorage
    return getLocalGoals().map(goal => ({
      id: goal.id,
      user_id: '', // This will be empty in fallback mode
      title: goal.title,
      description: goal.description || null,
      type: goal.type,
      target: goal.target,
      period: goal.period,
      activity: goal.activity || null,
      start_date: goal.startDate,
      end_date: goal.endDate || null,
      created_at: goal.createdAt || new Date().toISOString(),
      updated_at: goal.createdAt || new Date().toISOString(),
    }));
  }
}

// Helper function to get local goals
function getLocalGoals(): Goal[] {
  if (typeof window === 'undefined') return [];
  
  const goalsData = localStorage.getItem('focusGoals');
  return goalsData ? JSON.parse(goalsData) : [];
}