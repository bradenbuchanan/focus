// src/app/components/goals/TaskForm.tsx
import { useState } from 'react';
import { Task, defaultActivityCategories } from '@/lib/timer';
import styles from './TaskForm.module.css';
import buttonStyles from '@/app/styles/shared/buttons.module.css';
import { useData } from '@/providers/DataProvider';

interface TaskFormProps {
  goalId?: string;
  onAdd: () => void;
  activity?: string;
  onAddImmediate?: (task: Task) => void;
}

export default function TaskForm({
  goalId,
  onAdd,
  activity: defaultActivity,
  onAddImmediate,
}: TaskFormProps) {
  const [text, setText] = useState('');
  const [activity, setActivity] = useState(defaultActivity || '');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState<string>(''); // Add due date state
  const [showActivitySelector, setShowActivitySelector] = useState(false);

  const { saveTask } = useData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (text.trim()) {
      try {
        // Create task object
        const newTask: Task = {
          id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
          goalId,
          text: text.trim(),
          activity: activity || undefined,
          completed: false,
          createdAt: new Date().toISOString(),
          priority: priority,
          dueDate: dueDate || undefined,
        };

        // Update UI immediately
        if (onAddImmediate) {
          onAddImmediate(newTask);
        }

        console.log('Saving task:', newTask);
        // Save to database
        const savedId = await saveTask(newTask);
        console.log('Task saved with ID:', savedId);

        // Reset form
        setText('');
        setActivity(defaultActivity || '');
        setPriority('medium');
        setDueDate('');
        setShowActivitySelector(false);

        // Refresh the full task list (this will now get tasks from Supabase)
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

      <button type="submit" className={buttonStyles.primaryButton}>
        Add Task
      </button>
    </form>
  );
}
