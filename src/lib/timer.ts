// src/lib/timer.ts

// ===================== TYPE DEFINITIONS =====================

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

// ===================== UTILITY FUNCTIONS =====================

// Helper function to format date to local string (YYYY-MM-DD)
export const getLocalDateString = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Create date in local timezone to avoid UTC conversion issues
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to format time as MM:SS
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Calculate goal progress (pure function - no data access)
// src/lib/timer.ts

// src/lib/timer.ts

export const calculateGoalProgress = (
  goal: Goal, 
  sessions?: TimerSession[]  // Make sessions optional
): {
  current: number;
  percentage: number;
} => {
  // Since getSessions is not available in this cleaned up file,
  // we need to make sessions required or handle it differently
  if (!sessions) {
    throw new Error('Sessions must be provided to calculateGoalProgress');
  }
  
  const focusSessions = sessions.filter((s: TimerSession) => s.type === 'focus');
  
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
  const relevantSessions = focusSessions.filter((session: TimerSession) => {
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
    current = Math.round(relevantSessions.reduce((total: number, s: TimerSession) => total + s.duration / 60, 0));
  } else {
    // Count sessions
    current = relevantSessions.length;
  }
  
  // Calculate percentage
  const percentage = Math.min(100, Math.round((current / goal.target) * 100));
  
  return { current, percentage };
};

// ===================== DATA OPERATIONS REMOVED =====================
// All data operations have been moved to repository classes:
// - SessionRepository
// - GoalRepository 
// - TaskRepository
// - AccomplishmentRepository
//
// Use the DataProvider to access these operations instead of direct localStorage calls