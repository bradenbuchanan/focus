// src/hooks/useActivityCalendarData.ts
import { useState, useEffect } from 'react';
import { getLocalDateString } from '@/lib/timer';
import { useData } from '../providers/DataProvider';

export type CalendarDay = {
  date: string;
  count: number;
  intensity: number;
};

export type ActivityData = {
  name: string;
  data: CalendarDay[];
  maxCount: number;
  colorScheme: {
    base: string;
    levels: string[];
  };
};

// Define our session types
interface SupabaseSession {
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

interface LocalStorageSession {
  id: string;
  date: string;
  localDate?: string;
  duration: number;
  type: 'focus' | 'break';
  completed: boolean;
  activity?: string;
}

// Use a type union
type Session = SupabaseSession | LocalStorageSession;

// Type guard functions
const isSupabaseSession = (session: Session): session is SupabaseSession => {
  return 'user_id' in session && 'category' in session;
};

const isLocalStorageSession = (session: Session): session is LocalStorageSession => {
  return 'type' in session && 'date' in session;
};

export function useMultiActivityData() {
  const [activityDataSets, setActivityDataSets] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getSessions } = useData();

  useEffect(() => {
    async function fetchData() {
      try {
        // Get sessions from Supabase
        const sessions = await getSessions();
        
        // Filter for focus sessions (handle both formats)
        const focusSessions = sessions.filter((s: Session) => {
          if (isLocalStorageSession(s)) {
            return s.type === 'focus';
          } else if (isSupabaseSession(s)) {
            return s.category === 'focus';
          }
          return false;
        });

        // Extract unique activities
        const activityMap: Map<string, number[]> = new Map();
        
        // Add "All Activities" as a category
        activityMap.set("All Activities", []);
        
        // Collect activities from both formats
        focusSessions.forEach((session) => {
          const activity = session.activity || 'Other';
          if (!activityMap.has(activity)) {
            activityMap.set(activity, []);
          }
        });

        // Create a date map for the last year (365 days)
        const today = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setDate(today.getDate() - 365);

        // Generate all dates for the past year
        const allDates: string[] = [];
        for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
          allDates.push(getLocalDateString(d));
        }

        // Process each activity
        const activityResults: ActivityData[] = [];

        for (const [activityName] of activityMap) {
          const dateMap = new Map<string, number>();
          
          // Initialize all dates with 0
          allDates.forEach(date => {
            dateMap.set(date, 0);
          });
          
          // Populate with actual data
          const relevantSessions = activityName === "All Activities" 
            ? focusSessions 
            : focusSessions.filter(s => (s.activity || 'Other') === activityName);
          
          relevantSessions.forEach((session) => {
            // Handle both Supabase and localStorage date formats
            let dateStr: string;
            
            if (isLocalStorageSession(session)) {
              dateStr = session.localDate || getLocalDateString(new Date(session.date));
            } else {
              dateStr = getLocalDateString(new Date(session.start_time));
            }
            
            if (dateMap.has(dateStr)) {
              // Convert duration to minutes (handle both formats)
              let minutes: number;
              
              if (isLocalStorageSession(session)) {
                minutes = Math.round(session.duration / 60);
              } else {
                minutes = Math.round((session.duration || 0) / 60);
              }
              
              dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + minutes);
            }
          });

          // Convert to array for rendering
          const dataArray: CalendarDay[] = [];
          let max = 0;

          dateMap.forEach((count, date) => {
            if (count > max) max = count;
            dataArray.push({ date, count, intensity: 0 });
          });

          // Calculate intensity levels
          dataArray.forEach((day) => {
            if (day.count === 0) {
              day.intensity = 0;
            } else if (day.count <= max * 0.25) {
              day.intensity = 1;
            } else if (day.count <= max * 0.5) {
              day.intensity = 2;
            } else if (day.count <= max * 0.75) {
              day.intensity = 3;
            } else {
              day.intensity = 4;
            }
          });

          activityResults.push({
            name: activityName,
            data: dataArray,
            maxCount: max,
            colorScheme: getColorSchemeForActivity(activityName)
          });
        }

        // Sort results - All Activities first, then alphabetically
        activityResults.sort((a, b) => {
          if (a.name === "All Activities") return -1;
          if (b.name === "All Activities") return 1;
          return a.name.localeCompare(b.name);
        });

        setActivityDataSets(activityResults);
      } catch (error) {
        console.error('Error fetching activity data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [getSessions]);

  return { activityDataSets, isLoading };
}

export function getCellColor(intensity: number) {
  switch (intensity) {
    case 0:
      return 'var(--gray-alpha-100)';
    case 1:
      return 'rgba(0, 136, 204, 0.25)';
    case 2:
      return 'rgba(0, 136, 204, 0.5)';
    case 3:
      return 'rgba(0, 136, 204, 0.75)';
    case 4:
      return 'rgba(0, 136, 204, 1)';
    default:
      return 'var(--gray-alpha-100)';
  }
}

export function useActivityCalendarData(selectedActivity: string = 'all') {
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [availableActivities, setAvailableActivities] = useState<string[]>([]);
  const { activityDataSets, isLoading } = useMultiActivityData();
  
  useEffect(() => {
    if (!isLoading && activityDataSets.length > 0) {
      // Find the selected activity dataset
      const dataset = activityDataSets.find(d => 
        d.name === (selectedActivity === 'all' ? 'All Activities' : selectedActivity)
      ) || activityDataSets[0];
      
      // Extract activities for the selector
      const activities = activityDataSets.map(d => 
        d.name === 'All Activities' ? 'all' : d.name
      );
      
      setCalendarData(dataset.data);
      setAvailableActivities(activities);
    }
  }, [selectedActivity, activityDataSets, isLoading]);
  
  return { 
    calendarData, 
    availableActivities,
    isLoading 
  };
}

// Define the color scheme type
type ColorScheme = {
  base: string;
  levels: string[];
};

// Define a fixed set of activities as a union type
type KnownActivity = 
  | "All Activities" 
  | "Programming" 
  | "Reading" 
  | "Writing" 
  | "Studying" 
  | "Working" 
  | "Meditating" 
  | "Other";

// Define the color schemes with explicit keys
const knownActivityColors: Record<KnownActivity, ColorScheme> = {
  "All Activities": {
    base: "rgb(54, 162, 235)", // Blue
    levels: [
      'rgba(54, 162, 235, 0.05)', // Change this from var(--gray-alpha-100)
      'rgba(54, 162, 235, 0.25)',
      'rgba(54, 162, 235, 0.5)',
      'rgba(54, 162, 235, 0.75)',
      'rgba(54, 162, 235, 1)',
    ]
  },
  "Programming": {
    base: "rgb(75, 192, 192)", // Teal
    levels: [
      'rgba(75, 192, 192, 0.05)',
      'rgba(75, 192, 192, 0.25)',
      'rgba(75, 192, 192, 0.5)',
      'rgba(75, 192, 192, 0.75)',
      'rgba(75, 192, 192, 1)',
    ]
  },
  "Reading": {
    base: "rgb(255, 159, 64)", // Orange
    levels: [
      'rgba(255, 159, 64, 0.05)',
      'rgba(255, 159, 64, 0.25)',
      'rgba(255, 159, 64, 0.5)',
      'rgba(255, 159, 64, 0.75)',
      'rgba(255, 159, 64, 1)',
    ]
  },
  "Writing": {
    base: "rgb(153, 102, 255)", // Purple
    levels: [
      'rgba(153, 102, 255, 0.05)',
      'rgba(153, 102, 255, 0.25)',
      'rgba(153, 102, 255, 0.5)',
      'rgba(153, 102, 255, 0.75)',
      'rgba(153, 102, 255, 1)',
    ]
  },
  "Studying": {
    base: "rgb(255, 99, 132)", // Pink/Red
    levels: [
      'rgba(255, 99, 132, 0.05)',
      'rgba(255, 99, 132, 0.25)',
      'rgba(255, 99, 132, 0.5)',
      'rgba(255, 99, 132, 0.75)',
      'rgba(255, 99, 132, 1)',
    ]
  },
  "Working": {
    base: "rgb(255, 205, 86)", // Yellow
    levels: [
      'rgba(255, 205, 86, 0.05)',
      'rgba(255, 205, 86, 0.25)',
      'rgba(255, 205, 86, 0.5)',
      'rgba(255, 205, 86, 0.75)',
      'rgba(255, 205, 86, 1)',
    ]
  },
  "Meditating": {
    base: "rgb(143, 206, 125)", // Green
    levels: [
      'rgba(143, 206, 125, 0.05)',
      'rgba(143, 206, 125, 0.25)',
      'rgba(143, 206, 125, 0.5)',
      'rgba(143, 206, 125, 0.75)',
      'rgba(143, 206, 125, 1)',
    ]
  },
  "Other": {
    base: "rgb(201, 203, 207)", // Gray
    levels: [
      'rgba(201, 203, 207, 0.05)',
      'rgba(201, 203, 207, 0.25)',
      'rgba(201, 203, 207, 0.5)',
      'rgba(201, 203, 207, 0.75)',
      'rgba(201, 203, 207, 1)',
    ]
  }
};

// Create a function that doesn't rely on direct indexing
export function getColorSchemeForActivity(activity: string): ColorScheme {
  // Type guard for known activities
  const isKnownActivity = (act: string): act is KnownActivity => {
    return act in knownActivityColors;
  };
  
  // Check if it's a known activity and return the color scheme
  if (isKnownActivity(activity)) {
    return knownActivityColors[activity];
  }
  
  // For custom activities, generate a color based on the string
  const hash = Array.from(activity).reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const h = Math.abs(hash) % 360;
  const s = 70; // Saturation
  const l = 50; // Lightness
  
  const baseColor = `hsl(${h}, ${s}%, ${l}%)`;
  return {
    base: baseColor,
    levels: [
      `hsla(${h}, ${s}%, ${l}%, 0.05)`, // Change this from var(--gray-alpha-100)
      `hsla(${h}, ${s}%, ${l}%, 0.25)`,
      `hsla(${h}, ${s}%, ${l}%, 0.5)`,
      `hsla(${h}, ${s}%, ${l}%, 0.75)`,
      `hsla(${h}, ${s}%, ${l}%, 1)`,
    ]
  };
}