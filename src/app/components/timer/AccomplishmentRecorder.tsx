// src/app/components/timer/AccomplishmentRecorder.tsx
'use client';

import { useState } from 'react';
import styles from './timer.module.css';

// Common accomplishment types and categories
const quickOptions = [
  'Completed task',
  'Read content',
  'Wrote content',
  'Solved problem',
  'Planning/organizing',
  'Learning',
];

const categories = [
  'Productivity',
  'Learning',
  'Creativity',
  'Problem Solving',
  'Communication',
  'Other',
];

interface AccomplishmentRecorderProps {
  activity: string;
  onSave: (accomplishment: string, category?: string) => void;
  onSkip: () => void;
}

export default function AccomplishmentRecorder({
  activity,
  onSave,
  onSkip,
}: AccomplishmentRecorderProps) {
  const [accomplishment, setAccomplishment] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const handleQuickOption = (option: string) => {
    setAccomplishment((prev) =>
      prev ? `${prev}, ${option.toLowerCase()}` : option
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accomplishment.trim()) {
      onSave(accomplishment.trim(), selectedCategory);
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

        <div className={styles.categorySelector}>
          <label>Category (optional):</label>
          <div className={styles.categoryOptions}>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`${styles.categoryButton} ${
                  selectedCategory === category ? styles.selected : ''
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

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
