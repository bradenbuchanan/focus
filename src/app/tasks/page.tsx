// src/app/tasks/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Task, getTasks } from '@/lib/timer';
import TaskItem from '@/app/components/goals/TaskItem';
import TaskForm from '@/app/components/goals/TaskForm';
import styles from './tasks.module.css';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const loadTasks = () => {
    const allTasks = getTasks();
    // Sort by completed status and creation date
    allTasks.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setTasks(allTasks);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

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
