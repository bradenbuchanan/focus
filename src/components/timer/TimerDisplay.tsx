import React from 'react';
import { TimerData, TimerState, formatTime } from '@/lib/timer';
import styles from './timer.module.css';

interface TimerDisplayProps {
  timerData: TimerData;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export default function TimerDisplay({
  timerData,
  onStart,
  onPause,
  onReset,
}: TimerDisplayProps) {
  const isRunning = timerData.state === TimerState.RUNNING;
  const isBreak = timerData.state === TimerState.BREAK;

  return (
    <div className={styles.timerDisplay}>
      <div className={styles.time}>{formatTime(timerData.timeRemaining)}</div>
      <div className={styles.sessionInfo}>
        {isBreak ? 'Break Time' : 'Focus Time'} • Session{' '}
        {timerData.currentSession}/{timerData.totalSessions}
      </div>
      <div className={styles.controls}>
        {isRunning ? (
          <button onClick={onPause} className={styles.primaryButton}>
            Pause
          </button>
        ) : (
          <button onClick={onStart} className={styles.primaryButton}>
            Start
          </button>
        )}
        <button onClick={onReset} className={styles.secondaryButton}>
          Reset
        </button>
      </div>
    </div>
  );
}
