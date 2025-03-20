// src/hooks/timer/useAccomplishments.ts
import { useState } from 'react';

interface Accomplishment {
  id: string;
  text: string;
  date: string;
  sessionId?: string;
}

export function useAccomplishments() {
    const [showAccomplishmentPrompt, setShowAccomplishmentPrompt] = useState(false);
    
    // Save an accomplishment
    const saveAccomplishment = (text: string) => {
      if (!text.trim()) return;
      
      const accomplishment: Accomplishment = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        text: text.trim(),
        date: new Date().toISOString(),
      };
      
      // Get existing accomplishments from localStorage
      const existingAccomplishments = getAccomplishments();
      
      // Save the updated list
      localStorage.setItem(
        'focusAccomplishments', 
        JSON.stringify([...existingAccomplishments, accomplishment])
      );
      
      // This is critical - make sure it actually sets the state to false
      setShowAccomplishmentPrompt(false);
      
      console.log("Accomplishment saved, prompt hidden");
      return true; // Return success
    };
    
    // Skip recording an accomplishment
    const skipAccomplishment = () => {
      // This is critical - make sure it actually sets the state to false
      setShowAccomplishmentPrompt(false);
      
      console.log("Accomplishment skipped, prompt hidden");
      return true; // Return success
    };
    
    // Show the accomplishment prompt
    const promptForAccomplishment = () => {
      console.log("Showing accomplishment prompt");
      setShowAccomplishmentPrompt(true);
    };
    
    // Get all accomplishments
    const getAccomplishments = (): Accomplishment[] => {
      if (typeof window === 'undefined') return [];
      
      const accomplishmentsData = localStorage.getItem('focusAccomplishments');
      return accomplishmentsData ? JSON.parse(accomplishmentsData) : [];
    };
    
    return {
      showAccomplishmentPrompt,
      saveAccomplishment,
      skipAccomplishment,
      promptForAccomplishment,
      getAccomplishments,
    };
  }