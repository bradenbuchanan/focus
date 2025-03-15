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

export enum TimerState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  BREAK = 'break'
}

export interface TimerSession {
  date: string;
  duration: number;  // in seconds
  type: 'focus' | 'break';
  completed: boolean;
}

export interface TimerData {
  state: TimerState;
  timeRemaining: number;  // in seconds
  currentSession: number;
  totalSessions: number;
  settings: TimerSettings;
}

// Helper function to format time as MM:SS
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Save timer sessions to local storage
export const saveSession = (session: TimerSession): void => {
  if (typeof window === 'undefined') return;
  
  const sessions = getSessions();
  sessions.push(session);
  localStorage.setItem('timerSessions', JSON.stringify(sessions));
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