// src/hooks/timer/useTimerLogic.ts
import { useState, useEffect } from 'react';
import { TimerState, getSettings, TimerSettings, TimerData, getLocalDateString, saveSession } from '@/lib/timer';
import { useTimerState } from '../timer/useTimerState';
import { useSessionTracking } from '../timer/useSessionTracking';
import { useBackgroundTimer, StoredTimerState } from '../timer/useBackgroundTimer';
import { useTimerInterval } from '../timer/useTimerInterval';
import { useAccomplishments } from '../timer/useAccomplishments';
import { getTimerEndTime, calculateTimeRemaining, playNotificationSound } from '../timer/utils';

export function useTimerLogic(selectedActivity: string) {
  // Declare state variables at the top - only once
  const [lastSessionId, setLastSessionId] = useState<string>('');

  // Compose the smaller hooks
  const {
    timerData,
    initializeSettings,
    startTimer,
    pauseTimer,
    resetTimer,
    updateSettings,
    updateTimer,
    completeTimer,
    decrementTimer,
  } = useTimerState();

  const {
    startSession,
    recordSession,
    isSessionActive,
    getSessionStartTime,
    setSessionStartTime,
  } = useSessionTracking();

  const {
    showAccomplishmentPrompt,
    saveAccomplishment: _saveAccomplishment, // Rename it to avoid naming conflict
    skipAccomplishment,
    promptForAccomplishment,
    getAccomplishments,
    setSessionForAccomplishment,
  } = useAccomplishments();

  // Initial settings loading
  useEffect(() => {
    const settings = getSettings();
    initializeSettings(settings);
  }, []);

  const saveAccomplishment = (text: string, sessionId?: string) => {
    // Use provided sessionId or the lastSessionId
    const effectiveSessionId = sessionId || lastSessionId;
    
    if (text.trim() && effectiveSessionId) {
      // Call the hook's saveAccomplishment with the proper ID
      const success = _saveAccomplishment(text, effectiveSessionId);
      
      // Reset lastSessionId
      setLastSessionId('');
      
      return success;
    }
    return false;
  };
  
  // Update the recordFreeSession function
  const recordFreeSession = (duration: number, activity: string): string => {
    // Create and save the session, getting its ID
    const sessionId = recordSession('focus', activity, true, duration);
    
    // Save the session ID for the accomplishment
    setLastSessionId(sessionId);
    setSessionForAccomplishment(sessionId);
    
    // Return the sessionId so the component can use it
    return sessionId;
  };

  // Define handler functions for background timer
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
    
    const now = Date.now();
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

  // Instantiate background timer hook
  const {
    storeTimer,
    retrieveStoredTimer,
    clearStoredTimer,
  } = useBackgroundTimer(
    (isVisible) => {
      // This fires when visibility changes
      console.log(`Document visibility changed: ${isVisible ? 'visible' : 'hidden'}`);
    },
    handleStoreTimerState,
    handleRestoreTimerState
  );

  // Handle timer completion (from background or foreground)
  const handleTimerCompletion = (state: StoredTimerState) => {
    // Record the completed session
    if (state.sessionStartTime) {
      const sessionType = state.state === TimerState.BREAK ? 'break' : 'focus';
      recordSession(sessionType, state.activity);
      
      // Only prompt for accomplishment if it was a focus session
      if (sessionType === 'focus') {
        promptForAccomplishment();
      }
    }
    
    // Play notification
    playNotificationSound();
    
    // Clear stored state
    clearStoredTimer();
    
    // Move to next timer state (break or focus)
    completeTimer();
  };

  // Handle each timer tick
  const handleTimerTick = () => {
    decrementTimer();
  };

  const handleInterval = () => {
    // Record completed session
    const sessionType = timerData.state === TimerState.BREAK ? 'break' : 'focus';
    const sessionId = recordSession(sessionType, selectedActivity);
    
    // Only prompt for accomplishment if it was a focus session
    if (sessionType === 'focus') {
      // Save the session ID for the accomplishment
      setLastSessionId(sessionId);
      setSessionForAccomplishment(sessionId);
      
      // Call promptForAccomplishment
      promptForAccomplishment();
      
      // Set flag for accomplishment recorder
      timerData.showAccomplishmentRecorder = true;
    }
    // Play notification
    playNotificationSound();
    
    // Clear stored state
    clearStoredTimer();
    
    // Complete timer and move to next state
    completeTimer();
  };

  // Instantiate timer interval hook
  const {
    startInterval,
    stopInterval,
  } = useTimerInterval(
    timerData.state === TimerState.RUNNING || timerData.state === TimerState.BREAK,
    handleTimerTick,
    handleInterval,
    timerData.timeRemaining
  );

  // Public methods to expose to components
  const startTimerHandler = () => {
    // Start tracking the session if not already tracking
    if (!isSessionActive()) {
      startSession();
    }
    
    startTimer();
    
    // Store timer state for background operation
    handleStoreTimerState();
  };

  const pauseTimerHandler = () => {
    pauseTimer();
    stopInterval();
    
    // Clear stored state
    clearStoredTimer();
  };

  const resetTimerHandler = () => {
    // Record incomplete session if active
    if (isSessionActive() && 
        (timerData.state === TimerState.RUNNING || timerData.state === TimerState.BREAK)) {
      const sessionType = timerData.state === TimerState.BREAK ? 'break' : 'focus';
      recordSession(sessionType, selectedActivity, false);
    }
    
    stopInterval();
    resetTimer();
    
    // Clear stored state
    clearStoredTimer();
  };

  const updateSettingsHandler = (newSettings: TimerSettings) => {
    updateSettings(newSettings);
  };


  return {
    timerData,
    startTimer: startTimerHandler,
    pauseTimer: pauseTimerHandler,
    resetTimer: resetTimerHandler,
    updateSettings: updateSettingsHandler,
    showAccomplishmentPrompt,
    saveAccomplishment,
    skipAccomplishment,
    recordFreeSession,
  };
}