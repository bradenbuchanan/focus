// src/app/components/goals/GoalEditForm.tsx
'use client';

import { useState } from 'react';
import { Goal, defaultActivityCategories } from '@/lib/timer';
import { useData } from '@/providers/DataProvider';
import styles from './GoalEditForm.module.css';
import formStyles from '@/app/styles/shared/forms.module.css';
import buttonStyles from '@/app/styles/shared/buttons.module.css';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Get deleteGoal and saveGoal from DataProvider (since updateGoal doesn't exist)
  const { deleteGoal, saveGoal } = useData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Since updateGoal doesn't exist in your DataProvider,
      // we'll delete and recreate as a workaround
      await deleteGoal(goal.id);

      const updatedGoal = {
        title,
        description,
        type,
        target,
        period,
        activity: activity || undefined,
        startDate: goal.startDate,
        endDate: goal.endDate,
      };

      await saveGoal(updatedGoal);
      onSave();
    } catch (error) {
      console.error('Error updating goal:', error);
      setError('Failed to update goal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.goalForm}>
      <h2>Edit Goal</h2>

      {error && <div className={formStyles.error}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className={formStyles.formGroup}>
          <label htmlFor="title">Goal Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Read more books"
            required
            disabled={isLoading}
            className={formStyles.input}
          />
        </div>

        <div className={formStyles.formGroup}>
          <label htmlFor="description">Description (Optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional details about your goal"
            disabled={isLoading}
            className={formStyles.textarea}
          />
        </div>

        <div className={formStyles.formRow}>
          <div className={formStyles.formGroup}>
            <label htmlFor="type">Goal Type</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as 'time' | 'sessions')}
              disabled={isLoading}
              className={formStyles.select}
            >
              <option value="time">Focus Time</option>
              <option value="sessions">Number of Sessions</option>
            </select>
          </div>

          <div className={formStyles.formGroup}>
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
              disabled={isLoading}
              className={formStyles.input}
            />
          </div>
        </div>

        <div className={formStyles.formRow}>
          <div className={formStyles.formGroup}>
            <label htmlFor="period">Time Period</label>
            <select
              id="period"
              value={period}
              onChange={(e) =>
                setPeriod(
                  e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly'
                )
              }
              disabled={isLoading}
              className={formStyles.select}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className={formStyles.formGroup}>
            <label htmlFor="activity">Activity (Optional)</label>
            <select
              id="activity"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              disabled={isLoading}
              className={formStyles.select}
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

        <div className={formStyles.formActions}>
          <button
            type="submit"
            className={buttonStyles.primaryButton}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            className={buttonStyles.secondaryButton}
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
