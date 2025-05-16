// src/app/components/goals/GoalForm.tsx
'use client';

import React, { useState } from 'react';
import { defaultActivityCategories } from '@/lib/timer';
import styles from './GoalForm.module.css';
import { useData } from '@/providers/DataProvider';
import buttonStyles from '@/app/styles/shared/buttons.module.css';

interface GoalFormProps {
  onSave: () => void;
  onCancel: () => void;
  activity?: string;
}

export default function GoalForm({
  onSave,
  onCancel,
  activity,
}: GoalFormProps) {
  // State declarations
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'time' | 'sessions'>('time');
  const [target, setTarget] = useState(60);
  const [period, setPeriod] = useState<
    'daily' | 'weekly' | 'monthly' | 'yearly'
  >('weekly');
  const [selectedActivity, setSelectedActivity] = useState<string>(
    activity || ''
  );
  const [error, setError] = useState('');

  const { saveGoal } = useData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Create the goal object
      const goalData = {
        title,
        description: description || undefined,
        type,
        target,
        period,
        activity: selectedActivity || undefined,
        startDate: new Date().toISOString(),
      };

      // Wait for the goal to be saved
      const goalId = await saveGoal(goalData);

      if (!goalId) {
        throw new Error('Failed to create goal');
      }

      onSave(); // Only call onSave if successful
    } catch (error) {
      console.error('Error saving goal:', error);
      setError('Failed to create goal. Please try again.');
    }
  };

  return (
    <div className={styles.goalForm}>
      <h2>Create New Goal</h2>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Goal Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Read more books"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Description (Optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional details about your goal"
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="type">Goal Type</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as 'time' | 'sessions')}
            >
              <option value="time">Focus Time</option>
              <option value="sessions">Number of Sessions</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="target">
              Target {type === 'time' ? 'Minutes' : 'Sessions'}
            </label>
            <input
              type="number"
              id="target"
              value={target}
              onChange={(e) => setTarget(parseInt(e.target.value))}
              min="1"
              required
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="period">Time Period</label>
            <select
              id="period"
              value={period}
              onChange={(e) =>
                setPeriod(
                  e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly'
                )
              }
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="activity">Activity (Optional)</label>
            <select
              id="activity"
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
            >
              <option value="">All Activities</option>
              {defaultActivityCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={buttonStyles.primaryButton}>
            Create Goal
          </button>
          <button
            type="button"
            className={buttonStyles.secondaryButton}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
