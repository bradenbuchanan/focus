// src/utils/dataConversion.ts

// Define our session types
export interface SupabaseSession {
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
  
  export interface LocalStorageSession {
    id: string;
    date: string;
    localDate?: string;
    duration: number;
    type: 'focus' | 'break';
    completed: boolean;
    activity?: string;
  }
  
  // Use a type union
  export type Session = SupabaseSession | LocalStorageSession;
  
  // Type guard functions
  export const isSupabaseSession = (session: Session): session is SupabaseSession => {
    return 'user_id' in session && 'category' in session;
  };
  
  export const isLocalStorageSession = (session: Session): session is LocalStorageSession => {
    return 'type' in session && 'date' in session;
  };
  
  // Helper function to get a consistent date string from a session
  export const getSessionDateString = (session: Session): string => {
    if (isLocalStorageSession(session) && session.localDate) {
      return session.localDate;
    } else if (isLocalStorageSession(session)) {
      return session.date.split('T')[0];
    } else if (isSupabaseSession(session)) {
      return session.start_time.split('T')[0];
    }
    return '';
  };
  
  // Helper to calculate minutes from a session
  export const getSessionMinutes = (session: Session): number => {
    if (isLocalStorageSession(session)) {
      return Math.round(session.duration / 60);
    } else {
      return Math.round((session.duration || 0) / 60);
    }
  };
  
  // Helper to get session date object
  export const getSessionDate = (session: Session): Date => {
    if (isLocalStorageSession(session)) {
      return session.localDate 
        ? new Date(session.localDate) 
        : new Date(session.date);
    } else {
      return new Date(session.start_time);
    }
  };
  
  // Filter function for focus sessions
  export const isFocusSession = (session: Session): boolean => {
    if (isLocalStorageSession(session)) {
      return session.type === 'focus';
    } else if (isSupabaseSession(session)) {
      return session.category === 'focus';
    }
    return false;
  };