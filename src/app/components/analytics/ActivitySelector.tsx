// src/components/analytics/ActivitySelector.tsx
import React from 'react';
import styles from './analytics.module.css';

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
    <div className={styles.activitySelector}>
      {activities.map((activity) => (
        <button
          key={activity}
          className={`${styles.activityButton} ${
            selected === activity ? styles.activeActivity : ''
          }`}
          onClick={() => onChange(activity)}
        >
          {activity === 'all' ? 'All Activities' : activity}
        </button>
      ))}
    </div>
  );
}
