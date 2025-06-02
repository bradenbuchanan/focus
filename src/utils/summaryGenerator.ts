// src/utils/summaryGenerator.ts
import { WeeklySummary, SummaryGeneratorParams, TimeFrame } from '@/types/analytics';
import {
  isFocusSession,
  getSessionDateString,
  getSessionMinutes,
  getSessionActivity,
} from '@/utils/dataConversion';

export async function generateWeeklySummary({
  sessions,
  timeframe,
  dateRange,
  selectedActivities
}: SummaryGeneratorParams): Promise<WeeklySummary | null> {
  // Calculate date range
  const { start, end } = calculateDateRange(timeframe, dateRange);

  // Filter sessions
  let filteredSessions = sessions.filter((session) => {
    if (!isFocusSession(session)) return false;

    const sessionDate = new Date(session.start_time);
    return sessionDate >= start && sessionDate <= end;
  });

  // Apply activity filter
  if (selectedActivities.length > 0) {
    filteredSessions = filteredSessions.filter((session) =>
      selectedActivities.includes(getSessionActivity(session))
    );
  }

  if (filteredSessions.length === 0) {
    return null;
  }

  // Calculate summary statistics
  const totalFocusTime = Math.round(
    filteredSessions.reduce((sum, session) => sum + getSessionMinutes(session), 0)
  );
  const totalSessions = filteredSessions.length;

  // Group by day
  const dayMap = new Map<string, number>();
  filteredSessions.forEach((session) => {
    const dateStr = getSessionDateString(session);
    const minutes = getSessionMinutes(session);
    dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + minutes);
  });

  // Find most productive day
  let mostProductiveDay = { day: '', minutes: 0 };
  dayMap.forEach((minutes, day) => {
    if (minutes > mostProductiveDay.minutes) {
      mostProductiveDay = { day, minutes: Math.round(minutes) };
    }
  });

  // Group by category
  const categoryMap = new Map<string, number>();
  filteredSessions.forEach((session) => {
    const category = getSessionActivity(session);
    const minutes = getSessionMinutes(session);
    categoryMap.set(category, (categoryMap.get(category) || 0) + minutes);
  });

  const topCategories = Array.from(categoryMap.entries())
    .map(([name, minutes]) => ({ name, minutes: Math.round(minutes) }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 3);

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
    totalFocusTime,
    totalSessions,
    mostProductiveDay,
    topCategories,
  };
}

function calculateDateRange(
  timeframe: TimeFrame,
  dateRange: { start: string; end: string }
): { start: Date; end: Date } {
  const today = new Date();
  let start: Date;
  let end: Date;

  switch (timeframe) {
    case 'week':
      start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case 'month':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'custom':
      start = new Date(dateRange.start);
      end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}