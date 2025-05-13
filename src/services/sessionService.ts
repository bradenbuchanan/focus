// src/services/sessionService.ts
import { supabase } from '@/lib/supabase';
import {Database} from "../types/supabase"
import { TimerSession } from '@/lib/timer';
import { emitDataUpdate } from '@/utils/events';

// Remove the unused LocalSession interface and the unused import

type FocusSession = Database['public']['Tables']['focus_sessions']['Row'];

// Main save session function
export async function saveSession(session: {
  startTime: Date;
  endTime?: Date | null;
  duration: number;
  type: 'focus' | 'break';
  completed: boolean;
  activity?: string;
}): Promise<string> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    
    if (!userData?.user?.id) {
      throw new Error('No authenticated user found');
    }
    
    // Insert session with proper field mapping
    const { data, error } = await supabase
      .from('focus_sessions')
      .insert({
        user_id: userData.user.id,
        start_time: session.startTime.toISOString(),
        end_time: session.endTime?.toISOString() || null,
        duration: session.duration,
        category: session.type,  // 'focus' or 'break'
        activity: session.activity || null,
        completed: session.completed,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    
    // Emit update event after successful save
    emitDataUpdate();
    
    return data.id;
  } catch (error) {
    console.error('Error saving session to Supabase:', error);
    
    // Fallback to localStorage with consistent date handling
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

// Get sessions function with proper user filtering
export async function getSessions(limit: number = 100): Promise<FocusSession[]> {
  try {
    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user?.id) {
      // If no authenticated user, return local sessions
      return getLocalSessionsAsFocusSessions();
    }
    
    // Fetch sessions for the current user only
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userData.user.id)  // Filter by user ID
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching sessions from Supabase:', error);
    
    // Fallback to localStorage
    return getLocalSessionsAsFocusSessions();
  }
}

// Get a single session by ID
export async function getSession(sessionId: string): Promise<FocusSession | null> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user?.id) {
      // Try to find in local storage
      const localSessions = getLocalSessions();
      const localSession = localSessions.find(s => s.id === sessionId);
      
      if (localSession) {
        return convertLocalSessionToFocusSession(localSession);
      }
      return null;
    }
    
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userData.user.id)  // Ensure the session belongs to the current user
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching session:', error);
    return null;
  }
}

// Delete a session
export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user?.id) {
      // Delete from local storage
      return deleteLocalSession(sessionId);
    }
    
    const { error } = await supabase
      .from('focus_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userData.user.id);  // Ensure the session belongs to the current user
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
}

// Helper function to get local sessions
function getLocalSessions(): TimerSession[] {
  if (typeof window === 'undefined') return [];
  
  const sessionsData = localStorage.getItem('timerSessions');
  return sessionsData ? JSON.parse(sessionsData) : [];
}

// Helper function to convert local sessions to FocusSession format
function getLocalSessionsAsFocusSessions(): FocusSession[] {
  return getLocalSessions().map(session => convertLocalSessionToFocusSession(session));
}

// Helper function to convert a single local session to FocusSession format
function convertLocalSessionToFocusSession(session: TimerSession): FocusSession {
  const startTime = new Date(session.date);
  const endTime = new Date(startTime.getTime() + (session.duration * 1000));
  
  return {
    id: session.id,
    user_id: '', // Empty for local data
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    duration: session.duration,
    category: session.type,  // 'focus' or 'break'
    activity: session.activity || null,  // Activity name or null
    completed: session.completed,
    created_at: session.date,
    updated_at: session.date,
  };
}

// Helper function to format date to YYYY-MM-DD in local timezone
function formatDateToLocalString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// Helper function to delete from local storage
function deleteLocalSession(sessionId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const sessions = getLocalSessions();
    const filteredSessions = sessions.filter(s => s.id !== sessionId);
    
    localStorage.setItem('timerSessions', JSON.stringify(filteredSessions));
    return true;
  } catch (error) {
    console.error('Error deleting local session:', error);
    return false;
  }
}

// Export additional helper functions if needed
export function isSessionBelongsToUser(session: FocusSession, userId: string): boolean {
  return session.user_id === userId;
}

// Get sessions for a specific date range
export async function getSessionsInDateRange(
  startDate: Date,
  endDate: Date,
  limit: number = 100
): Promise<FocusSession[]> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user?.id) {
      // Filter local sessions by date range
      const localSessions = getLocalSessionsAsFocusSessions();
      return localSessions.filter(session => {
        const sessionDate = new Date(session.start_time);
        return sessionDate >= startDate && sessionDate <= endDate;
      });
    }
    
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userData.user.id)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching sessions in date range:', error);
    
    // Fallback to filtered local sessions
    const localSessions = getLocalSessionsAsFocusSessions();
    return localSessions.filter(session => {
      const sessionDate = new Date(session.start_time);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  }
}

// Get sessions for a specific activity
export async function getSessionsByActivity(
  activity: string,
  limit: number = 100
): Promise<FocusSession[]> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user?.id) {
      // Filter local sessions by activity
      const localSessions = getLocalSessionsAsFocusSessions();
      return localSessions.filter(session => session.activity === activity);
    }
    
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('activity', activity)
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching sessions by activity:', error);
    
    // Fallback to filtered local sessions
    const localSessions = getLocalSessionsAsFocusSessions();
    return localSessions.filter(session => session.activity === activity);
  }
}

// Get session statistics for a user
export async function getSessionStats(userId?: string): Promise<{
  totalSessions: number;
  totalFocusTime: number;
  averageSessionLength: number;
  completionRate: number;
}> {
  try {
    const sessions = userId 
      ? await getSessions() 
      : getLocalSessionsAsFocusSessions();
    
    const focusSessions = sessions.filter(s => s.category === 'focus');
    const completedSessions = focusSessions.filter(s => s.completed);
    
    const totalFocusTime = focusSessions.reduce((total, s) => total + (s.duration || 0), 0);
    const averageSessionLength = focusSessions.length > 0 
      ? totalFocusTime / focusSessions.length 
      : 0;
    const completionRate = focusSessions.length > 0
      ? (completedSessions.length / focusSessions.length) * 100
      : 0;
    
    return {
      totalSessions: focusSessions.length,
      totalFocusTime: Math.round(totalFocusTime / 60), // Convert to minutes
      averageSessionLength: Math.round(averageSessionLength / 60), // Convert to minutes
      completionRate: Math.round(completionRate),
    };
  } catch (error) {
    console.error('Error calculating session stats:', error);
    return {
      totalSessions: 0,
      totalFocusTime: 0,
      averageSessionLength: 0,
      completionRate: 0,
    };
  }
}