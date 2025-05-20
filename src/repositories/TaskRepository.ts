// src/repositories/TaskRepository.ts
import { supabase } from '@/lib/supabase';
import { Task } from '@/lib/timer';
import { emitDataUpdate } from '@/utils/events';

// Define a Supabase task interface
interface SupabaseTask {
  id: string;
  user_id: string;
  goal_id: string | null;
  text: string;
  completed: boolean;
  activity: string | null;
  priority: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Define task input interfaces
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

export class TaskRepository {
  private cache: Map<string, SupabaseTask[]> = new Map();
  private cacheExpiry: number = 60000; // 1 minute
  private lastFetch: number = 0;
  private retryCount = 0;
  private maxRetries = 3;

  async getTasks(): Promise<SupabaseTask[]> {
    const now = Date.now();
    const cacheKey = 'all-tasks';
    
    // Check if cache is valid
    if (this.cache.has(cacheKey) && (now - this.lastFetch) < this.cacheExpiry) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const tasks = await this._getTasksWithRetry();
      this.retryCount = 0; // Reset on success
      
      this.cache.set(cacheKey, tasks);
      this.lastFetch = now;
      
      return tasks;
    } catch (error) {
      console.error('All attempts failed, falling back to localStorage:', error);
      return this.getLocalTasksAsSupabaseTasks();
    }
  }

  private async _getTasksWithRetry(): Promise<SupabaseTask[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        return this.getLocalTasksAsSupabaseTasks();
      }
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Validate data before returning
      const tasks = (data || []).filter(this.isValidTask);
      return tasks;
    } catch (error) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
        return this._getTasksWithRetry();
      }
      throw error;
    }
  }

  async getTasksForActivity(activity?: string): Promise<SupabaseTask[]> {
    const allTasks = await this.getTasks();
    
    if (!activity || activity === 'All Activities') {
      return allTasks;
    }
    
    return allTasks.filter(task => task.activity === activity);
  }
  
  async getTasksForGoal(goalId: string): Promise<SupabaseTask[]> {
    const allTasks = await this.getTasks();
    return allTasks.filter(task => task.goal_id === goalId);
  }
  
  async getActiveTasks(activity?: string): Promise<SupabaseTask[]> {
    const tasks = activity 
      ? await this.getTasksForActivity(activity)
      : await this.getTasks();
    
    return tasks.filter(task => !task.completed);
  }
  
  async getCompletedTasks(activity?: string): Promise<SupabaseTask[]> {
    const tasks = activity 
      ? await this.getTasksForActivity(activity)
      : await this.getTasks();
    
    return tasks.filter(task => task.completed);
  }
  
  async saveTask(task: TaskInput): Promise<string> {
    try {
      const result = await this._saveTask(task);
      this.invalidateCache();
      emitDataUpdate();
      return result;
    } catch (error) {
      console.error('Error saving task:', error);
      throw error;
    }
  }
  
  async updateTask(task: TaskUpdateInput): Promise<void> {
    try {
      await this._updateTask(task);
      this.invalidateCache();
      emitDataUpdate();
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }
  
  async deleteTask(taskId: string): Promise<void> {
    try {
      await this._deleteTask(taskId);
      this.invalidateCache();
      emitDataUpdate();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }
  
  private async _saveTask(task: TaskInput): Promise<string> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        return this.saveLocalTask(task);
      }
      
      const taskData = {
        user_id: userData.user.id,
        goal_id: task.goalId || null,
        text: task.text,
        completed: false,
        activity: task.activity || null,
        priority: task.priority || 'medium',
        due_date: task.dueDate || null,
      };
      
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select();
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('Failed to create task');
      }
      
      return data[0].id;
    } catch (error) {
      console.error('Error saving task to Supabase:', error);
      return this.saveLocalTask(task);
    }
  }
  
  private async _updateTask(task: TaskUpdateInput): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        this.updateLocalTask(task);
        return;
      }
      
      // Create update data with proper types
      interface SupabaseUpdateData {
        goal_id?: string | null;
        text?: string;
        completed?: boolean;
        activity?: string | null;
        priority?: string | null;
        due_date?: string | null;
        completed_at?: string | null;
      }
      
      // Create an empty update data object
      const updateData: SupabaseUpdateData = {};
      
      // Only add defined properties
      if (task.goalId !== undefined) updateData.goal_id = task.goalId;
      if (task.text !== undefined) updateData.text = task.text;
      if (task.completed !== undefined) updateData.completed = task.completed;
      if (task.activity !== undefined) updateData.activity = task.activity;
      if (task.priority !== undefined) updateData.priority = task.priority;
      if (task.dueDate !== undefined) updateData.due_date = task.dueDate;
      if (task.completedAt !== undefined) updateData.completed_at = task.completedAt;
      
      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', task.id);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error updating task in Supabase:', error);
      this.updateLocalTask(task);
    }
  }
  
  private async _deleteTask(taskId: string): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        this.deleteLocalTask(taskId);
        return;
      }
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting task from Supabase:', error);
      this.deleteLocalTask(taskId);
    }
  }
  
  private invalidateCache(): void {
    this.cache.clear();
    this.lastFetch = 0;
  }
  
  private isValidTask(task: unknown): task is SupabaseTask {
    return typeof task === 'object' && 
      task !== null &&
      'id' in task && typeof (task as Record<string, unknown>).id === 'string' &&
      'text' in task && typeof (task as Record<string, unknown>).text === 'string' &&
      'completed' in task && typeof (task as Record<string, unknown>).completed === 'boolean';
  }
  
  // Local storage methods
  private getLocalTasks(): Task[] {
    if (typeof window === 'undefined') return [];
    
    const tasksData = localStorage.getItem('focusTasks');
    return tasksData ? JSON.parse(tasksData) : [];
  }
  
  private getLocalTasksAsSupabaseTasks(): SupabaseTask[] {
    const localTasks = this.getLocalTasks();
    
    return localTasks.map(task => ({
      id: task.id,
      user_id: '',  // Empty for local data
      goal_id: task.goalId || null,
      text: task.text,
      completed: task.completed,
      activity: task.activity || null,
      priority: task.priority || null,
      due_date: task.dueDate || null,
      completed_at: task.completedAt || null,
      created_at: task.createdAt || new Date().toISOString(),
      updated_at: task.createdAt || new Date().toISOString(),
    }));
  }
  
  private saveLocalTask(task: TaskInput): string {
    if (typeof window === 'undefined') return '';
    
    const localTask: Task = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      goalId: task.goalId,
      text: task.text,
      completed: false,
      activity: task.activity,
      priority: task.priority || 'medium',
      dueDate: task.dueDate,
      createdAt: new Date().toISOString(),
    };
    
    const tasks = this.getLocalTasks();
    tasks.push(localTask);
    localStorage.setItem('focusTasks', JSON.stringify(tasks));
    
    return localTask.id;
  }
  
  private updateLocalTask(updatedTask: TaskUpdateInput): void {
    if (typeof window === 'undefined') return;
    
    const tasks = this.getLocalTasks();
    const index = tasks.findIndex(t => t.id === updatedTask.id);
    
    if (index !== -1) {
      // Add completedAt timestamp when marking as complete
      if (updatedTask.completed === true && !tasks[index].completed) {
        updatedTask.completedAt = new Date().toISOString();
      }
      
      // Create a new task object with the updated values
      tasks[index] = {
        ...tasks[index],
        ...updatedTask
      };
      
      localStorage.setItem('focusTasks', JSON.stringify(tasks));
    }
  }
  
  private deleteLocalTask(taskId: string): void {
    if (typeof window === 'undefined') return;
    
    const tasks = this.getLocalTasks();
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    localStorage.setItem('focusTasks', JSON.stringify(updatedTasks));
  }
}