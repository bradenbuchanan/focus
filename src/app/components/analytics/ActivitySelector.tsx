// src/components/analytics/ActivitySelector.tsx
import React from 'react';

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
    <div className="filter-container">
      <label className="filter-label">Filter by Activity:</label>
      <div className="filter-buttons">
        {activities.map((activity) => (
          <button
            key={activity}
            className={`filter-button ${
              selected === activity ? 'filter-button--active' : ''
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
