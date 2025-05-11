// src/repositories/SessionRepository.ts
import { supabase } from '@/lib/supabase';
import { TimerSession } from '@/lib/timer';

// Define a type for Supabase sessions
interface SupabaseSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration: number | null;
  category: string | null;
  activity: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

// Define an interface for session input
interface SessionInput {
  startTime: Date;
  endTime?: Date;
  duration: number;
  type: 'focus' | 'break';
  completed: boolean;
  activity?: string;
}

export class SessionRepository {
  async getSessions(): Promise<SupabaseSession[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        return this.getLocalSessions().map(session => ({
          id: session.id,
          user_id: '',  // Empty for local data
          start_time: session.date,
          end_time: new Date(new Date(session.date).getTime() + session.duration * 1000).toISOString(),
          duration: session.duration,
          category: session.type,
          activity: session.activity || null,
          completed: session.completed,
          created_at: session.date,
          updated_at: session.date
        }));
      }
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', userData.user.id);
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching sessions from Supabase:', error);
      
      return this.getLocalSessions().map(session => ({
        id: session.id,
        user_id: '',  // Empty for local data
        start_time: session.date,
        end_time: new Date(new Date(session.date).getTime() + session.duration * 1000).toISOString(),
        duration: session.duration,
        category: session.type,
        activity: session.activity || null,
        completed: session.completed,
        created_at: session.date,
        updated_at: session.date
      }));
    }
  }
  
  async saveSession(session: SessionInput): Promise<string> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        return this.saveLocalSession(session);
      }
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: userData.user.id,
          start_time: session.startTime.toISOString(),
          end_time: session.endTime?.toISOString() || null,
          duration: session.duration,
          category: session.type,
          activity: session.activity || null,
          completed: session.completed
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return data.id;
    } catch (error) {
      console.error('Error saving session to Supabase:', error);
      return this.saveLocalSession(session);
    }
  }
  
  // Local storage fallbacks
  private getLocalSessions(): TimerSession[] {
    if (typeof window === 'undefined') return [];
    
    const sessionsData = localStorage.getItem('timerSessions');
    return sessionsData ? JSON.parse(sessionsData) : [];
  }
  
  private saveLocalSession(session: SessionInput): string {
    if (typeof window === 'undefined') return '';
    
    const localSession: TimerSession = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      date: session.startTime.toISOString(),
      localDate: this.formatDateToLocalString(session.startTime),
      duration: session.duration,
      type: session.type,
      completed: session.completed,
      activity: session.activity,
    };
    
    const sessions = this.getLocalSessions();
    sessions.push(localSession);
    localStorage.setItem('timerSessions', JSON.stringify(sessions));
    
    return localSession.id;
  }
  
  private formatDateToLocalString(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}