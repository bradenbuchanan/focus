// src/app/components/timer/AccomplishmentRecorder.tsx
'use client';

import { useState } from 'react';
import styles from './timer.module.css';

// Common accomplishment types that users can quickly select
const quickOptions = [
  'Completed task',
  'Read content',
  'Wrote content',
  'Solved problem',
  'Planning/organizing',
  'Learning',
];

interface AccomplishmentRecorderProps {
  activity: string;
  onSave: (accomplishment: string) => void;
  onSkip: () => void;
}

export default function AccomplishmentRecorder({
  activity,
  onSave,
  onSkip,
}: AccomplishmentRecorderProps) {
  const [accomplishment, setAccomplishment] = useState('');

  const handleQuickOption = (option: string) => {
    setAccomplishment((prev) =>
      prev ? `${prev}, ${option.toLowerCase()}` : option
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accomplishment.trim()) {
      onSave(accomplishment.trim());
    } else {
      onSkip();
    }
  };

  return (
    <div className={styles.accomplishmentRecorder}>
      <h3>What did you accomplish?</h3>
      <p>Record what you achieved during your {activity} session</p>

      <div className={styles.quickOptions}>
        {quickOptions.map((option) => (
          <button
            key={option}
            type="button"
            className={styles.quickOptionButton}
            onClick={() => handleQuickOption(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={accomplishment}
          onChange={(e) => setAccomplishment(e.target.value)}
          placeholder="Describe what you accomplished (optional)"
          className={styles.accomplishmentInput}
        />

        <div className={styles.recorderActions}>
          <button type="submit" className={styles.primaryButton}>
            Save & Continue
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onSkip}
          >
            Skip
          </button>
        </div>
      </form>
    </div>
  );
}
