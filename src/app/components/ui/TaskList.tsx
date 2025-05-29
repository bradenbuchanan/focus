// src/app/components/ui/TaskList.tsx
'use client';

import { Task } from '@/lib/timer';
import { TaskItem } from './TaskItem';

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
    <div className={`list ${isCompact ? 'list--compact' : ''} ${className}`}>
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
