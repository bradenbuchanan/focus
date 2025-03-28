// src/lib/timer.ts
export interface TimerSettings {
  focusDuration: number;  // in minutes
  breakDuration: number;  // in minutes
  longBreakDuration: number;  // in minutes
  longBreakInterval: number;  // after how many sessions
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

export const defaultSettings: TimerSettings = {
  focusDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: true,
  autoStartPomodoros: false
};

export interface Task {
  id: string;
  goalId?: string;  // Optional reference to a goal
  text: string;     // The task description
  completed: boolean;
  createdAt: string; // ISO date string
  dueDate?: string;  // Optional due date
  activity?: string; // Activity category
  priority?: 'low' | 'medium' | 'high';
  completedAt?: string; // When the task was completed
}

export const defaultActivityCategories = [
  'Reading',
  'Studying',
  'Programming',
  'Working',
  'Writing',
  'Meditating',
  'Other'
];

export interface Goal {
  id: string;
  title: string;
  description?: string;
  type: 'time' | 'sessions';
  target: number; // minutes or number of sessions
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string; // ISO date string
  endDate?: string; // ISO date string (for custom periods)
  createdAt: string; // ISO date string
  activity?: string; // Add this to filter by specific activity
}

export enum TimerState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  BREAK = 'break',
  FREE = 'free'
}

export interface TimerSession {
  id: string;
  date: string;  // ISO string format (YYYY-MM-DDTHH:mm:ss.sssZ)
  localDate?: string; // Local YYYY-MM-DD format
  duration: number;  // in seconds
  type: 'focus' | 'break';
  completed: boolean;
  activity?: string; // Activity category
  accomplishment?: string; // Add this line
  accomplishmentCategory?: string; // Add this line for the category
}

export interface TimerData {
  state: TimerState;
  timeRemaining: number;  // in seconds
  currentSession: number;
  totalSessions: number;
  settings: TimerSettings;
  showAccomplishmentRecorder?: boolean;
}

// Helper function to format time as MM:SS
export const getLocalDateString = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// When saving a session, use local date format
export const saveSession = (session: TimerSession): string => {
  if (typeof window === 'undefined') return '';
  
  // Make sure an ID is assigned
  if (!session.id) {
    session.id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
  }
  
  // Ensure the date is stored in the user's local timezone
  if (!session.localDate) {
    session.localDate = getLocalDateString(session.date);
  }
  
  const sessions = getSessions();
  sessions.push(session);
  localStorage.setItem('timerSessions', JSON.stringify(sessions));
  
  return session.id; // Return the ID for reference
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Get all timer sessions from local storage
export const getSessions = (): TimerSession[] => {
  if (typeof window === 'undefined') return [];
  
  const sessionsData = localStorage.getItem('timerSessions');
  return sessionsData ? JSON.parse(sessionsData) : [];
};

// Save timer settings to local storage
export const saveSettings = (settings: TimerSettings): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('timerSettings', JSON.stringify(settings));
};

// Get timer settings from local storage
export const getSettings = (): TimerSettings => {
  if (typeof window === 'undefined') return defaultSettings;
  
  const settingsData = localStorage.getItem('timerSettings');
  return settingsData ? JSON.parse(settingsData) : defaultSettings;
};


// Get all goals from localStorage
export const getGoals = (): Goal[] => {
  if (typeof window === 'undefined') return [];
  
  const goalsData = localStorage.getItem('focusGoals');
  return goalsData ? JSON.parse(goalsData) : [];
};

// Save a new goal
export const saveGoal = (goal: Goal): void => {
  if (typeof window === 'undefined') return;
  
  const goals = getGoals();
  goals.push(goal);
  localStorage.setItem('focusGoals', JSON.stringify(goals));
};

// Update an existing goal
export const updateGoal = (updatedGoal: Goal): void => {
  if (typeof window === 'undefined') return;
  
  const goals = getGoals();
  const index = goals.findIndex(g => g.id === updatedGoal.id);
  if (index !== -1) {
    goals[index] = updatedGoal;
    localStorage.setItem('focusGoals', JSON.stringify(goals));
  }
};

// Delete a goal
export const deleteGoal = (goalId: string): void => {
  if (typeof window === 'undefined') return;
  
  const goals = getGoals();
  const updatedGoals = goals.filter(g => g.id !== goalId);
  localStorage.setItem('focusGoals', JSON.stringify(updatedGoals));
};


export const calculateGoalProgress = (goal: Goal): {
  current: number;
  percentage: number;
} => {
  const sessions = getSessions();
  const focusSessions = sessions.filter(s => s.type === 'focus');
  
  // Determine date range based on goal period
  const now = new Date();
  let startDate: Date;
  
  switch (goal.period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(goal.startDate);
  }
  
  // Filter sessions within the time period and matching the activity if specified
  const relevantSessions = focusSessions.filter(session => {
    const sessionDate = new Date(session.date);
    
    // Check if it's within the date range
    if (sessionDate < startDate || sessionDate > now) return false;
    
    // If goal has a specific activity, filter by that activity
    if (goal.activity && session.activity !== goal.activity) return false;
    
    return true;
  });
  
  let current = 0;
  
  if (goal.type === 'time') {
    // Sum up minutes
    current = Math.round(relevantSessions.reduce((total, s) => total + s.duration / 60, 0));
  } else {
    // Count sessions
    current = relevantSessions.length;
  }
  
  // Calculate percentage
  const percentage = Math.min(100, Math.round((current / goal.target) * 100));
  
  return { current, percentage };
};


// Functions to manage tasks
export const getTasks = (): Task[] => {
  if (typeof window === 'undefined') return [];
  
  const tasksData = localStorage.getItem('focusTasks');
  return tasksData ? JSON.parse(tasksData) : [];
};

export const saveTask = (task: Task): void => {
  if (typeof window === 'undefined') return;
  
  const tasks = getTasks();
  tasks.push(task);
  localStorage.setItem('focusTasks', JSON.stringify(tasks));
};

export const updateTask = (updatedTask: Task): void => {
  if (typeof window === 'undefined') return;
  
  // Add completedAt date if task is being marked as completed
  const tasks = getTasks();
  const existingTask = tasks.find(t => t.id === updatedTask.id);
  
  if (existingTask && !existingTask.completed && updatedTask.completed) {
    // Task is being marked as completed
    updatedTask.completedAt = new Date().toISOString();
  } else if (existingTask && existingTask.completed && !updatedTask.completed) {
    // Task is being uncompleted
    delete updatedTask.completedAt;
  }
  
  const index = tasks.findIndex(t => t.id === updatedTask.id);
  if (index !== -1) {
    tasks[index] = updatedTask;
    localStorage.setItem('focusTasks', JSON.stringify(tasks));
  }
};

export const deleteTask = (taskId: string): void => {
  if (typeof window === 'undefined') return;
  
  const tasks = getTasks();
  const updatedTasks = tasks.filter(t => t.id !== taskId);
  localStorage.setItem('focusTasks', JSON.stringify(updatedTasks));
};

// Get tasks for a specific goal
export const getTasksForGoal = (goalId: string): Task[] => {
  const tasks = getTasks();
  return tasks.filter(task => task.goalId === goalId);
};