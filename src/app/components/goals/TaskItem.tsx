// src/app/components/goals/TaskItem.tsx
'use client';

import { useState } from 'react';
import {
  Task,
  updateTask,
  deleteTask,
  defaultActivityCategories,
} from '@/lib/timer';
import styles from './TaskItem.module.css';

interface TaskItemProps {
  task: Task;
  onUpdate: () => void;
}

export default function TaskItem({ task, onUpdate }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(task.text);
  const [activity, setActivity] = useState(task.activity || '');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(
    task.priority || 'medium'
  );
  const [showActivitySelector, setShowActivitySelector] = useState(false);
  const [isFading, setIsFading] = useState(false);

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Urgent';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return 'Medium';
    }
  };

  const handleToggleComplete = () => {
    // If task is being marked as complete, trigger fade
    if (!task.completed) {
      setIsFading(true);

      // After animation completes, update the task
      setTimeout(() => {
        const updatedTask = {
          ...task,
          completed: true,
          completedAt: new Date().toISOString(),
        };
        updateTask(updatedTask);
        onUpdate();
      }, 1100); // Animation duration (800ms) + delay (300ms)
    } else {
      // If unchecking, update immediately
      const updatedTask = {
        ...task,
        completed: false,
        completedAt: undefined,
      };
      updateTask(updatedTask);
      onUpdate();
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id);
      onUpdate();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      const updatedTask = {
        ...task,
        text: text.trim(),
        activity: activity || undefined,
        priority: priority,
      };
      updateTask(updatedTask);
      setIsEditing(false);
      onUpdate();
    }
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className={styles.taskEditForm}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
          className={styles.taskEditInput}
        />

        <div className={styles.taskActivitySelector}>
          <button
            type="button"
            className={styles.activitySelectorButton}
            onClick={() => setShowActivitySelector(!showActivitySelector)}
          >
            {activity || 'Select Activity'} ▼
          </button>

          {showActivitySelector && (
            <div className={styles.activitySelectorDropdown}>
              {defaultActivityCategories.map((activityOption) => (
                <button
                  key={activityOption}
                  type="button"
                  className={`${styles.activityOption} ${
                    activity === activityOption ? styles.selected : ''
                  }`}
                  onClick={() => setActivity(activityOption)}
                >
                  {activityOption}
                </button>
              ))}
              <button
                type="button"
                className={styles.activityOption}
                onClick={() => setActivity('')}
              >
                None
              </button>
            </div>
          )}
        </div>

        <div className={styles.taskPrioritySelector}>
          <label>Priority:</label>
          <div className={styles.priorityButtons}>
            <button
              type="button"
              className={`${styles.priorityButton} ${styles.highPriority} ${
                priority === 'high' ? styles.selected : ''
              }`}
              onClick={() => setPriority('high')}
            >
              Urgent
            </button>
            <button
              type="button"
              className={`${styles.priorityButton} ${styles.mediumPriority} ${
                priority === 'medium' ? styles.selected : ''
              }`}
              onClick={() => setPriority('medium')}
            >
              Medium
            </button>
            <button
              type="button"
              className={`${styles.priorityButton} ${styles.lowPriority} ${
                priority === 'low' ? styles.selected : ''
              }`}
              onClick={() => setPriority('low')}
            >
              Low
            </button>
          </div>
        </div>

        <div className={styles.taskEditActions}>
          <button type="submit" className={styles.taskSaveButton}>
            Save
          </button>
          <button
            type="button"
            className={styles.taskCancelButton}
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div
      className={`${styles.taskItem} ${
        task.completed ? styles.taskCompleted : ''
      } ${isFading ? styles.completedTaskFade : ''}`}
    >
      <div className={styles.taskCheckbox}>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={handleToggleComplete}
        />
      </div>
      <div className={styles.taskTextContainer}>
        <div className={styles.taskText}>{task.text}</div>
        <div className={styles.taskMeta}>
          {task.priority && (
            <span
              className={`${styles.priorityTag} ${
                styles[
                  `priority${
                    task.priority.charAt(0).toUpperCase() +
                    task.priority.slice(1)
                  }`
                ]
              }`}
            >
              {getPriorityLabel(task.priority)}
            </span>
          )}
          {task.activity && (
            <span className={styles.taskActivity}>{task.activity}</span>
          )}
        </div>
      </div>
      <div className={styles.taskActions}>
        <button
          className={styles.taskEditButton}
          onClick={() => setIsEditing(true)}
          title="Edit task"
        >
          ✎
        </button>
        <button
          className={styles.taskDeleteButton}
          onClick={handleDelete}
          title="Delete task"
        >
          ×
        </button>
      </div>
    </div>
  );
}
