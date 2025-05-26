// src/components/analytics/ActivityHeatmap.tsx
'use client';

import { useState } from 'react';
import {
  useActivityCalendarData,
  getColorSchemeForActivity,
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
    <div className="card chart-container">
      <div className="card__header">
        <h3 className="card__title">
          Activity Calendar
          {selectedActivity !== 'all' && ` - ${selectedActivity}`}
        </h3>
      </div>

      <ActivitySelector
        activities={availableActivities}
        selected={selectedActivity}
        onChange={setSelectedActivity}
      />

      <div className="calendar-description">
        Your focus activity over the past year
      </div>

      <CalendarGrid calendarData={calendarData} colorScheme={colorScheme} />
    </div>
  );
}
