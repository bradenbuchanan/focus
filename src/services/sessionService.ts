// src/services/sessionService.ts
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { TimerSession } from '@/lib/timer';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface LocalSession {
  id: string;
  date: string;  // ISO string format
  localDate?: string; // Local YYYY-MM-DD format
  duration: number;  // in seconds
  type: 'focus' | 'break';
  completed: boolean;
  activity?: string; // Activity category
}

type FocusSession = Database['public']['Tables']['focus_sessions']['Row'];

export async function saveSession(session: {
  startTime: Date;
  endTime?: Date | null;
  duration: number;
  type: 'focus' | 'break';
  completed: boolean;
  activity?: string;
}): Promise<string> {
  try {
    // Get the current user first - ADD THIS
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    
    // Now insert with the user_id explicitly set
    const { data, error } = await supabase
      .from('focus_sessions')
      .insert({
        user_id: userData.user.id, // ADD THIS LINE - extremely important!
        start_time: session.startTime.toISOString(),
        end_time: session.endTime?.toISOString() || null,
        duration: session.duration,
        category: session.type,
        activity: session.activity,
        completed: session.completed,
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error saving session to Supabase:', error);
    
    // Fallback to localStorage
    const localSession: TimerSession = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      date: session.startTime.toISOString(),
      localDate: formatDateToLocalString(session.startTime),
      duration: session.duration,
      type: session.type,
      completed: session.completed,
      activity: session.activity,
    };
    
    // Save to localStorage
    const sessions = getLocalSessions();
    sessions.push(localSession);
    localStorage.setItem('timerSessions', JSON.stringify(sessions));
    
    return localSession.id;
  }
}

export async function getSessions(limit: number = 100): Promise<FocusSession[]> {
  try {
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching sessions from Supabase:', error);
    
    // Fallback to localStorage
    return getLocalSessions().map(session => ({
        id: session.id,
        user_id: '', // This will be empty in fallback mode
        start_time: session.date,
        end_time: new Date(new Date(session.date).getTime() + (session.duration * 1000)).toISOString(),
        duration: session.duration,
        category: session.type,
        activity: session.activity || null, // Convert undefined to null
        completed: session.completed,
        created_at: session.date,
        updated_at: session.date,
      }));
  }
}

// Helper function to get local sessions
function getLocalSessions(): TimerSession[] {
  if (typeof window === 'undefined') return [];
  
  const sessionsData = localStorage.getItem('timerSessions');
  return sessionsData ? JSON.parse(sessionsData) : [];
}

// Helper function to format date to YYYY-MM-DD
function formatDateToLocalString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}