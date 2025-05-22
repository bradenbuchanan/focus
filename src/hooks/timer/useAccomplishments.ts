// src/hooks/timer/useAccomplishments.ts
import { useState } from 'react';

interface Accomplishment {
  id: string;
  text: string;
  date: string;
  sessionId?: string;
  category?: string;
}

// Define a more specific interface for the session type
interface LocalSession {
  id: string;
  date?: string;
  localDate?: string;
  duration?: number;
  type?: string;
  completed?: boolean;
  activity?: string;
  accomplishment?: string;
  accomplishmentCategory?: string;
  startTime?: string;
  endTime?: string;
}

export function useAccomplishments() {
  const [showAccomplishmentPrompt, setShowAccomplishmentPrompt] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  
  // Save an accomplishment
  const saveAccomplishment = (text: string, sessionId?: string, category?: string) => {
    if (!text.trim()) return false;
    
    // Use the provided sessionId or fall back to currentSessionId
    const effectiveSessionId = sessionId || currentSessionId;
    
    const accomplishment: Accomplishment = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      text: text.trim(),
      date: new Date().toISOString(),
      sessionId: effectiveSessionId,
      category: category
    };
    
    // Get existing accomplishments from localStorage
    const existingAccomplishments = getAccomplishments();
    
    // Save the updated list
    localStorage.setItem(
      'focusAccomplishments', 
      JSON.stringify([...existingAccomplishments, accomplishment])
    );
    
    // Also update the session to include the accomplishment text
    if (effectiveSessionId) {
      const sessions = getLocalSessions();
      const sessionIndex = sessions.findIndex((s: LocalSession) => s.id === effectiveSessionId);
      if (sessionIndex !== -1) {
        sessions[sessionIndex].accomplishment = text.trim();
        sessions[sessionIndex].accomplishmentCategory = category;
        localStorage.setItem('timerSessions', JSON.stringify(sessions));
      }
    }
    
    // Reset state
    setShowAccomplishmentPrompt(false);
    setCurrentSessionId('');
    
    console.log("Accomplishment saved, prompt hidden");
    return true;
  };
  
  // Skip recording an accomplishment
  const skipAccomplishment = () => {
    // Reset state
    setShowAccomplishmentPrompt(false);
    setCurrentSessionId('');
    
    console.log("Accomplishment skipped, prompt hidden");
    return true;
  };
  
  // Show the accomplishment prompt
  const promptForAccomplishment = () => {
    console.log("Showing accomplishment prompt");
    setShowAccomplishmentPrompt(true);
  };
  
  // Set the current session ID for the next accomplishment
  const setSessionForAccomplishment = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    console.log("Set session ID for accomplishment:", sessionId);
  };
  
  // Get all accomplishments
  const getAccomplishments = (): Accomplishment[] => {
    if (typeof window === 'undefined') return [];
    
    const accomplishmentsData = localStorage.getItem('focusAccomplishments');
    return accomplishmentsData ? JSON.parse(accomplishmentsData) : [];
  };
  
  // Get accomplishments for a specific session
  const getSessionAccomplishment = (sessionId: string): string | null => {
    if (typeof window === 'undefined') return null;
    
    const accomplishments = getAccomplishments();
    const sessionAccomplishment = accomplishments.find(a => a.sessionId === sessionId);
    return sessionAccomplishment ? sessionAccomplishment.text : null;
  };

  // Helper function to get local sessions with proper typing
  const getLocalSessions = (): LocalSession[] => {
    if (typeof window === 'undefined') return [];
    const sessionsData = localStorage.getItem('timerSessions');
    return sessionsData ? JSON.parse(sessionsData) : [];
  };
  
  return {
    showAccomplishmentPrompt,
    saveAccomplishment,
    skipAccomplishment,
    promptForAccomplishment,
    getAccomplishments,
    setSessionForAccomplishment,
    getSessionAccomplishment,
  };
}