// src/services/taskService.ts
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { Task } from '@/lib/timer';

type SupabaseTask = Database['public']['Tables']['tasks']['Row'];

export async function saveTask(task: {
  goalId?: string;
  text: string;
  activity?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}): Promise<string> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userData.user.id,
        goal_id: task.goalId || null,
        text: task.text,
        completed: false,
        activity: task.activity || null,
        priority: task.priority || null,
        due_date: task.dueDate || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error saving task to Supabase:', error);
    
    // Fallback to localStorage
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
    
    // Save to localStorage
    const tasks = getLocalTasks();
    tasks.push(localTask);
    localStorage.setItem('focusTasks', JSON.stringify(tasks));
    
    return localTask.id;
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting task from Supabase:', error);
    
    // Fallback to localStorage
    const tasks = getLocalTasks();
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    localStorage.setItem('focusTasks', JSON.stringify(updatedTasks));
  }
}

export async function updateTask(task: {
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
    const { error } = await supabase
      .from('tasks')
      .update({
        goal_id: task.goalId || null,
        text: task.text,
        completed: task.completed,
        activity: task.activity || null,
        priority: task.priority || null,
        due_date: task.dueDate || null,
        completed_at: task.completedAt || null,
      })
      .eq('id', task.id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating task in Supabase:', error);
    
    // Fallback to localStorage
    const tasks = getLocalTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...task };
      localStorage.setItem('focusTasks', JSON.stringify(tasks));
    }
  }
}

export async function getTasks(): Promise<SupabaseTask[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching tasks from Supabase:', error);
    
    // Fallback to localStorage
    return getLocalTasks().map(task => ({
      id: task.id,
      user_id: '', // This will be empty in fallback mode
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
}

// Helper function to get local tasks
function getLocalTasks(): Task[] {
  if (typeof window === 'undefined') return [];
  
  const tasksData = localStorage.getItem('focusTasks');
  return tasksData ? JSON.parse(tasksData) : [];
}