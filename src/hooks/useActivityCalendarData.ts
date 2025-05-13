// src/hooks/useActivityCalendarData.ts
import { useState, useEffect, useCallback } from 'react';
import { getLocalDateString } from '@/lib/timer';
import { useData } from '../providers/DataProvider';
import { 
  getSessionDateString, 
  getSessionMinutes, 
  isFocusSession,
  getSessionActivity
} from '@/utils/dataConversion';
import { listenForDataUpdates, listenForSessionCompleted } from '@/utils/events';

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

export function useMultiActivityData(refreshKey?: number) {
  const [activityDataSets, setActivityDataSets] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getSessions } = useData();
  // Remove the unused lastUpdate state if it's not being used elsewhere

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Fetching activity data...');
      const sessions = await getSessions();
      
      // Filter for focus sessions using the shared utility
      const focusSessions = sessions.filter(isFocusSession);
      console.log(`Found ${focusSessions.length} focus sessions`);

      // Create a map to store activity data
      const activityMap: Map<string, Map<string, number>> = new Map();
      
      // Initialize with "All Activities"
      activityMap.set("All Activities", new Map());
      
      // Process sessions
      focusSessions.forEach((session) => {
        const activity = getSessionActivity(session);
        
        if (!activityMap.has(activity)) {
          activityMap.set(activity, new Map());
        }
        
        // Get the date in local timezone - fix the date extraction
        let dateStr: string;
        
        // Check if it's a Supabase session
        if ('start_time' in session) {
          // Convert UTC to local date string
          const date = new Date(session.start_time);
          dateStr = getLocalDateString(date);
        } else {
          // It's a local session
          dateStr = getSessionDateString(session);
        }
        
        const minutes = getSessionMinutes(session);
        
        // Update "All Activities"
        const allActivitiesMap = activityMap.get("All Activities")!;
        allActivitiesMap.set(dateStr, (allActivitiesMap.get(dateStr) || 0) + minutes);
        
        // Update specific activity
        const specificActivityMap = activityMap.get(activity)!;
        specificActivityMap.set(dateStr, (specificActivityMap.get(dateStr) || 0) + minutes);
      });

      // Generate date range for the last year
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setDate(today.getDate() - 365);

      const allDates: string[] = [];
      for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
        allDates.push(getLocalDateString(d));
      }

      // Convert maps to activity data
      const activityResults: ActivityData[] = [];
      
      activityMap.forEach((dateMap, activityName) => {
        const dataArray: CalendarDay[] = [];
        let max = 0;

        allDates.forEach(date => {
          const count = dateMap.get(date) || 0;
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
      });

      // Sort results
      activityResults.sort((a, b) => {
        if (a.name === "All Activities") return -1;
        if (b.name === "All Activities") return 1;
        return a.name.localeCompare(b.name);
      });

      console.log(`Generated ${activityResults.length} activity datasets`);
      setActivityDataSets(activityResults);
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getSessions]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for data updates
  useEffect(() => {
    const unsubscribeData = listenForDataUpdates(() => {
      console.log('Data update event received, refreshing activity data...');
      fetchData();
    });
    
    const unsubscribeSession = listenForSessionCompleted(() => {
      console.log('Session completed event received, refreshing activity data...');
      fetchData();
    });
    
    // Also listen for visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      unsubscribeData();
      unsubscribeSession();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData]);

  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { activityDataSets, isLoading, refreshData };
}

// Update the signature of useActivityCalendarData to remove unused refreshKey parameter
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

// Rest of your code remains the same...

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
      'rgba(54, 162, 235, 0.05)',
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
      `hsla(${h}, ${s}%, ${l}%, 0.05)`,
      `hsla(${h}, ${s}%, ${l}%, 0.25)`,
      `hsla(${h}, ${s}%, ${l}%, 0.5)`,
      `hsla(${h}, ${s}%, ${l}%, 0.75)`,
      `hsla(${h}, ${s}%, ${l}%, 1)`,
    ]
  };
}

// Listen for data update events

export function useActivityDataWithEventListeners(selectedActivity: string = 'all') {
  const [refreshKey, setRefreshKey] = useState(0);
  const data = useActivityCalendarData(selectedActivity); // Remove refreshKey parameter
  
  useEffect(() => {
    const handleDataUpdate = () => {
      console.log('Data update event received, refreshing activity data...');
      setRefreshKey(prev => prev + 1);
    };

    // Import the event listener from utils
    const unsubscribe = listenForDataUpdates(handleDataUpdate);
    
    // Also listen for visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleDataUpdate();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return data;
}