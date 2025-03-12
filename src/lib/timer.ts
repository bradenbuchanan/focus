export interface TimerSettings {
    focusDuration: number;  // in minutes
    breakDuration: number;  // in minutes
    longBreakDuration?: number;  // in minutes
    longBreakInterval?: number;  // after how many sessions
  }
  
  export const defaultSettings: TimerSettings = {
    focusDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4
  };
  
  export enum TimerState {
    IDLE = 'idle',
    RUNNING = 'running',
    PAUSED = 'paused',
    BREAK = 'break'
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
  }