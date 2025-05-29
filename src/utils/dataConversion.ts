// Simplified data conversion utilities
import { Database } from '@/types/supabase';

// Use Supabase types directly
export type Session = Database['public']['Tables']['focus_sessions']['Row'];

// Simple helper functions
export const getSessionDateString = (session: Session): string => {
  return session.start_time.split('T')[0];
};

export const getSessionMinutes = (session: Session): number => {
  return Math.round((session.duration || 0) / 60);
};

export const isFocusSession = (session: Session): boolean => {
  return session.category === 'focus' || session.category === null;
};

export const getSessionActivity = (session: Session): string => {
  return session.activity || 'Other';
};