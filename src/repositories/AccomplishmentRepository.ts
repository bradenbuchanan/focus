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

// Define a type for Supabase accomplishments
interface SupabaseAccomplishment {
  id: string;
  user_id: string;
  session_id: string | null;
  text: string;
  categories: string | null;
  created_at: string;
  updated_at: string;
}

export class AccomplishmentRepository {
  async getAccomplishments(): Promise<SupabaseAccomplishment[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        // Convert local accomplishments to the expected format
        return this.getLocalAccomplishments().map(local => ({
          id: local.id,
          user_id: '',  // Empty for local data
          session_id: local.sessionId || null,
          text: local.text,
          categories: local.categories || null,
          created_at: local.date,
          updated_at: local.date
        }));
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
      
      // Convert local accomplishments to the expected format
      return this.getLocalAccomplishments().map(local => ({
        id: local.id,
        user_id: '',  // Empty for local data
        session_id: local.sessionId || null,
        text: local.text,
        categories: local.categories || null,
        created_at: local.date,
        updated_at: local.date
      }));
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
  
  // Define a specific interface for session properties
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
      [key: string]: string | number | boolean | undefined;
    }
    
    const sessions = JSON.parse(sessionsData) as LocalTimerSession[];
    const sessionIndex = sessions.findIndex((s) => s.id === sessionId);
    
    if (sessionIndex !== -1) {
      sessions[sessionIndex].accomplishment = text;
      sessions[sessionIndex].accomplishmentCategory = categories;
      localStorage.setItem('timerSessions', JSON.stringify(sessions));
    }
  }
}