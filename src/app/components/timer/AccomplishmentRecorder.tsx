// src/app/components/timer/AccomplishmentRecorder.tsx
'use client';

import { useState } from 'react';

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
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
      }}
    >
      <h3
        style={{
          fontSize: '2rem',
          fontWeight: '700',
          marginBottom: '0.75rem',
          textAlign: 'center',
        }}
      >
        What did you accomplish?
      </h3>
      <p
        style={{
          fontSize: '1.1rem',
          opacity: '0.8',
          marginBottom: '2rem',
          textAlign: 'center',
        }}
      >
        Record what you achieved during your {activity} session
      </p>

      <div
        className="filter-buttons"
        style={{ marginBottom: '1.5rem', maxWidth: '600px' }}
      >
        {quickOptions.map((option) => (
          <button
            key={option}
            type="button"
            className="filter-button"
            onClick={() => handleQuickOption(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="card"
        style={{
          width: '100%',
          maxWidth: '600px',
        }}
      >
        <div className="form-group">
          <textarea
            value={accomplishment}
            onChange={(e) => setAccomplishment(e.target.value)}
            placeholder="Describe what you accomplished (optional)"
            className="form-textarea"
            style={{ minHeight: '120px' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category (optional):</label>
          <div className="filter-buttons">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`filter-button ${
                  selectedCategory === category ? 'filter-button--active' : ''
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn--primary">
            Save & Continue
          </button>
          <button type="button" className="btn btn--secondary" onClick={onSkip}>
            Skip
          </button>
        </div>
      </form>
    </div>
  );
}
