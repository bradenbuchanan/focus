// src/app/components/timer/ActivitySelector.tsx
'use client';

import { useState } from 'react';
import { defaultActivityCategories } from '@/lib/timer';

interface ActivitySelectorProps {
  selectedActivity: string;
  onSelectActivity: (activity: string) => void;
}

export default function ActivitySelector({
  selectedActivity,
  onSelectActivity,
}: ActivitySelectorProps) {
  const [customActivity, setCustomActivity] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleActivitySelect = (activity: string) => {
    if (activity === 'Custom') {
      setShowCustomInput(true);
    } else {
      onSelectActivity(activity);
      setShowCustomInput(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customActivity.trim()) {
      onSelectActivity(customActivity.trim());
      setCustomActivity('');
      setShowCustomInput(false);
    }
  };

  return (
    <div
      style={{
        marginBottom: '3rem',
        marginTop: '3rem',
        textAlign: 'center',
      }}
    >
      <h3
        style={{
          marginBottom: '1rem',
          fontSize: '1.3rem',
        }}
      >
        What are you focusing on?
      </h3>

      <div
        className="filter-buttons"
        style={{
          paddingTop: '1rem',
        }}
      >
        {defaultActivityCategories.map((activity) => (
          <button
            key={activity}
            className={`filter-button ${
              activity === selectedActivity ? 'filter-button--active' : ''
            }`}
            onClick={() => handleActivitySelect(activity)}
          >
            {activity}
          </button>
        ))}
        <button
          className="filter-button"
          onClick={() => handleActivitySelect('Custom')}
        >
          Custom
        </button>
      </div>

      {showCustomInput && (
        <form
          onSubmit={handleCustomSubmit}
          style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'center',
            marginTop: '1rem',
          }}
        >
          <input
            type="text"
            value={customActivity}
            onChange={(e) => setCustomActivity(e.target.value)}
            placeholder="Enter custom activity"
            className="form-input"
            style={{
              minWidth: '200px',
            }}
            autoFocus
          />
          <button type="submit" className="btn btn--primary">
            Add
          </button>
        </form>
      )}
    </div>
  );
}
