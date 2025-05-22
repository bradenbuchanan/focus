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
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Store and restore free timer state
  useEffect(() => {
    // Try to restore from localStorage on mount
    const storedStartTime = localStorage.getItem('free_timer_start_time');
    const storedIsRunning = localStorage.getItem('free_timer_is_running');

    if (storedStartTime && storedIsRunning === 'true') {
      const savedStartTime = parseInt(storedStartTime, 10);
      const elapsedSeconds = Math.floor((Date.now() - savedStartTime) / 1000);
      setStartTime(savedStartTime);
      setTimeElapsed(elapsedSeconds);
      setIsRunning(true);
    } else {
      // Fresh start
      const now = Date.now();
      setStartTime(now);
      localStorage.setItem('free_timer_start_time', now.toString());
      localStorage.setItem('free_timer_is_running', 'true');
    }
  }, []);

  // Track elapsed time
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRunning) {
      intervalId = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setTimeElapsed(elapsed);
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, startTime]);

  // Store state when running status changes
  useEffect(() => {
    localStorage.setItem('free_timer_is_running', isRunning.toString());
    if (!isRunning) {
      localStorage.setItem('free_timer_pause_time', Date.now().toString());
    }
  }, [isRunning]);

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning) {
        // Recalculate elapsed time when tab becomes visible
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setTimeElapsed(elapsed);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, startTime]);

  const handlePauseResume = () => {
    if (isRunning) {
      // Pausing - store the current elapsed time
      localStorage.setItem('free_timer_pause_time', Date.now().toString());
      setIsRunning(false);
    } else {
      // Resuming - adjust start time to account for pause
      const now = Date.now();
      const newStartTime = now - timeElapsed * 1000;
      setStartTime(newStartTime);
      localStorage.setItem('free_timer_start_time', newStartTime.toString());
      localStorage.removeItem('free_timer_pause_time');
      setIsRunning(true);
    }
  };

  const handleComplete = () => {
    // Clear localStorage
    localStorage.removeItem('free_timer_start_time');
    localStorage.removeItem('free_timer_is_running');
    localStorage.removeItem('free_timer_pause_time');

    onComplete(timeElapsed);
  };

  const handleCancel = () => {
    // Clear localStorage
    localStorage.removeItem('free_timer_start_time');
    localStorage.removeItem('free_timer_is_running');
    localStorage.removeItem('free_timer_pause_time');

    onCancel();
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
          <p className={styles.freeTimerStatus}>
            {isRunning ? '⏸️ Running' : '▶️ Paused'}
          </p>
        </div>
      </div>

      <div className={styles.controls}>
        <button
          className={buttonStyles.primaryButton}
          onClick={handlePauseResume}
        >
          {isRunning ? 'Pause' : 'Resume'}
        </button>

        <button className={buttonStyles.primaryButton} onClick={handleComplete}>
          Complete
        </button>

        <button className={buttonStyles.secondaryButton} onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
