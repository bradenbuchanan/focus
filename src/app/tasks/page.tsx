// src/app/tasks/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Task, getTasks } from '@/lib/timer';
import TaskItem from '@/app/components/goals/TaskItem';
import TaskForm from '@/app/components/goals/TaskForm';
import styles from './tasks.module.css';

export default function TasksPage() {
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const loadTasks = () => {
    const allTasks = getTasks();

    // Separate active and completed tasks
    const active = allTasks.filter((task) => !task.completed);
    const completed = allTasks.filter((task) => task.completed);

    // Sort active tasks by dueDate (if available) and then by creation date
    active.sort((a, b) => {
      // First sort by due date (if available)
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (a.dueDate) {
        return -1; // a has due date, b doesn't, a comes first
      } else if (b.dueDate) {
        return 1; // b has due date, a doesn't, b comes first
      }

      // Then by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Sort completed tasks by completion date (newest first)
    completed.sort((a, b) => {
      const dateA = a.completedAt
        ? new Date(a.completedAt)
        : new Date(a.createdAt);
      const dateB = b.completedAt
        ? new Date(b.completedAt)
        : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    setActiveTasks(active);
    setCompletedTasks(completed);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Get filtered tasks based on the selected filter
  const getFilteredTasks = () => {
    switch (filter) {
      case 'active':
        return activeTasks;
      case 'completed':
        return completedTasks;
      case 'all':
      default:
        return [...activeTasks, ...completedTasks];
    }
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className={styles.tasksPage}>
      <div className={styles.tasksHeader}>
        <div>
          <h1>Tasks</h1>
          <p>Track and manage your specific action items</p>
        </div>
      </div>

      <div className={styles.taskFilters}>
        <button
          className={`${styles.filterButton} ${
            filter === 'all' ? styles.active : ''
          }`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`${styles.filterButton} ${
            filter === 'active' ? styles.active : ''
          }`}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button
          className={`${styles.filterButton} ${
            filter === 'completed' ? styles.active : ''
          }`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      <TaskForm onAdd={loadTasks} />

      <div className={styles.tasksList}>
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskItem key={task.id} task={task} onUpdate={loadTasks} />
          ))
        ) : (
          <div className={styles.noTasks}>
            {filter === 'all'
              ? 'No tasks yet. Add some tasks to get started!'
              : filter === 'active'
              ? 'No active tasks. All done!'
              : 'No completed tasks yet.'}
          </div>
        )}
      </div>

      <div className={styles.linkBack}>
        <Link href="/goals" className={styles.secondaryButton}>
          Back to Goals
        </Link>
      </div>
    </div>
  );
}
