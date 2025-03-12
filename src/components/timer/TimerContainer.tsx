import { useState, useEffect, useRef } from 'react';
import TimerDisplay from './TimerDisplay';
import { TimerData, TimerState, defaultSettings } from '@/lib/timer';
import styles from './timer.module.css';

export default function TimerContainer() {
  const [timerData, setTimerData] = useState<TimerData>({
    state: TimerState.IDLE,
    timeRemaining: defaultSettings.focusDuration * 60,
    currentSession: 1,
    totalSessions: 4,
    settings: defaultSettings,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clean up interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    setTimerData((prev) => ({ ...prev, state: TimerState.RUNNING }));

    intervalRef.current = setInterval(() => {
      setTimerData((prev) => {
        // If timer reaches zero
        if (prev.timeRemaining <= 1) {
          clearInterval(intervalRef.current!);

          // Toggle between focus and break
          const isBreak = prev.state === TimerState.BREAK;
          const isLastSession = prev.currentSession >= prev.totalSessions;

          if (isBreak) {
            // After break, start new focus session
            return {
              ...prev,
              state: TimerState.IDLE,
              timeRemaining: prev.settings.focusDuration * 60,
              currentSession: prev.currentSession + 1,
            };
          } else {
            // After focus, start break
            const isLongBreak =
              prev.currentSession % (prev.settings.longBreakInterval || 4) ===
              0;
            const breakDuration = isLongBreak
              ? prev.settings.longBreakDuration || 15
              : prev.settings.breakDuration;

            return {
              ...prev,
              state: TimerState.BREAK,
              timeRemaining: breakDuration * 60,
            };
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
    setTimerData({
      state: TimerState.IDLE,
      timeRemaining: defaultSettings.focusDuration * 60,
      currentSession: 1,
      totalSessions: 4,
      settings: defaultSettings,
    });
  };

  return (
    <div className={styles.timerContainer}>
      <TimerDisplay
        timerData={timerData}
        onStart={startTimer}
        onPause={pauseTimer}
        onReset={resetTimer}
      />
    </div>
  );
}
