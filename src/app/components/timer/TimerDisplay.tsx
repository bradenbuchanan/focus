'use client';

// src/components/timer/TimerDisplay.tsx
import React from 'react';
import { TimerData, TimerState, formatTime } from '@/lib/timer';
import styles from './timer.module.css';

interface TimerDisplayProps {
  timerData: TimerData;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onOpenSettings: () => void;
}

export default function TimerDisplay({
  timerData,
  onStart,
  onPause,
  onReset,
  onOpenSettings,
}: TimerDisplayProps) {
  const isRunning = timerData.state === TimerState.RUNNING;
  const isBreak = timerData.state === TimerState.BREAK;

  // Calculate progress percentage
  const calculateProgress = () => {
    let totalTime = 0;
    if (isBreak) {
      const isLongBreak =
        timerData.currentSession % timerData.settings.longBreakInterval === 0;
      totalTime = isLongBreak
        ? timerData.settings.longBreakDuration * 60
        : timerData.settings.breakDuration * 60;
    } else {
      totalTime = timerData.settings.focusDuration * 60;
    }

    const progress = ((totalTime - timerData.timeRemaining) / totalTime) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const progressValue = calculateProgress();

  return (
    <div className={styles.timerDisplay}>
      <div
        className={`${styles.progressRing} ${
          isBreak ? styles.breakProgress : styles.focusProgress
        }`}
        style={{
          background: `conic-gradient(currentColor ${progressValue}%, transparent 0)`,
        }}
      >
        <div className={styles.progressInner}>
          <div className={styles.time}>
            {formatTime(timerData.timeRemaining)}
          </div>
          <div className={styles.sessionInfo}>
            {isBreak ? 'Break Time' : 'Focus Time'}
          </div>
        </div>
      </div>

      <div className={styles.sessionTracker}>
        Session {timerData.currentSession}/{timerData.totalSessions}
      </div>

      <div className={styles.controls}>
        {isRunning ? (
          <button onClick={onPause} className={styles.primaryButton}>
            Pause
          </button>
        ) : (
          <button onClick={onStart} className={styles.primaryButton}>
            {timerData.state === TimerState.IDLE ? 'Start' : 'Resume'}
          </button>
        )}
        <button onClick={onReset} className={styles.secondaryButton}>
          Reset
        </button>
        <button onClick={onOpenSettings} className={styles.secondaryButton}>
          Settings
        </button>
      </div>
    </div>
  );
}
