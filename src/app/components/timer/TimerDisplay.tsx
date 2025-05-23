// src/app/components/timer/TimerDisplay.tsx
'use client';

import React from 'react';
import { TimerData, TimerState, formatTime } from '@/lib/timer';
import buttonStyles from '@/app/styles/shared/buttons.module.css';
import styles from './TimerDisplay.module.css';

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

  // In TimerDisplay.tsx, update the return statement
  return (
    <div className={styles.timerDisplay}>
      <div className={styles.timerCircle}>
        <div
          className={styles.timerCircleProgress}
          style={
            {
              // Calculate progress based on current state and settings
              '--progress-percent': `${calculateProgress()}%`,
            } as React.CSSProperties
          }
        ></div>
        <div className={styles.timerTime}>
          {formatTime(timerData.timeRemaining)}
        </div>
        <div className={styles.timerLabel}>
          {isBreak ? 'Break Time' : 'Focus Time'}
        </div>
      </div>

      <div className={styles.timerControls}>
        {isRunning ? (
          <button onClick={onPause} className={buttonStyles.primaryButton}>
            Pause
          </button>
        ) : (
          <button onClick={onStart} className={buttonStyles.primaryButton}>
            {timerData.state === TimerState.IDLE ? 'Start' : 'Resume'}
          </button>
        )}
        <button onClick={onReset} className={buttonStyles.secondaryButton}>
          Reset
        </button>
        <button
          onClick={onOpenSettings}
          className={buttonStyles.secondaryButton}
        >
          Settings
        </button>
      </div>
    </div>
  );
}
