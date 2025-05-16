// src/app/components/timer/FreeTimer.tsx
'use client';

import { useState, useEffect } from 'react';
import { formatTime } from '@/lib/timer';
import styles from './FreeTimer.module.css';
import buttonStyles from '@/app/styles/shared/buttons.module.css';

interface FreeTimerProps {
  activity: string;
  onComplete: (duration: number) => void;
  onCancel: () => void;
}

export default function FreeTimer({ onComplete, onCancel }: FreeTimerProps) {
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
        <button
          className={buttonStyles.primaryButton}
          onClick={handlePauseResume}
        >
          {' '}
          {/* Use shared button style */}
          {isRunning ? 'Pause' : 'Resume'}
        </button>

        <button className={buttonStyles.primaryButton} onClick={handleComplete}>
          {' '}
          {/* Use shared button style */}
          Complete
        </button>

        <button className={buttonStyles.secondaryButton} onClick={onCancel}>
          {' '}
          {/* Use shared button style */}
          Cancel
        </button>
      </div>
    </div>
  );
}
