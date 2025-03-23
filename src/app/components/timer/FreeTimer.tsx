// src/app/components/timer/FreeTimer.tsx
'use client';

import { useState, useEffect } from 'react';
import { formatTime } from '@/lib/timer';
import styles from './FreeTimer.module.css';

interface FreeTimerProps {
  activity: string;
  onComplete: (duration: number) => void;
  onCancel: () => void;
}

export default function FreeTimer({
  activity,
  onComplete,
  onCancel,
}: FreeTimerProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  // Track elapsed time
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRunning) {
      intervalId = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning]);

  const handlePauseResume = () => {
    setIsRunning(!isRunning);
  };

  const handleComplete = () => {
    onComplete(timeElapsed);
  };

  return (
    <div className={styles.freeTimerContainer}>
      <div className={styles.freeTimerDisplay}>
        <div className={styles.timeContent}>
          <div className={styles.time}>{formatTime(timeElapsed)}</div>
          <p className={styles.freeTimerInfo}>
            Time tracked: {Math.floor(timeElapsed / 60)} min {timeElapsed % 60}{' '}
            sec
          </p>
        </div>
      </div>

      <div className={styles.controls}>
        <button className={styles.primaryButton} onClick={handlePauseResume}>
          {isRunning ? 'Pause' : 'Resume'}
        </button>

        <button className={styles.primaryButton} onClick={handleComplete}>
          Complete
        </button>

        <button className={styles.secondaryButton} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
