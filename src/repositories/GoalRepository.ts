// src/repositories/GoalRepository.ts
import { supabase } from '@/lib/supabase';
import { Goal } from '@/lib/timer';

// Define a type for Supabase goals
interface SupabaseGoal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: string;
  target: number;
  period: string;
  activity: string | null;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export class GoalRepository {
  async getGoals(): Promise<SupabaseGoal[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        // Convert local goals to the Supabase format
        return this.getLocalGoals().map(localGoal => ({
          id: localGoal.id,
          user_id: '', // Empty for local data
          title: localGoal.title,
          description: localGoal.description || null,
          type: localGoal.type,
          target: localGoal.target,
          period: localGoal.period,
          activity: localGoal.activity || null,
          start_date: localGoal.startDate,
          end_date: localGoal.endDate || null,
          created_at: localGoal.createdAt,
          updated_at: localGoal.createdAt,
        }));
      }
      
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching goals from Supabase:', error);
      
      // Convert local goals to the Supabase format
      return this.getLocalGoals().map(localGoal => ({
        id: localGoal.id,
        user_id: '', // Empty for local data
        title: localGoal.title,
        description: localGoal.description || null,
        type: localGoal.type,
        target: localGoal.target,
        period: localGoal.period,
        activity: localGoal.activity || null,
        start_date: localGoal.startDate,
        end_date: localGoal.endDate || null,
        created_at: localGoal.createdAt,
        updated_at: localGoal.createdAt,
      }));
    }
  }
  
  async saveGoal(goal: {
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
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        return this.saveLocalGoal(goal);
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
          end_date: goal.endDate || null
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return data.id;
    } catch (error) {
      console.error('Error saving goal to Supabase:', error);
      return this.saveLocalGoal(goal);
    }
  }
  
  async updateGoal(goal: Goal): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        this.updateLocalGoal(goal);
        return true;
      }
      
      const { error } = await supabase
        .from('goals')
        .update({
          title: goal.title,
          description: goal.description || null,
          type: goal.type,
          target: goal.target,
          period: goal.period,
          activity: goal.activity || null,
          start_date: goal.startDate,
          end_date: goal.endDate || null
        })
        .eq('id', goal.id);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error updating goal in Supabase:', error);
      this.updateLocalGoal(goal);
      return false;
    }
  }
  
  async deleteGoal(goalId: string): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        this.deleteLocalGoal(goalId);
        return;
      }
      
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting goal from Supabase:', error);
      this.deleteLocalGoal(goalId);
    }
  }
  
  // Local storage methods
  private getLocalGoals(): Goal[] {
    if (typeof window === 'undefined') return [];
    
    const goalsData = localStorage.getItem('focusGoals');
    return goalsData ? JSON.parse(goalsData) : [];
  }
  
  private saveLocalGoal(goal: {
    title: string;
    description?: string;
    type: 'time' | 'sessions';
    target: number;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    activity?: string;
    startDate: string;
    endDate?: string;
  }): string {
    if (typeof window === 'undefined') return '';
    
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
    
    const goals = this.getLocalGoals();
    goals.push(localGoal);
    localStorage.setItem('focusGoals', JSON.stringify(goals));
    
    return localGoal.id;
  }
  
  private updateLocalGoal(updatedGoal: Goal): void {
    if (typeof window === 'undefined') return;
    
    const goals = this.getLocalGoals();
    const index = goals.findIndex(g => g.id === updatedGoal.id);
    
    if (index !== -1) {
      goals[index] = updatedGoal;
      localStorage.setItem('focusGoals', JSON.stringify(goals));
    }
  }
  
  private deleteLocalGoal(goalId: string): void {
    if (typeof window === 'undefined') return;
    
    const goals = this.getLocalGoals();
    const updatedGoals = goals.filter(g => g.id !== goalId);
    localStorage.setItem('focusGoals', JSON.stringify(updatedGoals));
  }
}