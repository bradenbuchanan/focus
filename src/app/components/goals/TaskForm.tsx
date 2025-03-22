// src/app/components/goals/TaskForm.tsx
'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, saveTask, defaultActivityCategories } from '@/lib/timer';
import styles from './TaskForm.module.css';

interface TaskFormProps {
  goalId?: string;
  onAdd: () => void;
  activity?: string;
}

export default function TaskForm({
  goalId,
  onAdd,
  activity: defaultActivity,
}: TaskFormProps) {
  const [text, setText] = useState('');
  const [activity, setActivity] = useState(defaultActivity || '');
  const [showActivitySelector, setShowActivitySelector] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted', { text, activity });

    if (text.trim()) {
      try {
        const newTask: Task = {
          id: uuidv4(),
          goalId,
          text: text.trim(),
          activity: activity || undefined,
          completed: false,
          createdAt: new Date().toISOString(),
        };

        saveTask(newTask);
        setText('');
        setActivity(defaultActivity || '');
        setShowActivitySelector(false);
        onAdd();
      } catch (error) {
        console.error('Error saving task:', error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.taskForm}>
      <div className={styles.taskInputContainer}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a new task..."
          className={styles.taskInput}
        />

        <div className={styles.taskMeta}>
          {activity ? (
            <div
              className={styles.selectedActivity}
              onClick={() => setShowActivitySelector(!showActivitySelector)}
            >
              {activity} <span className={styles.editIcon}>✎</span>
            </div>
          ) : (
            <button
              type="button"
              className={styles.selectActivityButton}
              onClick={() => setShowActivitySelector(!showActivitySelector)}
            >
              Select Activity
            </button>
          )}
        </div>
      </div>

      {showActivitySelector && (
        <div className={styles.activitySelectorDropdown}>
          {defaultActivityCategories.map((activityOption) => (
            <button
              key={activityOption}
              type="button"
              className={`${styles.activityOption} ${
                activity === activityOption ? styles.selected : ''
              }`}
              onClick={() => {
                setActivity(activityOption);
                setShowActivitySelector(false);
              }}
            >
              {activityOption}
            </button>
          ))}
          <button
            type="button"
            className={styles.activityOption}
            onClick={() => {
              setActivity('');
              setShowActivitySelector(false);
            }}
          >
            None
          </button>
        </div>
      )}

      <button type="submit" className={styles.taskAddButton}>
        Add Task
      </button>
    </form>
  );
}
