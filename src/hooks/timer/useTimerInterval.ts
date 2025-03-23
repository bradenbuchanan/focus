// src/hooks/timer/useTimerInterval.ts
import { useRef, useEffect } from 'react';

export function useTimerInterval(
  isRunning: boolean,
  onTick: () => void,
  onComplete: () => void,
  timeRemaining: number
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start or stop the interval based on timer state
  useEffect(() => {
    // Clear existing interval if any
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only start a new interval if the timer is running
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        onTick();
      }, 1000);
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onTick]);

  // Check for timer completion
  useEffect(() => {
    if (timeRemaining <= 0 && isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      onComplete();
    }
  }, [timeRemaining, isRunning, onComplete]);

  // Start interval manually (useful for when restoring state)
  const startInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      onTick();
    }, 1000);
  };

  // Stop interval manually
  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return {
    startInterval,
    stopInterval,
    isIntervalActive: !!intervalRef.current,
  };
}
