// src/hooks/timer/useTimerLogic.ts
import { useState, useEffect, useRef } from 'react';
import { TimerState, getSettings, TimerSettings } from '@/lib/timer';
import { useTimerState } from '../timer/useTimerState';
import { useSessionTracking } from '../timer/useSessionTracking';
import { useBackgroundTimer, StoredTimerState } from '../timer/useBackgroundTimer';
import { useTimerInterval } from '../timer/useTimerInterval';
import { useAccomplishments } from '../timer/useAccomplishments';
import { getTimerEndTime, calculateTimeRemaining, playNotificationSound } from '../timer/utils';
import { useSessionDB } from '@/hooks/useSessionDB';
import { getTasks, updateTask } from '@/lib/timer';

export function useTimerLogic(selectedActivity: string) {
  // Separate state that doesn't depend on timerData
  const [lastSessionId, setLastSessionId] = useState<string>('');
  const [shouldShowAccomplishment, setShouldShowAccomplishment] = useState(false);
  
  // Ref to track if we're inside an effect to prevent double updates
  const isUpdatingRef = useRef(false);
  
  // Get the base timer hooks
  const timerStateHook = useTimerState();
  const { timerData, startTimer, pauseTimer, resetTimer, updateSettings, 
          updateTimer, completeTimer, decrementTimer } = timerStateHook;
  
  const sessionHook = useSessionTracking();
  const { startSession, recordSession, isSessionActive, 
          getSessionStartTime, setSessionStartTime } = sessionHook;
  
  const accomplishmentsHook = useAccomplishments();
  const { showAccomplishmentPrompt, saveAccomplishment: _saveAccomplishment, 
          skipAccomplishment, promptForAccomplishment, 
          setSessionForAccomplishment } = accomplishmentsHook;
  
  // Optional DB hook
  const dbHook = useSessionDB?.() || { saveSession: null, saveAccomplishment: null };
  const { saveAccomplishment: saveAccomplishmentToDB } = dbHook;

  // Load initial settings only once
  useEffect(() => {
    if (!isUpdatingRef.current) {
      isUpdatingRef.current = true;
      const settings = getSettings();
      updateSettings(settings);
      isUpdatingRef.current = false;
    }
  }, []);
  
  // Handle the accomplishment saving
  const saveAccomplishment = (text: string, sessionId?: string, category?: string) => {
    const effectiveSessionId = sessionId || lastSessionId;
    
    if (!text.trim() || !effectiveSessionId) {
      return typeof saveAccomplishmentToDB === 'function' 
        ? Promise.resolve(false) 
        : false;
    }
    
    // Reset state
    setShouldShowAccomplishment(false);
    
    if (typeof saveAccomplishmentToDB === 'function') {
      return saveAccomplishmentToDB(text.trim(), effectiveSessionId, category)
        .then(success => {
          if (success) {
            setLastSessionId('');
            return true;
          }
          return _saveAccomplishment(text, effectiveSessionId, category);
        })
        .catch(() => {
          return _saveAccomplishment(text, effectiveSessionId, category);
        });
    } else {
      const success = _saveAccomplishment(text, effectiveSessionId, category);
      setLastSessionId('');
      return success;
    }
  };
  
  // Record a free session
  const recordFreeSession = (duration: number, activity: string): string => {
    const sessionId = recordSession('focus', activity, true, duration);
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
    const { endTime, timerState } = retrieveStoredTimer();
    
    if (!endTime || !timerState) return;
    
    const timeRemaining = calculateTimeRemaining(endTime);
    
    if (timeRemaining <= 0) {
      handleTimerCompletion(timerState);
      return;
    }
    
    // Restore timer state
    updateTimer(timeRemaining);
    startTimer();
    setSessionStartTime(timerState.sessionStartTime);
    
    // Restart the interval
    startInterval();
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
  const handleTimerCompletion = (state: StoredTimerState) => {
    if (!state.sessionStartTime) {
      // No active session to record
      playNotificationSound();
      clearStoredTimer();
      completeTimer();
      return;
    }
    
    const sessionType = state.state === TimerState.BREAK ? 'break' : 'focus';
    recordSession(sessionType, state.activity);
    
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
  const handleInterval = () => {
    const sessionType = timerData.state === TimerState.BREAK ? 'break' : 'focus';
    const sessionId = recordSession(sessionType, selectedActivity);
    
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

  const resetTimerHandler = () => {
    if (isSessionActive() && 
        (timerData.state === TimerState.RUNNING || timerData.state === TimerState.BREAK)) {
      const sessionType = timerData.state === TimerState.BREAK ? 'break' : 'focus';
      recordSession(sessionType, selectedActivity, false);
    }
    
    stopInterval();
    resetTimer();
    clearStoredTimer();
    setShouldShowAccomplishment(false);
  };

  const updateSettingsHandler = (newSettings: TimerSettings) => {
    updateSettings(newSettings);
  };

  const completeTask = (taskId: string) => {
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