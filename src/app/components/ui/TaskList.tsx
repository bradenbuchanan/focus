// src/components/ui/TaskList.tsx
'use client';

import { useState, useEffect } from 'react';
import { Task, getTasksForGoal, getTasks } from '@/lib/timer';
import { TaskItem } from './TaskItem';
import styles from './TaskList.module.css';

interface TaskListProps {
  goalId?: string;
  filter?: 'all' | 'active' | 'completed';
  activityFilter?: string;
  onTaskUpdate?: () => void;
  isCompact?: boolean;
  showEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function TaskList({
  goalId,
  filter = 'all',
  activityFilter,
  onTaskUpdate,
  isCompact = false,
  showEmpty = true,
  emptyMessage = 'No tasks found',
  className = '',
}: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const allTasks = goalId ? getTasksForGoal(goalId) : getTasks();

    let filteredTasks = allTasks;

    // Apply completion filter
    if (filter === 'active') {
      filteredTasks = filteredTasks.filter((task) => !task.completed);
    } else if (filter === 'completed') {
      filteredTasks = filteredTasks.filter((task) => task.completed);
    }

    // Apply activity filter
    if (activityFilter && activityFilter !== 'all') {
      filteredTasks = filteredTasks.filter(
        (task) => task.activity === activityFilter
      );
    }

    // Sort tasks
    filteredTasks.sort((a, b) => {
      // First by completion status
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      // Then by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      // Finally by creation date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    setTasks(filteredTasks);
  }, [goalId, filter, activityFilter]);

  const handleTaskToggle = async (_taskId: string) => {
    // Update task completion
    // This would call your updateTask function
    if (onTaskUpdate) {
      onTaskUpdate();
    }
  };

  const handleTaskEdit = async (_task: Task) => {
    // Handle task editing
    if (onTaskUpdate) {
      onTaskUpdate();
    }
  };

  const handleTaskDelete = async (_taskId: string) => {
    // Handle task deletion
    if (onTaskUpdate) {
      onTaskUpdate();
    }
  };

  if (tasks.length === 0 && !showEmpty) {
    return null;
  }

  return (
    <div className={`${styles.taskList} ${className}`}>
      {tasks.length > 0 ? (
        tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggleComplete={handleTaskToggle}
            onEdit={handleTaskEdit}
            onDelete={handleTaskDelete}
            isCompact={isCompact}
          />
        ))
      ) : (
        <div className={styles.emptyState}>{emptyMessage}</div>
      )}
    </div>
  );
}
