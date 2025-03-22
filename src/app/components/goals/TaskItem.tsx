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
  const [showActivitySelector, setShowActivitySelector] = useState(false);

  const handleToggleComplete = () => {
    const updatedTask = {
      ...task,
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : undefined,
    };
    updateTask(updatedTask);
    onUpdate();
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
      }`}
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
        {task.activity && (
          <div className={styles.taskActivity}>{task.activity}</div>
        )}
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
