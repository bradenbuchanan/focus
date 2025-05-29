// src/services/DataService.ts
import { supabase } from '@/lib/supabase';
import { OfflineQueue, type OperationData } from '@/utils/offlineQueue';
import { Database } from '@/types/supabase';

// Type definitions
type Tables = Database['public']['Tables'];
type FocusSession = Tables['focus_sessions']['Row'];
type Goal = Tables['goals']['Row'];
type Task = Tables['tasks']['Row'];
type Accomplishment = Tables['accomplishments']['Row'];

// Export all input types so they can be used in DataProvider
export interface SessionInput extends OperationData {
  startTime: Date;
  endTime?: Date;
  duration: number;
  type: 'focus' | 'break';
  completed: boolean;
  activity?: string;
}

export interface GoalInput extends OperationData {
  title: string;
  description?: string;
  type: 'time' | 'sessions';
  target: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  activity?: string;
  startDate: string;
  endDate?: string;
}

export interface TaskInput extends OperationData {
  goalId?: string;
  text: string;
  activity?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export interface AccomplishmentInput extends OperationData {
  sessionId: string;
  text: string;
  categories?: string;
}

export interface TaskUpdateInput extends OperationData {
  id: string;
  goalId?: string;
  text?: string;
  completed?: boolean;
  activity?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  completedAt?: string;
}
interface DeleteOperation extends OperationData {
  id: string;
}

// Task update data for Supabase
interface TaskUpdateData {
  goal_id?: string | null;
  text?: string;
  completed?: boolean;
  activity?: string | null;
  priority?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
}

// Type guards - now they work because all types extend OperationData
function isSessionInput(data: OperationData): data is SessionInput {
  return typeof data === 'object' && data !== null && 
         'startTime' in data && 'duration' in data && 'type' in data && 'completed' in data;
}

function isGoalInput(data: OperationData): data is GoalInput {
  return typeof data === 'object' && data !== null && 
         'title' in data && 'type' in data && 'target' in data && 'period' in data && 'startDate' in data;
}

function isTaskInput(data: OperationData): data is TaskInput {
  return typeof data === 'object' && data !== null && 'text' in data;
}

function isTaskUpdateInput(data: OperationData): data is TaskUpdateInput {
  return typeof data === 'object' && data !== null && 'id' in data;
}

function isAccomplishmentInput(data: OperationData): data is AccomplishmentInput {
  return typeof data === 'object' && data !== null && 'sessionId' in data && 'text' in data;
}

function isDeleteOperation(data: OperationData): data is DeleteOperation {
  return typeof data === 'object' && data !== null && 'id' in data;
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
        // Convert Date to string for storage
        const offlineData: OperationData = {
          ...session,
          startTime: session.startTime.toISOString(),
          endTime: session.endTime?.toISOString(),
        };
        return this.offlineQueue.add('focus_sessions', 'create', offlineData);
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

  async updateTask(taskUpdate: TaskUpdateInput): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      const { id, ...updates } = taskUpdate;
      
      const updateData: TaskUpdateData = {};
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
 // Process offline queue when back online
async processOfflineQueue(): Promise<void> {
    if (!this.isOnline()) return;
  
    const queue = this.offlineQueue.getQueue();
    
    for (const operation of queue) {
      try {
        switch (operation.table) {
          case 'focus_sessions':
            if (operation.operation === 'create' && isSessionInput(operation.data)) {
              // The data stored in offline queue has dates as strings
              // We need to reconstruct the SessionInput with proper Date objects
              const sessionData: SessionInput = {
                ...operation.data,
                startTime: new Date(operation.data.startTime),
                endTime: operation.data.endTime ? new Date(operation.data.endTime) : undefined,
              };
              await this.saveSession(sessionData);
            }
            break;
          
          case 'goals':
            if (operation.operation === 'create' && isGoalInput(operation.data)) {
              await this.saveGoal(operation.data);
            } else if (operation.operation === 'delete' && isDeleteOperation(operation.data)) {
              await this.deleteGoal(operation.data.id);
            }
            break;
          
          case 'tasks':
            if (operation.operation === 'create' && isTaskInput(operation.data)) {
              await this.saveTask(operation.data);
            } else if (operation.operation === 'update' && isTaskUpdateInput(operation.data)) {
              await this.updateTask(operation.data);
            } else if (operation.operation === 'delete' && isDeleteOperation(operation.data)) {
              await this.deleteTask(operation.data.id);
            }
            break;
          
          case 'accomplishments':
            if (operation.operation === 'create' && isAccomplishmentInput(operation.data)) {
              await this.saveAccomplishment(operation.data);
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