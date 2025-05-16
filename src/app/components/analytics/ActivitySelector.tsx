// src/components/analytics/ActivitySelector.tsx
import React from 'react';
import styles from './analytics.module.css';
import filterStyles from '@/app/styles/shared/filters.module.css';

interface ActivitySelectorProps {
  activities: string[];
  selected: string;
  onChange: (activity: string) => void;
}

export function ActivitySelector({
  activities,
  selected,
  onChange,
}: ActivitySelectorProps) {
  if (!activities.length) {
    return null;
  }

  return (
    <div className={filterStyles.filterContainer}>
      <label className={filterStyles.filterLabel}>Filter by Activity:</label>
      <div className={filterStyles.activityButtons}>
        {activities.map((activity) => (
          <button
            key={activity}
            className={`${filterStyles.activityButton} ${
              selected === activity ? filterStyles.activeButton : ''
            }`}
            onClick={() => onChange(activity)}
          >
            {activity === 'all' ? 'All Activities' : activity}
          </button>
        ))}
      </div>
    </div>
  );
}
