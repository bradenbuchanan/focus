// src/hooks/timer/useTimerLogic.ts
import { useState, useEffect, useRef } from 'react';
import { TimerState, getSettings, TimerSettings } from '@/lib/timer';
import { useTimerState } from '../timer/useTimerState';
import { useSessionTracking } from '../timer/useSessionTracking';
import { useBackgroundTimer, StoredTimerState } from '../timer/useBackgroundTimer';
import { useTimerInterval } from '../timer/useTimerInterval';
import { useAccomplishments } from '../timer/useAccomplishments';
import { getTimerEndTime, calculateTimeRemaining, playNotificationSound } from '../timer/utils';
import { useData } from '../../providers/DataProvider';
import { getTasks } from '@/lib/timer';

export function useTimerLogic(selectedActivity: string) {
  // Separate state that doesn't depend on timerData
  const [lastSessionId, setLastSessionId] = useState<string>('');
  const [shouldShowAccomplishment, setShouldShowAccomplishment] = useState(false);
  
  // Ref to track if we're inside an effect to prevent double updates
  const isUpdatingRef = useRef(false);
  
  // Get the data context
  const { saveSession, updateTask, saveAccomplishment: saveAccomplishmentToSupabase } = useData();
  
  // Get the base timer hooks
  const timerStateHook = useTimerState();
  const { timerData, startTimer, pauseTimer, resetTimer, updateSettings, 
          updateTimer, completeTimer, decrementTimer } = timerStateHook;
  
  const sessionHook = useSessionTracking();
  const { startSession, recordSession: recordLocalSession, isSessionActive, 
          getSessionStartTime, setSessionStartTime } = sessionHook;
  
  const accomplishmentsHook = useAccomplishments();
  const { showAccomplishmentPrompt, saveAccomplishment: saveLocalAccomplishment, 
          skipAccomplishment, promptForAccomplishment, 
          setSessionForAccomplishment } = accomplishmentsHook;

  // Load initial settings only once
  const settingsLoadedRef = useRef(false);

  // Load initial settings only once
  useEffect(() => {
    if (settingsLoadedRef.current) return; // Skip if already loaded
    
    console.log('Loading initial timer settings');
    settingsLoadedRef.current = true;
    const settings = getSettings();
    updateSettings(settings);
  }, []); // Empty dependency array - this will run only once on mount
  
  // Record a session (first to Supabase, fallback to localStorage)
  const recordSession = async (
    sessionType: 'focus' | 'break', 
    activity: string, 
    completed: boolean = true,
    customDuration?: number
  ) => {
    if (!isSessionActive() && customDuration === undefined) return '';
    
    // Use custom duration if provided, otherwise calculate from start time
    const sessionDuration = customDuration !== undefined 
      ? customDuration 
      : Math.floor((Date.now() - (getSessionStartTime() || Date.now())) / 1000);
    
    try {
      // Try to save to Supabase first
      const sessionId = await saveSession({
        startTime: new Date(getSessionStartTime() || Date.now()),
        endTime: new Date(),
        duration: sessionDuration,
        type: sessionType,
        completed,
        activity,
      });
      
      if (customDuration === undefined) {
        setSessionStartTime(null);
      }
      
      return sessionId;
    } catch (error) {
      console.error('Failed to save session to Supabase:', error);
      
      // Fallback to localStorage
      return recordLocalSession(sessionType, activity, completed, customDuration);
    }
  };
  
  // Handle the accomplishment saving
  const saveAccomplishment = async (text: string, sessionId?: string, category?: string) => {
    const effectiveSessionId = sessionId || lastSessionId;
    
    if (!text.trim() || !effectiveSessionId) {
      return false;
    }
    
    // Reset state
    setShouldShowAccomplishment(false);
    
    try {
      // Try to save to Supabase first
      await saveAccomplishmentToSupabase({
        sessionId: effectiveSessionId,
        text: text.trim(),
        categories: category,
      });
      
      setLastSessionId('');
      return true;
    } catch (error) {
      console.error('Failed to save accomplishment to Supabase:', error);
      
      // Fallback to localStorage
      const success = saveLocalAccomplishment(text, effectiveSessionId, category);
      setLastSessionId('');
      return success;
    }
  };
  
  // Record a free session
  const recordFreeSession = async (duration: number, activity: string): Promise<string> => {
    const sessionId = await recordSession('focus', activity, true, duration);
    setLastSessionId(sessionId);
    setSessionForAccomplishment(sessionId);
    setShouldShowAccomplishment(true);
    return sessionId;
  };

  // Background timer handlers
  const handleStoreTimerState = () => {
    if (timerData.state !== TimerState.RUNNING && timerData.state !== TimerState.BREAK) {
      return;
    }
    
    const endTime = getTimerEndTime(timerData.timeRemaining);
    
    const stateToStore: StoredTimerState = {
      state: timerData.state,
      currentSession: timerData.currentSession,
      totalSessions: timerData.totalSessions,
      activity: selectedActivity,
      sessionStartTime: getSessionStartTime(),
    };
    
    storeTimer(endTime, stateToStore);
  };
  const handleRestoreTimerState = () => {
    // Skip if we're already updating
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    try {
      const { endTime, timerState } = retrieveStoredTimer();
      
      if (!endTime || !timerState) {
        isUpdatingRef.current = false;
        return;
      }
      
      // Skip restoration if timer is already running
      if (timerData.state === TimerState.RUNNING || timerData.state === TimerState.BREAK) {
        console.log('Timer already running, skipping state restoration');
        isUpdatingRef.current = false;
        return;
      }
      
      const timeRemaining = calculateTimeRemaining(endTime);
      
      if (timeRemaining <= 0) {
        handleTimerCompletion(timerState);
        isUpdatingRef.current = false;
        return;
      }
      
      // Restore timer state
      console.log('Restoring timer state', { timeRemaining });
      updateTimer(timeRemaining);
      startTimer();
      setSessionStartTime(timerState.sessionStartTime);
      
      // Restart the interval
      startInterval();
    } catch (error) {
      console.error('Error restoring timer state:', error);
    } finally {
      isUpdatingRef.current = false;
    }
  };

  // Background timer hook
  const backgroundHook = useBackgroundTimer(
    (isVisible) => {
      console.log(`Document visibility changed: ${isVisible ? 'visible' : 'hidden'}`);
    },
    handleStoreTimerState,
    handleRestoreTimerState
  );
  
  const { storeTimer, retrieveStoredTimer, clearStoredTimer } = backgroundHook;

  // Timer completion handler
  const handleTimerCompletion = async (state: StoredTimerState) => {
    if (!state.sessionStartTime) {
      // No active session to record
      playNotificationSound();
      clearStoredTimer();
      completeTimer();
      return;
    }
    
    const sessionType = state.state === TimerState.BREAK ? 'break' : 'focus';
    await recordSession(sessionType, state.activity);
    
    // Only prompt for accomplishment if it was a focus session
    if (sessionType === 'focus') {
      promptForAccomplishment();
      setShouldShowAccomplishment(true);
    }
    
    playNotificationSound();
    clearStoredTimer();
    completeTimer();
  };

  // Timer tick handler
  const handleTimerTick = () => {
    decrementTimer();
  };

  // Timer completion handler
  const handleInterval = async () => {
    const sessionType = timerData.state === TimerState.BREAK ? 'break' : 'focus';
    const sessionId = await recordSession(sessionType, selectedActivity);
    
    // Only setup accomplishment for focus sessions
    if (sessionType === 'focus') {
      setLastSessionId(sessionId);
      setSessionForAccomplishment(sessionId);
      promptForAccomplishment();
      setShouldShowAccomplishment(true);
    }
    
    playNotificationSound();
    clearStoredTimer();
    completeTimer();
  };

  // Timer interval hook
  const intervalHook = useTimerInterval(
    timerData.state === TimerState.RUNNING || timerData.state === TimerState.BREAK,
    handleTimerTick,
    handleInterval,
    timerData.timeRemaining
  );
  
  const { startInterval, stopInterval } = intervalHook;

  // Public handlers
  const startTimerHandler = () => {
    if (!isSessionActive()) {
      startSession();
    }
    
    startTimer();
    handleStoreTimerState();
  };

  const pauseTimerHandler = () => {
    pauseTimer();
    stopInterval();
    clearStoredTimer();
  };

  const resetTimerHandler = async () => {
    if (isSessionActive() && 
        (timerData.state === TimerState.RUNNING || timerData.state === TimerState.BREAK)) {
      const sessionType = timerData.state === TimerState.BREAK ? 'break' : 'focus';
      await recordSession(sessionType, selectedActivity, false);
    }
    
    stopInterval();
    resetTimer();
    clearStoredTimer();
    setShouldShowAccomplishment(false);
  };

  const updateSettingsHandler = (newSettings: TimerSettings) => {
    updateSettings(newSettings);
  };

  const completeTask = async (taskId: string) => {
    try {
      // Try to update in Supabase first
      await updateTask({
        id: taskId,
        completed: true,
        completedAt: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Failed to update task in Supabase:', error);
      
      // Fallback to localStorage
      const tasks = getTasks();
      const task = tasks.find(t => t.id === taskId);
      
      if (task) {
        const updatedTask = {
          ...task,
          completed: true,
          completedAt: new Date().toISOString()
        };
        
        updateTask(updatedTask);
        return true;
      }
      
      return false;
    }
  };

  // Return public API
  return {
    timerData,
    startTimer: startTimerHandler,
    pauseTimer: pauseTimerHandler,
    resetTimer: resetTimerHandler,
    updateSettings: updateSettingsHandler,
    showAccomplishmentPrompt: shouldShowAccomplishment || showAccomplishmentPrompt,
    saveAccomplishment,
    skipAccomplishment: () => {
      setShouldShowAccomplishment(false);
      return skipAccomplishment();
    },
    recordFreeSession,
    completeTask
  };
}