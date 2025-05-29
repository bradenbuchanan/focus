// src/app/components/timer/TimerDisplay.tsx
'use client';

import React from 'react';
import { TimerData, TimerState, formatTime } from '@/lib/timer';

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

  return (
    <div className="timer-display">
      <div className="timer-circle">
        <div
          className="timer-circle-progress"
          style={
            {
              // Calculate progress based on current state and settings
              '--progress-percent': `${calculateProgress()}%`,
            } as React.CSSProperties
          }
        ></div>
        <div className="timer-time">{formatTime(timerData.timeRemaining)}</div>
        <div className="timer-label">
          {isBreak ? 'Break Time' : 'Focus Time'}
        </div>
      </div>

      <div className="timer-controls">
        {isRunning ? (
          <button onClick={onPause} className="btn btn--primary">
            Pause
          </button>
        ) : (
          <button onClick={onStart} className="btn btn--primary">
            {timerData.state === TimerState.IDLE ? 'Start' : 'Resume'}
          </button>
        )}
        <button onClick={onReset} className="btn btn--secondary">
          Reset
        </button>
        <button onClick={onOpenSettings} className="btn btn--secondary">
          Settings
        </button>
      </div>
    </div>
  );
}
