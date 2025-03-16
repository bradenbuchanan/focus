// src/components/analytics/ActivityHeatmap.tsx
'use client';

import { useState } from 'react';
import styles from './analytics.module.css';
import {
  useActivityCalendarData,
  getColorSchemeForActivity, // Add this import
} from '@/hooks/useActivityCalendarData';
import { ActivitySelector } from './ActivitySelector';
import { CalendarGrid } from './CalendarGrid';

export default function ActivityCalendar() {
  const [selectedActivity, setSelectedActivity] = useState<string>('all');
  const { calendarData, availableActivities } =
    useActivityCalendarData(selectedActivity);

  const colorScheme = getColorSchemeForActivity(
    selectedActivity === 'all' ? 'All Activities' : selectedActivity
  );

  return (
    <div className={styles.calendarContainer}>
      <h3>
        Activity Calendar
        {selectedActivity !== 'all' && ` - ${selectedActivity}`}
      </h3>
      <ActivitySelector
        activities={availableActivities}
        selected={selectedActivity}
        onChange={setSelectedActivity}
      />
      <div className={styles.calendarDescription}>
        Your focus activity over the past year
      </div>
      <CalendarGrid calendarData={calendarData} colorScheme={colorScheme} />
    </div>
  );
}
