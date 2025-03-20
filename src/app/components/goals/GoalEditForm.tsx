// src/app/components/goals/GoalEditForm.tsx
'use client';

import { useState } from 'react';
import { Goal, updateGoal, defaultActivityCategories } from '@/lib/timer';
import styles from '../../../app/goals/goals.module.css';

interface GoalEditFormProps {
  goal: Goal;
  onSave: () => void;
  onCancel: () => void;
}

export default function GoalEditForm({
  goal,
  onSave,
  onCancel,
}: GoalEditFormProps) {
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description || '');
  const [type, setType] = useState<'time' | 'sessions'>(goal.type);
  const [target, setTarget] = useState(goal.target);
  const [period, setPeriod] = useState<
    'daily' | 'weekly' | 'monthly' | 'yearly'
  >(goal.period);
  const [activity, setActivity] = useState<string>(goal.activity || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedGoal: Goal = {
      ...goal,
      title,
      description,
      type,
      target,
      period,
      activity: activity || undefined, // Only include if an activity is selected
    };

    updateGoal(updatedGoal);
    onSave();
  };

  return (
    <div className={styles.goalForm}>
      <h2>Edit Goal</h2>
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
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
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
          <button type="submit" className={styles.primaryButton}>
            Save Changes
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
