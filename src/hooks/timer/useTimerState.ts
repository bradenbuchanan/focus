// src/hooks/timer/useTimerState.ts
import { useState } from 'react';
import { TimerData, TimerState, TimerSettings, defaultSettings } from '@/lib/timer';
import { isLongBreak } from './utils';

export function useTimerState() {
  const [timerData, setTimerData] = useState<TimerData>({
    state: TimerState.IDLE,
    timeRemaining: defaultSettings.focusDuration * 60,
    currentSession: 1,
    totalSessions: 4,
    settings: defaultSettings,
  });

  // Load initial settings
  const initializeSettings = (settings: TimerSettings) => {
    setTimerData(prev => ({
      ...prev,
      settings,
      timeRemaining: settings.focusDuration * 60,
    }));
  };

  // Start timer
  const startTimer = () => {
    setTimerData(prev => ({ ...prev, state: TimerState.RUNNING }));
  };

  // Pause timer
  const pauseTimer = () => {
    setTimerData(prev => ({ ...prev, state: TimerState.PAUSED }));
  };

  // Reset timer
  const resetTimer = () => {
    setTimerData(prev => ({
      ...prev,
      state: TimerState.IDLE,
      timeRemaining: prev.settings.focusDuration * 60,
      currentSession: 1,
    }));
  };

  // Update settings
  const updateSettings = (newSettings: TimerSettings) => {
    setTimerData(prev => {
      // Calculate correct time remaining based on current state
      const timeRemaining = 
        prev.state === TimerState.BREAK
          ? (isLongBreak(prev.currentSession, newSettings.longBreakInterval)
              ? newSettings.longBreakDuration 
              : newSettings.breakDuration) * 60
          : newSettings.focusDuration * 60;
      
      return {
        ...prev,
        settings: newSettings,
        timeRemaining,
      };
    });
  };

  // Update timer (called each second or when restoring from background)
  const updateTimer = (newTimeRemaining: number) => {
    setTimerData(prev => ({ ...prev, timeRemaining: newTimeRemaining }));
  };

  // Handle timer completion
  const completeTimer = () => {
    setTimerData(prev => {
      if (prev.state === TimerState.BREAK) {
        // After break, go to next focus session
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
  };

  // Decrement timer by one second
  const decrementTimer = () => {
    setTimerData(prev => {
      // Don't decrement if time is up
      if (prev.timeRemaining <= 0) return prev;
      return { ...prev, timeRemaining: prev.timeRemaining - 1 };
    });
  };

  return {
    timerData,
    initializeSettings,
    startTimer,
    pauseTimer,
    resetTimer,
    updateSettings,
    updateTimer,
    completeTimer,
    decrementTimer,
  };
}