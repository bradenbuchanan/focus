'use client';

import { useCallback } from 'react';
import { recordSession, addAccomplishment } from '@/server/actions/session-actions';

interface SessionData {
  startTime: Date;
  endTime?: Date;
  duration: number;
  activity?: string;
  completed: boolean;
}

interface LocalSession {
  id: string;
  date: string;
  localDate: string;
  duration: number;
  type: string;
  completed: boolean;
  activity?: string;
}

export function useSessionDB() {
  // Helper functions for localStorage
  const getLocalSessions = useCallback(() => {
    const sessionsData = localStorage.getItem('timerSessions');
    return sessionsData ? JSON.parse(sessionsData) : [];
  }, []);

  const getLocalAccomplishments = useCallback(() => {
    const accomplishmentsData = localStorage.getItem('focusAccomplishments');
    return accomplishmentsData ? JSON.parse(accomplishmentsData) : [];
  }, []);

  const formatDateString = useCallback((date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }, []);

  // Fallback functions to maintain localStorage support during transition
  const fallbackToLocalStorage = useCallback((sessionData: SessionData): string => {
    if (typeof window === 'undefined') return '';
    
    const session: LocalSession = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      date: sessionData.startTime.toISOString(),
      localDate: formatDateString(sessionData.startTime),
      duration: sessionData.duration,
      type: 'focus',
      completed: sessionData.completed,
      activity: sessionData.activity,
    };
    
    const sessions = getLocalSessions();
    sessions.push(session);
    localStorage.setItem('timerSessions', JSON.stringify(sessions));
    
    return session.id;
  }, [formatDateString, getLocalSessions]);

  const fallbackAccomplishmentToLocalStorage = useCallback((text: string, sessionId: string, categories?: string): boolean => {
    if (typeof window === 'undefined') return false;
    
    const accomplishment = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      text,
      date: new Date().toISOString(),
      sessionId,
      categories,
    };
    
    const accomplishments = getLocalAccomplishments();
    accomplishments.push(accomplishment);
    localStorage.setItem('focusAccomplishments', JSON.stringify(accomplishments));
    
    // Also update the session
    const sessions = getLocalSessions();
    const sessionIndex = sessions.findIndex((s: LocalSession) => s.id === sessionId);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].accomplishment = text;
      localStorage.setItem('timerSessions', JSON.stringify(sessions));
    }
    
    return true;
  }, [getLocalAccomplishments, getLocalSessions]);

  const saveSession = useCallback(async (sessionData: SessionData) => {
    try {
      // Format the data for the server action
      const data = {
        startTime: sessionData.startTime.toISOString(),
        endTime: sessionData.endTime?.toISOString(),
        duration: sessionData.duration,
        activity: sessionData.activity,
        completed: sessionData.completed,
      };

      const result = await recordSession(null, data);
      return result.id;
    } catch (error) {
      console.error('Error saving session:', error);
      // Fallback to localStorage if server action fails
      return fallbackToLocalStorage(sessionData);
    }
  }, [fallbackToLocalStorage]);

  const saveAccomplishment = useCallback(async (text: string, sessionId: string, categories?: string) => {
    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('sessionId', sessionId);
      if (categories) {
        formData.append('categories', categories);
      }

      const result = await addAccomplishment(formData);
      return result.success;
    } catch (error) {
      console.error('Error saving accomplishment:', error);
      // Fallback to localStorage if server action fails
      return fallbackAccomplishmentToLocalStorage(text, sessionId, categories);
    }
  }, [fallbackAccomplishmentToLocalStorage]);

  return {
    saveSession,
    saveAccomplishment,
  };
}