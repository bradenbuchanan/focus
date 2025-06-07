// src/services/TaskService.ts
import { BaseService } from './BaseService';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { QueuedOperation } from '@/utils/offlineQueue';
import { emitDataUpdate } from '@/utils/events';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export interface TaskInput {
  goalId?: string;
  text: string;
  activity?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  [key: string]: unknown; // Add index signature for OperationData compatibility
}

export interface TaskUpdateInput {
  id: string;
  goalId?: string;
  text?: string;
  completed?: boolean;
  activity?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  completedAt?: string;
  [key: string]: unknown; // Add index signature for OperationData compatibility
}

export class TaskService extends BaseService {
  private readonly CACHE_TTL = 3 * 60 * 1000; // 3 minutes for tasks

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

      // Invalidate cache
      this.invalidateUserCache(user.id, 'tasks');
      emitDataUpdate();

      return data.id;
    } catch (error) {
      if (!this.isOnline()) {
        return this.offlineQueue.add('tasks', 'create', this.toOperationData(task));
      }
      throw error;
    }
  }

  async getTasks(): Promise<Task[]> {
    try {
      const user = await this.getCurrentUser();
      const cacheKey = this.getCacheKey('tasks', user.id);
      
      // Check cache first
      const cached = this.cacheService.get<Task[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const tasks = data || [];
      
      // Cache the result
      this.cacheService.set(cacheKey, tasks, this.CACHE_TTL);
      
      return tasks;
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
      
      const updateData: Partial<TaskUpdate> = {};
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

      // Invalidate cache
      this.invalidateUserCache(user.id, 'tasks');
      emitDataUpdate();
    } catch (error) {
      if (!this.isOnline()) {
        this.offlineQueue.add('tasks', 'update', this.toOperationData(taskUpdate));
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

      // Invalidate cache
      this.invalidateUserCache(user.id, 'tasks');
      emitDataUpdate();
    } catch (error) {
      if (!this.isOnline()) {
        this.offlineQueue.add('tasks', 'delete', this.toOperationData({ id: taskId }));
        return;
      }
      throw error;
    }
  }

  async processOfflineOperation(operation: QueuedOperation): Promise<void> {
    if (operation.table !== 'tasks') return;

    switch (operation.operation) {
      case 'create':
        await this.saveTask(operation.data as TaskInput);
        break;
      case 'update':
        await this.updateTask(operation.data as TaskUpdateInput);
        break;
      case 'delete':
        await this.deleteTask(operation.data.id as string);
        break;
    }
  }
}