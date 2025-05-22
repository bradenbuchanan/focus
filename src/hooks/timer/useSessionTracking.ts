// src/hooks/timer/useSessionTracking.ts
import { useRef } from 'react';
import { TimerSession, getLocalDateString } from '@/lib/timer';

export function useSessionTracking() {
  const sessionStartTimeRef = useRef<number | null>(null);

  // Start tracking a new session
  const startSession = () => {
    sessionStartTimeRef.current = Date.now();
  };

  // Record completed session
  const recordSession = (
    sessionType: 'focus' | 'break', 
    activity: string, 
    completed: boolean = true,
    customDuration?: number
  ) => {
    if (!sessionStartTimeRef.current && customDuration === undefined) return '';
    
    // Use custom duration if provided, otherwise calculate from start time
    const sessionDuration = customDuration !== undefined 
      ? customDuration 
      : Math.floor((Date.now() - (sessionStartTimeRef.current || Date.now())) / 1000);
    
    const session: TimerSession = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(), // Generate ID here
      date: new Date().toISOString(),
      localDate: getLocalDateString(new Date()),
      duration: sessionDuration,
      type: sessionType,
      completed,
      activity: activity,
    };

    // Save session to localStorage and get the session ID
    const sessionId = saveSessionToLocalStorage(session);
    
    if (customDuration === undefined) {
      sessionStartTimeRef.current = null;
    }
    
    return sessionId; // Return the session ID
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

  // Helper function to save session to localStorage
  const saveSessionToLocalStorage = (session: TimerSession): string => {
    if (typeof window === 'undefined') return '';
    
    try {
      const existingSessions = localStorage.getItem('timerSessions');
      const sessions: TimerSession[] = existingSessions ? JSON.parse(existingSessions) : [];
      
      sessions.push(session);
      localStorage.setItem('timerSessions', JSON.stringify(sessions));
      
      return session.id;
    } catch (error) {
      console.error('Error saving session to localStorage:', error);
      return '';
    }
  };

  return {
    startSession,
    recordSession,
    isSessionActive,
    getSessionStartTime,
    setSessionStartTime,
  };
}