// src/repositories/SessionRepository.ts
import { supabase } from '@/lib/supabase';
import { TimerSession } from '@/lib/timer';

export class SessionRepository {
  async getSessions(): Promise<any[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        return this.getLocalSessions();
      }
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', userData.user.id);
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching sessions from Supabase:', error);
      return this.getLocalSessions();
    }
  }
  
  async saveSession(session: {
    startTime: Date;
    endTime?: Date;
    duration: number;
    type: 'focus' | 'break';
    completed: boolean;
    activity?: string;
  }): Promise<string> {
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
  
  private saveLocalSession(session: any): string {
    if (typeof window === 'undefined') return '';
    
    const localSession = {
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