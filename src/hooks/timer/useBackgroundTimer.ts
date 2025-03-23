// src/hooks/timer/useBackgroundTimer.ts
import { useEffect } from 'react';
import { TimerState } from '@/lib/timer';

// Define interface for storing timer state
export interface StoredTimerState {
  state: TimerState;
  currentSession: number;
  totalSessions: number;
  activity: string;
  sessionStartTime: number | null;
}

export function useBackgroundTimer(
  onVisibilityChange: (isVisible: boolean) => void,
  storeTimerState: () => void,
  restoreTimerState: () => void
) {
  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      onVisibilityChange(isVisible);
      
      if (isVisible) {
        restoreTimerState();
      } else {
        storeTimerState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onVisibilityChange, storeTimerState, restoreTimerState]);

  // Store timer state in localStorage
  const storeTimer = (
    endTime: number,
    timerState: StoredTimerState
  ) => {
    localStorage.setItem('focus_timer_end_time', endTime.toString());
    localStorage.setItem('focus_timer_state', JSON.stringify(timerState));
  };

  // Retrieve timer state from localStorage
  const retrieveStoredTimer = (): { endTime: number | null, timerState: StoredTimerState | null } => {
    const endTimeStr = localStorage.getItem('focus_timer_end_time');
    const stateStr = localStorage.getItem('focus_timer_state');
    
    if (!endTimeStr || !stateStr) {
      return { endTime: null, timerState: null };
    }
    
    try {
      const endTime = parseInt(endTimeStr, 10);
      const timerState = JSON.parse(stateStr) as StoredTimerState;
      return { endTime, timerState };
    } catch (e) {
      console.error('Error parsing stored timer state:', e);
      return { endTime: null, timerState: null };
    }
  };

  // Clear stored timer from localStorage
  const clearStoredTimer = () => {
    localStorage.removeItem('focus_timer_end_time');
    localStorage.removeItem('focus_timer_state');
  };

  return {
    storeTimer,
    retrieveStoredTimer,
    clearStoredTimer,
  };
}