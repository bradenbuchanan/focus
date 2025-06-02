// src/types/analytics.ts
export type TimeFrame = 'week' | 'month' | 'custom';

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
  sessions: any[]; // Replace with your session type
  timeframe: TimeFrame;
  dateRange: { start: string; end: string };
  selectedActivities: string[];
}