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
import { useData } from '@/providers/DataProvider';

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
  const [dueDate, setDueDate] = useState<string>(task.dueDate || ''); // Add due date state
  const [showActivitySelector, setShowActivitySelector] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const { updateTask: updateServerTask, deleteTask: deleteServerTask } =
    useData();
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

  // Helper to determine due date status
  const getDueDateStatus = () => {
    if (!task.dueDate) return 'none';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDateObj = new Date(task.dueDate);
    dueDateObj.setHours(0, 0, 0, 0);

    const timeDiff = dueDateObj.getTime() - today.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);

    if (daysDiff < 0) return 'overdue';
    if (daysDiff <= 2) return 'soon';
    return 'future';
  };

  // Format the due date for display
  const formatDueDate = (dateString: string) => {
    if (!dateString) return '';

    const dueDateObj = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueDateOnly = new Date(dueDateObj);
    dueDateOnly.setHours(0, 0, 0, 0);

    if (dueDateOnly.getTime() === today.getTime()) {
      return 'Today';
    } else if (dueDateOnly.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return dueDateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year:
          dueDateObj.getFullYear() !== today.getFullYear()
            ? 'numeric'
            : undefined,
      });
    }
  };

  const dueDateStatus = getDueDateStatus();

  const handleToggleComplete = async () => {
    try {
      // If task is being marked as complete, trigger fade
      if (!task.completed) {
        setIsFading(true);

        // After animation completes, update the task
        setTimeout(async () => {
          try {
            // First try to update in Supabase directly
            await updateServerTask({
              id: task.id,
              completed: true,
              completedAt: new Date().toISOString(),
            });

            // Then update the local task for UI
            const updatedTask = {
              ...task,
              completed: true,
              completedAt: new Date().toISOString(),
            };

            // Still call the local function as fallback
            updateTask(updatedTask);

            console.log('Task marked complete:', task.id);

            onUpdate(); // This will trigger the parent to refresh the task lists
          } catch (error) {
            console.error('Error completing task:', error);
            setIsFading(false);
          }
        }, 1100); // Animation duration (800ms) + delay (300ms)
      } else {
        // If unchecking, update immediately
        try {
          await updateServerTask({
            id: task.id,
            completed: false,
            completedAt: undefined,
          });

          const updatedTask = {
            ...task,
            completed: false,
            completedAt: undefined,
          };

          updateTask(updatedTask);
          onUpdate();
        } catch (error) {
          console.error('Error uncompleting task:', error);
        }
      }
    } catch (err) {
      console.error('Toggle error:', err);
      setIsFading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        // Try to delete from Supabase first
        await deleteServerTask(task.id);
        console.log('Task deleted from server:', task.id);

        // Also delete from localStorage as fallback
        deleteTask(task.id);

        onUpdate();
      } catch (error) {
        console.error('Error deleting task:', error);

        // Fallback to localStorage only
        deleteTask(task.id);
        onUpdate();
      }
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
        dueDate: dueDate || undefined, // Add due date to updated task
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

        <div className={styles.editFormRow}>
          {/* Due date input */}
          <div className={styles.formGroup}>
            <label htmlFor={`due-date-${task.id}`}>Due Date:</label>
            <input
              id={`due-date-${task.id}`}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={styles.dueDateInput}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

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
          {task.dueDate && (
            <span
              className={`${styles.dueDate} ${
                styles[
                  `dueDate${
                    dueDateStatus.charAt(0).toUpperCase() +
                    dueDateStatus.slice(1)
                  }`
                ]
              }`}
            >
              {dueDateStatus === 'overdue' ? 'Overdue: ' : 'Due: '}
              {formatDueDate(task.dueDate)}
            </span>
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
