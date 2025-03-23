// src/app/components/goals/TaskForm.tsx
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
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState<string>(''); // Add due date state
  const [showActivitySelector, setShowActivitySelector] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (text.trim()) {
      try {
        const newTask: Task = {
          id: uuidv4(),
          goalId,
          text: text.trim(),
          activity: activity || undefined,
          completed: false,
          createdAt: new Date().toISOString(),
          priority: priority,
          dueDate: dueDate || undefined, // Add due date to task
        };

        saveTask(newTask);
        setText('');
        setActivity(defaultActivity || '');
        setPriority('medium');
        setDueDate(''); // Reset due date
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
          {/* Activity selector (existing code) */}
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

          {/* Due date selector */}
          <div className={styles.dueDateSelector}>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={styles.dueDateInput}
              min={new Date().toISOString().split('T')[0]} // Set min to today
              title="Due date (optional)"
            />
          </div>

          {/* Priority selector */}
          <div className={styles.prioritySelector}>
            <button
              type="button"
              className={`${styles.priorityButton} ${styles.highPriority} ${
                priority === 'high' ? styles.selected : ''
              }`}
              onClick={() => setPriority('high')}
              title="High Priority"
            >
              High
            </button>
            <button
              type="button"
              className={`${styles.priorityButton} ${styles.mediumPriority} ${
                priority === 'medium' ? styles.selected : ''
              }`}
              onClick={() => setPriority('medium')}
              title="Medium Priority"
            >
              Medium
            </button>
            <button
              type="button"
              className={`${styles.priorityButton} ${styles.lowPriority} ${
                priority === 'low' ? styles.selected : ''
              }`}
              onClick={() => setPriority('low')}
              title="Low Priority"
            >
              Low
            </button>
          </div>
        </div>
      </div>

      {/* Activity dropdown (existing code) */}
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
