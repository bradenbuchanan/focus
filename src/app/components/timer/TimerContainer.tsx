'use client';

// src/components/timer/TimerContainer.tsx
import { useState, useEffect, useRef } from 'react';
import TimerDisplay from './TimerDisplay';
import TimerSettings from './TimerSetting';
import {
  TimerData,
  TimerState,
  TimerSession,
  TimerSettings as TimerSettingsType,
  defaultSettings,
  getSettings,
  saveSession,
} from '@/lib/timer';
import styles from './timer.module.css';

export default function TimerContainer() {
  const [timerData, setTimerData] = useState<TimerData>({
    state: TimerState.IDLE,
    timeRemaining: 0,
    currentSession: 1,
    totalSessions: 4,
    settings: defaultSettings,
  });

  const [showSettings, setShowSettings] = useState(false);
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

  const startTimer = () => {
    setTimerData((prev) => ({ ...prev, state: TimerState.RUNNING }));

    // Record start time for this session
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = Date.now();
    }

    intervalRef.current = setInterval(() => {
      setTimerData((prev) => {
        // If timer reaches zero
        if (prev.timeRemaining <= 1) {
          clearInterval(intervalRef.current!);

          // Record completed session
          if (sessionStartTimeRef.current) {
            const sessionDuration = Math.floor(
              (Date.now() - sessionStartTimeRef.current) / 1000
            );
            const sessionType =
              prev.state === TimerState.BREAK ? 'break' : 'focus';

            const session: TimerSession = {
              date: new Date().toISOString(),
              duration: sessionDuration,
              type: sessionType,
              completed: true,
            };

            saveSession(session);
            sessionStartTimeRef.current = null;
          }

          // Play notification sound if available
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch((e) => console.log('Audio play failed:', e));
          } catch (e) {
            console.log('Audio creation failed:', e);
          }

          // Toggle between focus and break
          const isBreak = prev.state === TimerState.BREAK;
          const isLastSession = prev.currentSession >= prev.totalSessions;

          if (isBreak) {
            // After break, start new focus session
            const nextSession = {
              ...prev,
              state: prev.settings.autoStartPomodoros
                ? TimerState.RUNNING
                : TimerState.IDLE,
              timeRemaining: prev.settings.focusDuration * 60,
              currentSession: prev.currentSession + 1,
            };

            // If auto-start enabled, set new session start time
            if (prev.settings.autoStartPomodoros) {
              sessionStartTimeRef.current = Date.now();
            }

            return nextSession;
          } else {
            // After focus, start break
            const isLongBreak =
              prev.currentSession % prev.settings.longBreakInterval === 0;
            const breakDuration = isLongBreak
              ? prev.settings.longBreakDuration
              : prev.settings.breakDuration;

            const nextSession = {
              ...prev,
              state: prev.settings.autoStartBreaks
                ? TimerState.RUNNING
                : TimerState.IDLE,
              timeRemaining: breakDuration * 60,
            };

            if (nextSession.state === TimerState.RUNNING) {
              sessionStartTimeRef.current = Date.now();
            } else {
              nextSession.state = TimerState.BREAK;
            }

            return nextSession;
          }
        }

        // Otherwise, just decrement the time
        return {
          ...prev,
          timeRemaining: prev.timeRemaining - 1,
        };
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTimerData((prev) => ({ ...prev, state: TimerState.PAUSED }));
  };

  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Record incomplete session
    if (sessionStartTimeRef.current && timerData.state === TimerState.RUNNING) {
      const sessionDuration = Math.floor(
        (Date.now() - sessionStartTimeRef.current) / 1000
      );

      // Use timerData directly here, not prev
      const sessionType =
        (timerData.state as TimerState) === TimerState.BREAK
          ? 'break'
          : 'focus';

      const session: TimerSession = {
        date: new Date().toISOString(),
        duration: sessionDuration,
        type: sessionType,
        completed: false,
      };

      saveSession(session);
    }

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
