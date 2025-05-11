// src/repositories/AccomplishmentRepository.ts
import { supabase } from '@/lib/supabase';

// Define a simple local type for accomplishments
interface LocalAccomplishment {
  id: string;
  text: string;
  date: string;
  sessionId?: string;
  categories?: string;
}

export class AccomplishmentRepository {
  async getAccomplishments(): Promise<any[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        return this.getLocalAccomplishments();
      }
      
      const { data, error } = await supabase
        .from('accomplishments')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching accomplishments from Supabase:', error);
      return this.getLocalAccomplishments();
    }
  }
  
  async saveAccomplishment(data: {
    sessionId: string;
    text: string;
    categories?: string;
  }): Promise<string> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        return this.saveLocalAccomplishment(data);
      }
      
      // Check if the session exists
      const { data: sessionData, error: sessionError } = await supabase
        .from('focus_sessions')
        .select('id')
        .eq('id', data.sessionId)
        .single();
        
      // If session doesn't exist, create a placeholder session
      let effectiveSessionId = data.sessionId;
      
      if (sessionError || !sessionData) {
        console.log('Session not found, creating placeholder...');
        
        const { data: newSession, error: createError } = await supabase
          .from('focus_sessions')
          .insert({
            user_id: userData.user.id,
            start_time: new Date().toISOString(),
            duration: 0,
            completed: true,
            category: 'Imported',
          })
          .select()
          .single();
          
        if (createError || !newSession) {
          throw new Error('Failed to create placeholder session');
        }
        
        effectiveSessionId = newSession.id;
      }
      
      // Now create the accomplishment
      const { data: accomplishment, error } = await supabase
        .from('accomplishments')
        .insert({
          user_id: userData.user.id,
          session_id: effectiveSessionId,
          text: data.text,
          categories: data.categories || null,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return accomplishment.id;
    } catch (error) {
      console.error('Error saving accomplishment to Supabase:', error);
      return this.saveLocalAccomplishment(data);
    }
  }
  
  // Local storage methods
  private getLocalAccomplishments(): LocalAccomplishment[] {
    if (typeof window === 'undefined') return [];
    
    const accomplishmentsData = localStorage.getItem('focusAccomplishments');
    return accomplishmentsData ? JSON.parse(accomplishmentsData) : [];
  }
  
  private saveLocalAccomplishment(data: {
    sessionId: string;
    text: string;
    categories?: string;
  }): string {
    if (typeof window === 'undefined') return '';
    
    const localAccomplishment: LocalAccomplishment = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      text: data.text,
      date: new Date().toISOString(),
      sessionId: data.sessionId,
      categories: data.categories,
    };
    
    // Save to localStorage
    const accomplishments = this.getLocalAccomplishments();
    accomplishments.push(localAccomplishment);
    localStorage.setItem('focusAccomplishments', JSON.stringify(accomplishments));
    
    // Also update the session in localStorage to include this accomplishment
    this.updateSessionWithAccomplishment(data.sessionId, data.text, data.categories);
    
    return localAccomplishment.id;
  }
  
  private updateSessionWithAccomplishment(
    sessionId: string, 
    text: string, 
    categories?: string
  ): void {
    if (typeof window === 'undefined') return;
    
    const sessionsData = localStorage.getItem('timerSessions');
    if (!sessionsData) return;
    
    // Define a proper type for the session objects
    interface LocalTimerSession {
      id: string;
      accomplishment?: string;
      accomplishmentCategory?: string;
      [key: string]: any; // Allow other properties
    }
    
    const sessions = JSON.parse(sessionsData) as LocalTimerSession[];
    const sessionIndex = sessions.findIndex((s: LocalTimerSession) => s.id === sessionId);
    
    if (sessionIndex !== -1) {
      sessions[sessionIndex].accomplishment = text;
      sessions[sessionIndex].accomplishmentCategory = categories;
      localStorage.setItem('timerSessions', JSON.stringify(sessions));
    }
  }
}