// src/lib/aggregation-service.ts
import { prisma } from './ds';
import { getLocalDateString } from './timer';
import { FocusSession, Prisma } from '@prisma/client';

// Define our own types for accomplishments since Prisma isn't recognizing them
interface AccomplishmentType {
  id: string;
  text: string;
  userId: string;
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
  categories: string | null;
}

interface SessionSummary {
  id: string;
  date: string;
  duration: number;
  category: string | null;
  accomplishment: string | null;
  accomplishmentCategory: string | null;
}

interface DailySummary {
  date: string;
  totalMinutes: number;
  sessions: number;
  topCategory: string;
  accomplishments: {
    text: string;
    category: string | null;
  }[];
}

// Export the interface so it can be imported elsewhere
export interface WeeklySummary {
  startDate: string;
  endDate: string;
  totalFocusTime: number;
  totalSessions: number;
  topCategories: { name: string; minutes: number }[];
  mostProductiveDay: { day: string; minutes: number };
  dailySummaries: DailySummary[];
  allAccomplishments: { text: string; category: string | null }[];
}

// Type for sessions with accomplishments
type FocusSessionWithAccomplishments = FocusSession & {
  accomplishments?: AccomplishmentType[];
};

export async function generateUserWeeklySummary(userId: string): Promise<WeeklySummary | null> {
  try {
    // Get the date for the start of the current week (Sunday)
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get the end of the current week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // First, get the sessions
    const focusSessions = await prisma.focusSession.findMany({
      where: {
        userId,
        startTime: {
          gte: startOfWeek,
          lte: endOfWeek
        },
        completed: true
      },
      orderBy: {
        startTime: 'asc'
      }
    });
    
    if (focusSessions.length === 0) {
      return null;
    }
    
    // Then get accomplishments separately using raw query
    // Using raw query to bypass type issues
    const accomplishments = await prisma.$queryRaw<AccomplishmentType[]>`
      SELECT * FROM "Accomplishment" 
      WHERE "userId" = ${userId} 
      AND "sessionId" IN (${Prisma.join(focusSessions.map(s => s.id))})
    `;
    
    // Group accomplishments by session ID
    const accomplishmentsBySession = accomplishments.reduce<Record<string, AccomplishmentType[]>>((acc, accomplishment) => {
      if (!acc[accomplishment.sessionId]) {
        acc[accomplishment.sessionId] = [];
      }
      acc[accomplishment.sessionId].push(accomplishment);
      return acc;
    }, {});
    
    // Add accomplishments to sessions
    const sessionsWithAccomplishments: FocusSessionWithAccomplishments[] = focusSessions.map(session => ({
      ...session,
      accomplishments: accomplishmentsBySession[session.id] || []
    }));
    
    // Initialize day-by-day data
    const dayMap = new Map<string, DailySummary>();
    const categoryMap = new Map<string, number>();
    const allAccomplishments: { text: string; category: string | null }[] = [];
    
    // Process each session
    sessionsWithAccomplishments.forEach(session => {
      const sessionDate = getLocalDateString(session.startTime);
      const durationMinutes = Math.round((session.duration || 0) / 60);
      
      // Update category totals
      const category = session.category || 'Uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + durationMinutes);
      
      // Get day summary or create new one
      if (!dayMap.has(sessionDate)) {
        dayMap.set(sessionDate, {
          date: sessionDate,
          totalMinutes: 0,
          sessions: 0,
          topCategory: '',
          accomplishments: []
        });
      }
      
      const daySummary = dayMap.get(sessionDate)!;
      daySummary.totalMinutes += durationMinutes;
      daySummary.sessions += 1;
      
      // Add accomplishments if any
      if (session.accomplishments && session.accomplishments.length > 0) {
        session.accomplishments.forEach((acc: AccomplishmentType) => {
          daySummary.accomplishments.push({
            text: acc.text,
            category: acc.categories
          });
          
          allAccomplishments.push({
            text: acc.text,
            category: acc.categories
          });
        });
      }
    });
    
    // Determine top category for each day
    dayMap.forEach(day => {
      // Create a map of categories for this day
      const dayCategoryMap = new Map<string, number>();
      sessionsWithAccomplishments
        .filter(s => getLocalDateString(s.startTime) === day.date)
        .forEach(s => {
          const category = s.category || 'Uncategorized';
          const durationMinutes = Math.round((s.duration || 0) / 60);
          dayCategoryMap.set(category, (dayCategoryMap.get(category) || 0) + durationMinutes);
        });
      
      // Find top category
      let maxMinutes = 0;
      let topCategory = 'Uncategorized';
      
      dayCategoryMap.forEach((minutes, category) => {
        if (minutes > maxMinutes) {
          maxMinutes = minutes;
          topCategory = category;
        }
      });
      
      day.topCategory = topCategory;
    });
    
    // Sort days chronologically
    const dailySummaries = Array.from(dayMap.values()).sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    // Get top 3 categories
    const topCategories = Array.from(categoryMap.entries())
      .map(([name, minutes]) => ({ name, minutes }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 3);
    
    // Find most productive day
    let mostProductiveDay = { day: '', minutes: 0 };
    dailySummaries.forEach(day => {
      if (day.totalMinutes > mostProductiveDay.minutes) {
        mostProductiveDay = { day: day.date, minutes: day.totalMinutes };
      }
    });
    
    // Calculate weekly totals
    const totalFocusTime = dailySummaries.reduce((sum, day) => sum + day.totalMinutes, 0);
    const totalSessions = dailySummaries.reduce((sum, day) => sum + day.sessions, 0);
    
    // Create the weekly summary
    const weeklySummary: WeeklySummary = {
      startDate: getLocalDateString(startOfWeek),
      endDate: getLocalDateString(endOfWeek),
      totalFocusTime,
      totalSessions,
      topCategories,
      mostProductiveDay,
      dailySummaries,
      allAccomplishments
    };
    
    return weeklySummary;
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    return null;
  }
}