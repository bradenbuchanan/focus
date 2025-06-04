// src/types/analytics.ts
import { Database } from './supabase';

export type TimeFrame = 'week' | 'month' | 'custom';

// Define the session type using your Database type
export type AnalyticsSession = Database['public']['Tables']['focus_sessions']['Row'];

export interface WeeklySummary {
  startDate: string;
  endDate: string;
  totalFocusTime: number;
  totalSessions: number;
  mostProductiveDay: { day: string; minutes: number };
  topCategories: Array<{ name: string; minutes: number }>;
  dailySummaries?: Array<{
    date: string;
    totalMinutes: number;
    sessions: number;
    topCategory?: string;
    accomplishments?: Array<{ text: string; category: string | null }>;
  }>;
  allAccomplishments?: Array<{ text: string; category: string | null }>;
}

export interface SummaryGeneratorParams {
  sessions: AnalyticsSession[]; // Changed from any[] to properly typed sessions
  timeframe: TimeFrame;
  dateRange: { start: string; end: string };
  selectedActivities: string[];
}