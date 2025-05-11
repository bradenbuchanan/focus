// src/repositories/TaskRepository.ts
import { supabase } from '@/lib/supabase';
import { Task } from '@/lib/timer';

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
  async getTasks(): Promise<SupabaseTask[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        return this.getLocalTasks().map(task => ({
          id: task.id,
          user_id: '',  // Empty for local data
          goal_id: task.goalId || null,
          text: task.text,
          completed: task.completed,
          activity: task.activity || null,
          priority: task.priority || null,
          due_date: task.dueDate || null,
          completed_at: task.completedAt || null,
          created_at: task.createdAt,
          updated_at: task.createdAt,
        }));
      }
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userData.user.id);
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching tasks from Supabase:', error);
      
      return this.getLocalTasks().map(task => ({
        id: task.id,
        user_id: '',  // Empty for local data
        goal_id: task.goalId || null,
        text: task.text,
        completed: task.completed,
        activity: task.activity || null,
        priority: task.priority || null,
        due_date: task.dueDate || null,
        completed_at: task.completedAt || null,
        created_at: task.createdAt,
        updated_at: task.createdAt,
      }));
    }
  }
  
  async saveTask(task: TaskInput): Promise<string> {
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
  
  async updateTask(task: TaskUpdateInput): Promise<void> {
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
  
  async deleteTask(taskId: string): Promise<void> {
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
  
  // Local storage methods
  private getLocalTasks(): Task[] {
    if (typeof window === 'undefined') return [];
    
    const tasksData = localStorage.getItem('focusTasks');
    return tasksData ? JSON.parse(tasksData) : [];
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