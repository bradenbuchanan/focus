// src/hooks/useTimerLogic.ts
import { useState, useEffect, useRef } from 'react';
import {
  TimerData,
  TimerState,
  TimerSession,
  TimerSettings,
  defaultSettings,
  getSettings,
  saveSession,
  getLocalDateString,
} from '@/lib/timer';

// Define a type for the stored timer state
interface StoredTimerState {
  state: TimerState;
  currentSession: number;
  totalSessions: number;
  activity: string;
  sessionStartTime: number | null;
}

export function useTimerLogic(selectedActivity: string) {
  const [timerData, setTimerData] = useState<TimerData>({
    state: TimerState.IDLE,
    timeRemaining: 0,
    currentSession: 1,
    totalSessions: 4,
    settings: defaultSettings,
    showAccomplishmentRecorder: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);

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

  // Background timer handling
  useEffect(() => {
    updateTimerFromStorage();

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
  }, [selectedActivity]);

  // Store timer state for background operation
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
        handleBackgroundTimerCompletion(state);
        return;
      }

      setTimerData((prev) => ({
        ...prev,
        state: state.state,
        timeRemaining,
        currentSession: state.currentSession,
        totalSessions: state.totalSessions,
      }));

      sessionStartTimeRef.current = state.sessionStartTime || null;

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
        type: sessionType as 'break' | 'focus',
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
        showAccomplishmentRecorder: false,
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
        showAccomplishmentRecorder: true,
      }));
    }

    sessionStartTimeRef.current = null;
  };

  // The fixed interval timer function
  const startIntervalTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setTimerData((prev) => {
        if (prev.timeRemaining <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // Clear localStorage when timer completes
          localStorage.removeItem('focus_timer_end_time');
          localStorage.removeItem('focus_timer_state');

          // Record the completed session
          if (sessionStartTimeRef.current) {
            const sessionDuration = Math.floor(
              (Date.now() - sessionStartTimeRef.current) / 1000
            );

            const sessionType = prev.state === TimerState.BREAK ? 'break' : 'focus';

            const session: TimerSession = {
              date: new Date().toISOString(),
              localDate: getLocalDateString(new Date()),
              duration: sessionDuration,
              type: sessionType as 'break' | 'focus',
              completed: true,
              activity: selectedActivity,
            };

            saveSession(session);
            sessionStartTimeRef.current = null;
          }

          // Play notification if needed
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch((e) => console.log('Audio play failed:', e));
          } catch (e) {
            console.log('Audio creation failed:', e);
          }

          // Determine the next timer state
          if (prev.state === TimerState.BREAK) {
            // After break, go to next focus session
            return {
              ...prev,
              state: TimerState.IDLE,
              timeRemaining: prev.settings.focusDuration * 60,
              currentSession: prev.currentSession + 1,
              showAccomplishmentRecorder: false,
            };
          } else {
            // After focus, go to break
            const isLongBreak =
              prev.currentSession % prev.settings.longBreakInterval === 0;
            const breakDuration = isLongBreak
              ? prev.settings.longBreakDuration
              : prev.settings.breakDuration;

            return {
              ...prev,
              state: TimerState.BREAK,
              timeRemaining: breakDuration * 60,
              showAccomplishmentRecorder: true,
            };
          }
        }

        // Normal countdown
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);
  };

  // Save accomplishment after focus session
  const saveAccomplishment = (accomplishment: string) => {
    // Store the accomplishment with the most recent session
    if (sessionStartTimeRef.current) {
      const sessionDuration = Math.floor(
        (Date.now() - sessionStartTimeRef.current) / 1000
      );

      const session: TimerSession = {
        date: new Date().toISOString(),
        localDate: getLocalDateString(new Date()),
        duration: sessionDuration,
        type: 'focus',
        completed: true,
        activity: selectedActivity,
        accomplishment
      };

      saveSession(session);
    }

    // Hide the recorder
    setTimerData(prev => ({
      ...prev,
      showAccomplishmentRecorder: false
    }));
  };

  const skipAccomplishment = () => {
    setTimerData(prev => ({
      ...prev,
      showAccomplishmentRecorder: false
    }));
  };

  // Public methods exposed by the hook
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

  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setTimerData((prev) => ({ ...prev, state: TimerState.PAUSED }));

    // Clear stored state
    localStorage.removeItem('focus_timer_end_time');
    localStorage.removeItem('focus_timer_state');
  };

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
      showAccomplishmentRecorder: false,
    });
  };

  const updateSettings = (newSettings: TimerSettings) => {
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
  };

  return {
    timerData,
    startTimer,
    pauseTimer,
    resetTimer,
    updateSettings,
    saveAccomplishment,
    skipAccomplishment
  };
}