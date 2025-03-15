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

export const defaultActivityCategories = [
  'Reading',
  'Studying',
  'Programming',
  'Working',
  'Writing',
  'Meditating',
  'Other'
];

export enum TimerState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  BREAK = 'break'
}

export interface TimerSession {
  date: string;  // ISO string format (YYYY-MM-DDTHH:mm:ss.sssZ)
  localDate?: string; // Local YYYY-MM-DD format
  duration: number;  // in seconds
  type: 'focus' | 'break';
  completed: boolean;
  activity?: string; // Activity category
}

export interface TimerData {
  state: TimerState;
  timeRemaining: number;  // in seconds
  currentSession: number;
  totalSessions: number;
  settings: TimerSettings;
}

// Helper function to format time as MM:SS
export const getLocalDateString = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// When saving a session, use local date format
export const saveSession = (session: TimerSession): void => {
  if (typeof window === 'undefined') return;
  
  // Ensure the date is stored in the user's local timezone
  if (!session.localDate) {
    session.localDate = getLocalDateString(session.date);
  }
  
  const sessions = getSessions();
  sessions.push(session);
  localStorage.setItem('timerSessions', JSON.stringify(sessions));
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

