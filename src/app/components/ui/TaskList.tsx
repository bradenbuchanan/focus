// src/app/components/ui/TaskList.tsx
'use client';

import { Task } from '@/lib/timer';
import { TaskItem } from './TaskItem';
import styles from './TaskList.module.css';
import listStyles from '@/app/styles/shared/lists.module.css';

interface TaskListProps {
  tasks: Task[];
  isCompact?: boolean;
  onTaskUpdate?: () => void;
  className?: string;
}

export function TaskList({
  tasks,
  isCompact = false,
  onTaskUpdate,
  className = '',
}: TaskListProps) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className={`${listStyles.listContainer} ${className}`}>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          isCompact={isCompact}
          onToggleComplete={onTaskUpdate}
          showActions={!isCompact}
        />
      ))}
    </div>
  );
}
