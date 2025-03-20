// src/hooks/timer/useSessionTracking.ts
import { useRef } from 'react';
import { TimerSession, getLocalDateString, saveSession } from '@/lib/timer';
import { getFormattedDateString } from './utils';

export function useSessionTracking() {
  const sessionStartTimeRef = useRef<number | null>(null);

  // Start tracking a new session
  const startSession = () => {
    sessionStartTimeRef.current = Date.now();
  };

  // Record completed session
  const recordSession = (sessionType: 'focus' | 'break', activity: string, completed: boolean = true) => {
    if (!sessionStartTimeRef.current) return;
    
    const sessionDuration = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
    
    const session: TimerSession = {
      date: new Date().toISOString(),
      localDate: getLocalDateString(new Date()),
      duration: sessionDuration,
      type: sessionType,
      completed,
      activity: activity,
    };

    saveSession(session);
    sessionStartTimeRef.current = null;
    
    return sessionDuration;
  };
  
  // Check if a session is currently being tracked
  const isSessionActive = () => {
    return sessionStartTimeRef.current !== null;
  };
  
  // Get the current session start time (if any)
  const getSessionStartTime = () => {
    return sessionStartTimeRef.current;
  };
  
  // Set the session start time manually (useful for restoring from stored state)
  const setSessionStartTime = (startTime: number | null) => {
    sessionStartTimeRef.current = startTime;
  };

  return {
    startSession,
    recordSession,
    isSessionActive,
    getSessionStartTime,
    setSessionStartTime,
  };
}