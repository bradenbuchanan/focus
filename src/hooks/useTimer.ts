// src/hooks/useTimer.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { TimerState, TimerSettings, TimerData, defaultSettings } from '@/lib/timer';
import { useData } from '@/providers/DataProvider';
import { emitDataUpdate } from '@/utils/events';

export interface TimerHookResult {
  // Timer state
  timerData: TimerData;
  isRunning: boolean;
  isBreak: boolean;
  
  // Core timer controls
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  updateSettings: (settings: TimerSettings) => void;
  
  // Session management
  recordFreeSession: (duration: number, activity: string) => Promise<string>;
  completeTask: (taskId: string) => Promise<boolean>;
  
  // Accomplishment management
  showAccomplishmentPrompt: boolean;
  saveAccomplishment: (text: string, sessionId?: string, category?: string) => Promise<boolean>;
  skipAccomplishment: () => boolean;
}

export function useTimer(selectedActivity: string): TimerHookResult {
  // ======= STATE MANAGEMENT =======
  // Core timer state
  const [timerData, setTimerData] = useState<TimerData>({
    state: TimerState.IDLE,
    timeRemaining: defaultSettings.focusDuration * 60,
    currentSession: 1,
    totalSessions: 4,
    settings: defaultSettings,
  });
  
  // Additional state management
  const [showAccomplishmentPrompt, setShowAccomplishmentPrompt] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);
  
  // Get repository methods from DataProvider
  const { saveSession, saveAccomplishment: saveAccomplishmentToServer, updateTask } = useData();
  
  // ======= TIMER OPERATIONS =======
  // Extract helpers for clarity
  const isLongBreak = useCallback((session: number, interval: number) => {
    return session % interval === 0;
  }, []);
  
  // Start the timer
  const startTimer = useCallback(() => {
    if (timerData.state !== TimerState.RUNNING) {
      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = Date.now();
      }
      
      setTimerData(prev => ({ ...prev, state: TimerState.RUNNING }));
      
      // Start the interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        setTimerData(prev => {
          // Handle timer completion
          if (prev.timeRemaining <= 1) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            handleTimerCompletion();
            return prev;
          }
          
          // Otherwise just decrement
          return { 
            ...prev, 
            timeRemaining: prev.timeRemaining - 1 
          };
        });
      }, 1000);
      
      // Store timer state for background handling
      storeTimerState();
    }
  }, [timerData.state]);
  
  // Pause the timer
  const pauseTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setTimerData(prev => ({ ...prev, state: TimerState.PAUSED }));
    clearStoredTimer();
  }, []);
  
  // Reset the timer
  const resetTimer = useCallback(async () => {
    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Record incomplete session if one is in progress
    if (sessionStartTimeRef.current && 
        (timerData.state === TimerState.RUNNING || timerData.state === TimerState.BREAK)) {
      const sessionType = timerData.state === TimerState.BREAK ? 'break' : 'focus';
      await recordSession(sessionType, selectedActivity, false);
    }
    
    // Reset timer state
    setTimerData(prev => ({
      ...prev,
      state: TimerState.IDLE,
      timeRemaining: prev.settings.focusDuration * 60,
      currentSession: 1,
    }));
    
    setShowAccomplishmentPrompt(false);
    clearStoredTimer();
  }, [timerData.state, selectedActivity]);
  
  // Update timer settings
  const updateSettings = useCallback((newSettings: TimerSettings) => {
    setTimerData(prev => {
      // Only update if settings have changed
      if (JSON.stringify(prev.settings) === JSON.stringify(newSettings)) {
        return prev;
      }
      
      // Calculate correct time based on current state
      let timeRemaining = prev.timeRemaining;
      if (prev.state === TimerState.IDLE) {
        timeRemaining = newSettings.focusDuration * 60;
      } else if (prev.state === TimerState.BREAK) {
        timeRemaining = (isLongBreak(prev.currentSession, newSettings.longBreakInterval)
          ? newSettings.longBreakDuration 
          : newSettings.breakDuration) * 60;
      }
      
      return {
        ...prev,
        settings: newSettings,
        timeRemaining,
      };
    });
  }, [isLongBreak]);
  
  // ======= BACKGROUND HANDLING =======
  // Store the timer state in localStorage
  const storeTimerState = useCallback(() => {
    if (timerData.state !== TimerState.RUNNING && timerData.state !== TimerState.BREAK) {
      return;
    }
    
    const endTime = Date.now() + timerData.timeRemaining * 1000;
    
    localStorage.setItem('focus_timer_end_time', endTime.toString());
    localStorage.setItem('focus_timer_state', JSON.stringify({
      state: timerData.state,
      currentSession: timerData.currentSession,
      totalSessions: timerData.totalSessions,
      activity: selectedActivity,
      sessionStartTime: sessionStartTimeRef.current,
    }));
  }, [timerData, selectedActivity]);
  
  // Clear stored timer
  const clearStoredTimer = useCallback(() => {
    localStorage.removeItem('focus_timer_end_time');
    localStorage.removeItem('focus_timer_state');
  }, []);
  
  // Restore timer when tab becomes visible
  const restoreTimerState = useCallback(() => {
    const endTimeStr = localStorage.getItem('focus_timer_end_time');
    const stateStr = localStorage.getItem('focus_timer_state');
    
    if (!endTimeStr || !stateStr) {
      return;
    }
    
    try {
      const endTime = parseInt(endTimeStr, 10);
      const storedState = JSON.parse(stateStr);
      
      // Calculate remaining time
      const now = Date.now();
      const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
      
      if (timeRemaining <= 0) {
        // Timer completed while in background
        handleTimerCompletion(storedState);
        return;
      }
      
      // Restore timer state
      setTimerData(prev => ({
        ...prev,
        state: storedState.state,
        timeRemaining,
        currentSession: storedState.currentSession,
        totalSessions: storedState.totalSessions,
      }));
      
      sessionStartTimeRef.current = storedState.sessionStartTime;
      
      // Restart the timer
      startTimer();
    } catch (error) {
      console.error('Error restoring timer state:', error);
    }
  }, [startTimer]);
  
  // ======= SESSION MANAGEMENT =======
  // Record a completed session
  const recordSession = useCallback(async (
    sessionType: 'focus' | 'break',
    activity: string,
    completed: boolean = true,
    customDuration?: number
  ): Promise<string> => {
    if (!sessionStartTimeRef.current && customDuration === undefined) {
      return '';
    }
    
    const sessionStartTime = sessionStartTimeRef.current || Date.now();
    const sessionDuration = customDuration !== undefined
      ? customDuration
      : Math.floor((Date.now() - sessionStartTime) / 1000);
    
    try {
      // Use the exact start time for the session
      const startTime = new Date(sessionStartTime);
      const endTime = new Date(sessionStartTime + (sessionDuration * 1000));
      
      console.log('Recording session:', {
        type: sessionType,
        activity,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: sessionDuration,
        completed
      });
      
      const sessionId = await saveSession({
        startTime,
        endTime,
        duration: sessionDuration,
        type: sessionType,
        completed,
        activity,
      });
      
      // Emit update event after successful save
      emitDataUpdate();
      
      if (customDuration === undefined) {
        sessionStartTimeRef.current = null;
      }
      
      return sessionId;
    } catch (error) {
      console.error('Failed to save session:', error);
      return '';
    }
  }, [saveSession]);
  
  // Record a free session
  const recordFreeSession = useCallback(async (
    duration: number,
    activity: string
  ): Promise<string> => {
    const sessionId = await recordSession('focus', activity, true, duration);
    setCurrentSessionId(sessionId);
    setShowAccomplishmentPrompt(true);
    return sessionId;
  }, [recordSession]);
  
  // Handle timer completion
  const handleTimerCompletion = useCallback(async (storedState?: any) => {
    const state = storedState || {
      state: timerData.state,
      activity: selectedActivity,
      sessionStartTime: sessionStartTimeRef.current
    };
    
    const sessionType = state.state === TimerState.BREAK ? 'break' : 'focus';
    
    // Only record if a session was actually started
    if (state.sessionStartTime) {
      const sessionId = await recordSession(
        sessionType,
        state.activity || selectedActivity,
        true
      );
      
      // Only prompt for accomplishment after focus sessions
      if (sessionType === 'focus') {
        setCurrentSessionId(sessionId);
        setShowAccomplishmentPrompt(true);
      }
    }
    
    // Play notification
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (e) {
      console.log('Audio creation failed:', e);
    }
    
    // Transition to next timer state
    clearStoredTimer();
    
    setTimerData(prev => {
      if (prev.state === TimerState.BREAK || storedState?.state === TimerState.BREAK) {
        // After break, return to focus mode for next session
        return {
          ...prev,
          state: TimerState.IDLE,
          timeRemaining: prev.settings.focusDuration * 60,
          currentSession: prev.currentSession + 1,
        };
      } else {
        // After focus, go to break
        const isLongBreakTime = isLongBreak(prev.currentSession, prev.settings.longBreakInterval);
        const breakDuration = isLongBreakTime
          ? prev.settings.longBreakDuration
          : prev.settings.breakDuration;
          
        return {
          ...prev,
          state: TimerState.BREAK,
          timeRemaining: breakDuration * 60,
        };
      }
    });
  }, [timerData, selectedActivity, recordSession, clearStoredTimer, isLongBreak]);
  
  // ======= ACCOMPLISHMENT MANAGEMENT =======
  // Save accomplishment
  const saveAccomplishment = useCallback(async (
    text: string,
    sessionId?: string,
    category?: string
  ): Promise<boolean> => {
    const effectiveSessionId = sessionId || currentSessionId;
    
    if (!text.trim() || !effectiveSessionId) {
      return false;
    }
    
    try {
      // Save to Supabase
      await saveAccomplishmentToServer({
        sessionId: effectiveSessionId,
        text: text.trim(),
        categories: category,
      });
      
      // Emit update event
      emitDataUpdate();
      
      setShowAccomplishmentPrompt(false);
      setCurrentSessionId('');
      return true;
    } catch (error) {
      console.error('Failed to save accomplishment:', error);
      
      setShowAccomplishmentPrompt(false);
      setCurrentSessionId('');
      return false;
    }
  }, [currentSessionId, saveAccomplishmentToServer]);
  
  // Skip recording an accomplishment
  const skipAccomplishment = useCallback((): boolean => {
    setShowAccomplishmentPrompt(false);
    setCurrentSessionId('');
    return true;
  }, []);
  
  // Complete a task
  const completeTask = useCallback(async (taskId: string): Promise<boolean> => {
    try {
      await updateTask({
        id: taskId,
        completed: true,
        completedAt: new Date().toISOString()
      });
      
      // Emit update event
      emitDataUpdate();
      
      return true;
    } catch (error) {
      console.error('Failed to complete task:', error);
      return false;
    }
  }, [updateTask]);
  
  // ======= VISIBILITY CHANGE HANDLING =======
  // Handle visibility changes (tab focus/unfocus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        restoreTimerState();
      } else {
        storeTimerState();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [restoreTimerState, storeTimerState]);
  
  // ======= DERIVED STATE =======
  const isRunning = timerData.state === TimerState.RUNNING;
  const isBreak = timerData.state === TimerState.BREAK;
  
  return {
    // Timer state
    timerData,
    isRunning,
    isBreak,
    
    // Core timer controls
    startTimer,
    pauseTimer,
    resetTimer,
    updateSettings,
    
    // Session management
    recordFreeSession,
    completeTask,
    
    // Accomplishment management
    showAccomplishmentPrompt,
    saveAccomplishment,
    skipAccomplishment,
  };
}