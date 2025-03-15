// src/app/components/timer/ActivitySelector.tsx
'use client';

import { useState } from 'react';
import styles from './timer.module.css';
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
    <div className={styles.activitySelector}>
      <h3>What are you focusing on?</h3>

      <div className={styles.activityOptions}>
        {defaultActivityCategories.map((activity) => (
          <button
            key={activity}
            className={`${styles.activityButton} ${
              activity === selectedActivity ? styles.activityButtonSelected : ''
            }`}
            onClick={() => handleActivitySelect(activity)}
          >
            {activity}
          </button>
        ))}
        <button
          className={`${styles.activityButton}`}
          onClick={() => handleActivitySelect('Custom')}
        >
          Custom
        </button>
      </div>

      {showCustomInput && (
        <form
          onSubmit={handleCustomSubmit}
          className={styles.customActivityForm}
        >
          <input
            type="text"
            value={customActivity}
            onChange={(e) => setCustomActivity(e.target.value)}
            placeholder="Enter custom activity"
            className={styles.customActivityInput}
            autoFocus
          />
          <button type="submit" className={styles.primaryButton}>
            Add
          </button>
        </form>
      )}
    </div>
  );
}
