import { supabase } from '@/lib/supabase';
import { OfflineQueue } from '@/utils/offlineQueue';
import { Database } from '@/types/supabase';

// Type definitions
type Tables = Database['public']['Tables'];
type FocusSession = Tables['focus_sessions']['Row'];
type Goal = Tables['goals']['Row'];
type Task = Tables['tasks']['Row'];
type Accomplishment = Tables['accomplishments']['Row'];

// Input types
interface SessionInput {
  startTime: Date;
  endTime?: Date;
  duration: number;
  type: 'focus' | 'break';
  completed: boolean;
  activity?: string;
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

interface AccomplishmentInput {
  sessionId: string;
  text: string;
  categories?: string;
}

export class DataService {
  private offlineQueue = new OfflineQueue();

  // Get current user
  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user;
  }

  // Check if online
  private isOnline(): boolean {
    return navigator.onLine;
  }

  // Sessions
  async saveSession(session: SessionInput): Promise<string> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          start_time: session.startTime.toISOString(),
          end_time: session.endTime?.toISOString() || null,
          duration: session.duration,
          category: session.type,
          activity: session.activity || null,
          completed: session.completed,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      if (!this.isOnline()) {
        return this.offlineQueue.add('focus_sessions', 'create', {
          ...session,
          startTime: session.startTime.toISOString(),
          endTime: session.endTime?.toISOString(),
        });
      }
      throw error;
    }
  }

  async getSessions(): Promise<FocusSession[]> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      if (!this.isOnline()) {
        // Return empty array when offline
        return [];
      }
      throw error;
    }
  }

  // Goals
  async saveGoal(goal: GoalInput): Promise<string> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
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
      if (!this.isOnline()) {
        return this.offlineQueue.add('goals', 'create', goal);
      }
      throw error;
    }
  }

  async getGoals(): Promise<Goal[]> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      if (!this.isOnline()) {
        return [];
      }
      throw error;
    }
  }

  async deleteGoal(goalId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      if (!this.isOnline()) {
        this.offlineQueue.add('goals', 'delete', { id: goalId });
        return;
      }
      throw error;
    }
  }

  // Tasks
  async saveTask(task: TaskInput): Promise<string> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          goal_id: task.goalId || null,
          text: task.text,
          completed: false,
          activity: task.activity || null,
          priority: task.priority || 'medium',
          due_date: task.dueDate || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      if (!this.isOnline()) {
        return this.offlineQueue.add('tasks', 'create', task);
      }
      throw error;
    }
  }

  async getTasks(): Promise<Task[]> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      if (!this.isOnline()) {
        return [];
      }
      throw error;
    }
  }

  async updateTask(taskUpdate: {
    id: string;
    goalId?: string;
    text?: string;
    completed?: boolean;
    activity?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    completedAt?: string;
  }): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      const { id, ...updates } = taskUpdate;
      
      const updateData: any = {};
      if (updates.goalId !== undefined) updateData.goal_id = updates.goalId;
      if (updates.text !== undefined) updateData.text = updates.text;
      if (updates.completed !== undefined) updateData.completed = updates.completed;
      if (updates.activity !== undefined) updateData.activity = updates.activity;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
      if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt;
      
      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      if (!this.isOnline()) {
        this.offlineQueue.add('tasks', 'update', taskUpdate);
        return;
      }
      throw error;
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      if (!this.isOnline()) {
        this.offlineQueue.add('tasks', 'delete', { id: taskId });
        return;
      }
      throw error;
    }
  }

  // Accomplishments
  async saveAccomplishment(data: AccomplishmentInput): Promise<string> {
    try {
      const user = await this.getCurrentUser();
      
      const { data: result, error } = await supabase
        .from('accomplishments')
        .insert({
          user_id: user.id,
          session_id: data.sessionId,
          text: data.text,
          categories: data.categories || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result.id;
    } catch (error) {
      if (!this.isOnline()) {
        return this.offlineQueue.add('accomplishments', 'create', data);
      }
      throw error;
    }
  }

  async getAccomplishments(): Promise<Accomplishment[]> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('accomplishments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      if (!this.isOnline()) {
        return [];
      }
      throw error;
    }
  }

  // Process offline queue when back online
  async processOfflineQueue(): Promise<void> {
    if (!this.isOnline()) return;

    const queue = this.offlineQueue.getQueue();
    
    for (const operation of queue) {
      try {
        switch (operation.table) {
          case 'focus_sessions':
            if (operation.operation === 'create') {
              await this.saveSession(operation.data as SessionInput);
            }
            break;
          
          case 'goals':
            if (operation.operation === 'create') {
              await this.saveGoal(operation.data as GoalInput);
            } else if (operation.operation === 'delete') {
              await this.deleteGoal((operation.data as any).id);
            }
            break;
          
          case 'tasks':
            if (operation.operation === 'create') {
              await this.saveTask(operation.data as TaskInput);
            } else if (operation.operation === 'update') {
              await this.updateTask(operation.data as any);
            } else if (operation.operation === 'delete') {
              await this.deleteTask((operation.data as any).id);
            }
            break;
          
          case 'accomplishments':
            if (operation.operation === 'create') {
              await this.saveAccomplishment(operation.data as AccomplishmentInput);
            }
            break;
        }
        
        // Remove from queue after successful processing
        this.offlineQueue.removeFromQueue(operation.id);
      } catch (error) {
        console.error('Error processing offline operation:', error);
      }
    }
  }
}