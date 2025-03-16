// src/app/components/timer/TimerContainer.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import TimerDisplay from './TimerDisplay';
import TimerSettings from './TimerSetting';
import ActivitySelector from './ActivitySelector';
import {
  TimerData,
  TimerState,
  TimerSession,
  TimerSettings as TimerSettingsType,
  defaultSettings,
  getSettings,
  saveSession,
  defaultActivityCategories,
  getLocalDateString,
} from '@/lib/timer';
import styles from './timer.module.css';

// Define a type for the stored timer state
interface StoredTimerState {
  state: TimerState;
  currentSession: number;
  totalSessions: number;
  activity: string;
  sessionStartTime: number | null;
}

export default function TimerContainer() {
  const [timerData, setTimerData] = useState<TimerData>({
    state: TimerState.IDLE,
    timeRemaining: 0,
    currentSession: 1,
    totalSessions: 4,
    settings: defaultSettings,
  });

  const [selectedActivity, setSelectedActivity] = useState(
    defaultActivityCategories[0]
  );

  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);

  // Store timer state when needed
  const storeTimerState = () => {
    if (
      timerData.state !== TimerState.RUNNING &&
      timerData.state !== TimerState.BREAK
    ) {
      return;
    }

    const endTime = Date.now() + timerData.timeRemaining * 1000;

    localStorage.setItem('focus_timer_end_time', endTime.toString());
    localStorage.setItem(
      'focus_timer_state',
      JSON.stringify({
        state: timerData.state,
        currentSession: timerData.currentSession,
        totalSessions: timerData.totalSessions,
        activity: selectedActivity,
        sessionStartTime: sessionStartTimeRef.current,
      })
    );
  };

  // Check and update timer when page becomes visible
  const updateTimerFromStorage = () => {
    const endTimeStr = localStorage.getItem('focus_timer_end_time');
    const stateStr = localStorage.getItem('focus_timer_state');

    if (!endTimeStr || !stateStr) return;

    try {
      const endTime = parseInt(endTimeStr, 10);
      const state = JSON.parse(stateStr) as StoredTimerState;
      const now = Date.now();
      const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));

      if (timeRemaining <= 0) {
        // Timer should have completed while we were away
        handleBackgroundTimerCompletion(state);
        return;
      }

      // Update timer with correct remaining time
      setTimerData((prev) => ({
        ...prev,
        state: state.state,
        timeRemaining,
        currentSession: state.currentSession,
        totalSessions: state.totalSessions,
      }));

      setSelectedActivity(state.activity || defaultActivityCategories[0]);

      // Update session start time reference
      sessionStartTimeRef.current = state.sessionStartTime || null;

      // Make sure interval is running
      if (!intervalRef.current) {
        startIntervalTimer();
      }
    } catch (e) {
      console.error('Error restoring timer state:', e);
    }
  };

  // Handle timer completion that occurred in background
  const handleBackgroundTimerCompletion = (state: StoredTimerState) => {
    // Record completed session
    if (state.sessionStartTime) {
      const sessionDuration = Math.floor(
        (Date.now() - state.sessionStartTime) / 1000
      );

      const sessionType = state.state === TimerState.BREAK ? 'break' : 'focus';

      const session: TimerSession = {
        date: new Date().toISOString(),
        localDate: getLocalDateString(new Date()),
        duration: sessionDuration,
        type: sessionType as 'break' | 'focus', // Type assertion to satisfy TypeScript
        completed: true,
        activity: state.activity,
      };

      saveSession(session);
    }

    // Play notification
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch((e) => console.log('Audio play failed:', e));
    } catch (e) {
      console.log('Audio creation failed:', e);
    }

    // Clear localStorage
    localStorage.removeItem('focus_timer_end_time');
    localStorage.removeItem('focus_timer_state');

    // Determine next state based on current state
    if (state.state === TimerState.BREAK) {
      // After break, go to next focus session
      setTimerData((prev) => ({
        ...prev,
        state: TimerState.IDLE,
        timeRemaining: prev.settings.focusDuration * 60,
        currentSession: state.currentSession + 1,
      }));
    } else {
      // After focus, go to break
      const isLongBreak =
        state.currentSession % timerData.settings.longBreakInterval === 0;
      const breakDuration = isLongBreak
        ? timerData.settings.longBreakDuration
        : timerData.settings.breakDuration;

      setTimerData((prev) => ({
        ...prev,
        state: TimerState.BREAK,
        timeRemaining: breakDuration * 60,
      }));
    }

    sessionStartTimeRef.current = null;
  };

  // Extract interval logic to separate function
  const startIntervalTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setTimerData((prev) => {
        if (prev.timeRemaining <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }

          // Clear localStorage when timer completes
          localStorage.removeItem('focus_timer_end_time');
          localStorage.removeItem('focus_timer_state');

          // The existing timer completion logic will run
          return prev;
        }

        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);
  };

  // Load settings from local storage
  useEffect(() => {
    const settings = getSettings();
    setTimerData((prev) => ({
      ...prev,
      settings,
      timeRemaining: settings.focusDuration * 60,
    }));
  }, []);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Add this useEffect hook for background timer
  useEffect(() => {
    // Check if we need to restore timer state when component mounts
    updateTimerFromStorage();

    // Set up visibility change listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateTimerFromStorage();
      } else {
        storeTimerState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Start timer function that includes background timer functionality
  const startTimer = () => {
    setTimerData((prev) => ({ ...prev, state: TimerState.RUNNING }));

    // Record start time for this session
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = Date.now();
    }

    // Store timer state for background operation
    storeTimerState();

    // Start the interval for UI updates
    startIntervalTimer();
  };

  // Pause timer with background timer cleanup
  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setTimerData((prev) => ({ ...prev, state: TimerState.PAUSED }));

    // Clear stored state
    localStorage.removeItem('focus_timer_end_time');
    localStorage.removeItem('focus_timer_state');
  };

  // Reset timer with background timer cleanup
  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Record incomplete session
    if (
      sessionStartTimeRef.current &&
      (timerData.state === TimerState.RUNNING ||
        timerData.state === TimerState.BREAK)
    ) {
      const sessionDuration = Math.floor(
        (Date.now() - sessionStartTimeRef.current) / 1000
      );

      // Now this check makes sense because we're handling both states
      const sessionType =
        timerData.state === TimerState.BREAK ? 'break' : 'focus';

      const session: TimerSession = {
        date: new Date().toISOString(),
        localDate: getLocalDateString(new Date()),
        duration: sessionDuration,
        type: sessionType,
        completed: true,
        activity: selectedActivity,
      };

      saveSession(session);
    }

    // Clear stored state
    localStorage.removeItem('focus_timer_end_time');
    localStorage.removeItem('focus_timer_state');

    sessionStartTimeRef.current = null;

    setTimerData({
      state: TimerState.IDLE,
      timeRemaining: timerData.settings.focusDuration * 60,
      currentSession: 1,
      totalSessions: 4,
      settings: timerData.settings,
    });
  };

  const updateSettings = (newSettings: TimerSettingsType) => {
    setTimerData((prev) => ({
      ...prev,
      settings: newSettings,
      timeRemaining:
        prev.state === TimerState.BREAK
          ? prev.currentSession % newSettings.longBreakInterval === 0
            ? newSettings.longBreakDuration * 60
            : newSettings.breakDuration * 60
          : newSettings.focusDuration * 60,
    }));
    setShowSettings(false);
  };

  return (
    <div className={styles.timerContainer}>
      {showSettings ? (
        <TimerSettings
          settings={timerData.settings}
          onSave={updateSettings}
          onCancel={() => setShowSettings(false)}
        />
      ) : (
        <>
          <ActivitySelector
            selectedActivity={selectedActivity}
            onSelectActivity={setSelectedActivity}
          />
          <TimerDisplay
            timerData={timerData}
            onStart={startTimer}
            onPause={pauseTimer}
            onReset={resetTimer}
            onOpenSettings={() => setShowSettings(true)}
          />
        </>
      )}
    </div>
  );
}
