// src/repositories/TaskRepository.ts
import { supabase } from '@/lib/supabase';
import { Task } from '@/lib/timer';

export class TaskRepository {
  async getTasks(): Promise<any[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        return this.getLocalTasks();
      }
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userData.user.id);
        
      if (error) throw error;
      
      // Convert from database format to application format
      return data?.map(task => ({
        id: task.id,
        user_id: task.user_id,
        goal_id: task.goal_id,
        text: task.text,
        completed: task.completed,
        activity: task.activity,
        priority: task.priority,
        due_date: task.due_date,
        completed_at: task.completed_at,
        created_at: task.created_at,
        updated_at: task.updated_at,
      })) || [];
    } catch (error) {
      console.error('Error fetching tasks from Supabase:', error);
      return this.getLocalTasks();
    }
  }
  
  async saveTask(task: {
    goalId?: string;
    text: string;
    activity?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
  }): Promise<string> {
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
  
  async updateTask(task: {
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
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        this.updateLocalTask(task);
        return;
      }
      
      // Create an empty update data object
      const updateData: Record<string, any> = {};
      
      // Only add defined properties
      if (task.goalId !== undefined) updateData.goal_id = task.goalId;
      if (task.text !== undefined) updateData.text = task.text;
      if (task.completed !== undefined) updateData.completed = task.completed;
      if (task.activity !== undefined) updateData.activity = task.activity;
      if (task.priority !== undefined) updateData.priority = task.priority;
      if (task.dueDate !== undefined) updateData.due_date = task.dueDate;
      if (task.completedAt !== undefined) updateData.completed_at = task.completedAt;
      
      // No need to remove undefined values anymore
      
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
  
  private saveLocalTask(task: any): string {
    if (typeof window === 'undefined') return '';
    
    const localTask = {
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
  
  private updateLocalTask(updatedTask: any): void {
    if (typeof window === 'undefined') return;
    
    const tasks = this.getLocalTasks();
    const index = tasks.findIndex(t => t.id === updatedTask.id);
    
    if (index !== -1) {
      // Add completedAt timestamp when marking as complete
      if (updatedTask.completed && !tasks[index].completed) {
        updatedTask.completedAt = new Date().toISOString();
      }
      
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