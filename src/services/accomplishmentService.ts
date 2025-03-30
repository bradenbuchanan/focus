// src/services/accomplishmentService.ts
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Accomplishment = Database['public']['Tables']['accomplishments']['Row'];

// Create a type for local accomplishment structure
interface LocalAccomplishment {
  id: string;
  text: string;
  date: string;
  sessionId?: string;
  categories?: string;
}

interface LocalSession {
  id: string;
  accomplishment?: string;
  accomplishmentCategory?: string;
  date?: string;
  localDate?: string;
  duration?: number;
  type?: string;
  completed?: boolean;
  activity?: string;
  startTime?: string;
  endTime?: string;
  // Add any other specific properties that might exist in your session objects
}

export async function saveAccomplishment(data: {
  sessionId: string;
  text: string;
  categories?: string;
}): Promise<string> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    
    const { data: accomplishment, error } = await supabase
      .from('accomplishments')
      .insert({
        session_id: data.sessionId,
        text: data.text,
        categories: data.categories,
        user_id: userData.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return accomplishment.id;
  } catch (error) {
    console.error('Error saving accomplishment to Supabase:', error);
    
    // Fallback to localStorage
    const localAccomplishment: LocalAccomplishment = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      text: data.text,
      date: new Date().toISOString(),
      sessionId: data.sessionId,
      categories: data.categories,
    };
    
    // Save to localStorage
    const accomplishments = getLocalAccomplishments();
    accomplishments.push(localAccomplishment);
    localStorage.setItem('focusAccomplishments', JSON.stringify(accomplishments));
    
    // Also update the session in localStorage
    const sessions = JSON.parse(localStorage.getItem('timerSessions') || '[]') as LocalSession[];
    const sessionIndex = sessions.findIndex(s => s.id === data.sessionId);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].accomplishment = data.text;
      sessions[sessionIndex].accomplishmentCategory = data.categories;
      localStorage.setItem('timerSessions', JSON.stringify(sessions));
    }
    
    return localAccomplishment.id;
  }
}

export async function getAccomplishments(): Promise<Accomplishment[]> {
  try {
    const { data, error } = await supabase
      .from('accomplishments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching accomplishments from Supabase:', error);
    
    // Fallback to localStorage
    return getLocalAccomplishments().map(acc => ({
      id: acc.id,
      user_id: '', // This will be empty in fallback mode
      session_id: acc.sessionId || null,
      text: acc.text,
      categories: acc.categories || null,
      created_at: acc.date,
      updated_at: acc.date,
    }));
  }
}

// Helper function to get local accomplishments
function getLocalAccomplishments(): LocalAccomplishment[] {
  if (typeof window === 'undefined') return [];
  
  const accomplishmentsData = localStorage.getItem('focusAccomplishments');
  return accomplishmentsData ? JSON.parse(accomplishmentsData) : [];
}