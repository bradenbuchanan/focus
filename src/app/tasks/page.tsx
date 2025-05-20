// src/app/tasks/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Task } from '@/lib/timer';
import { TaskItem } from '@/app/components/ui/TaskItem';
import TaskForm from '@/app/components/goals/TaskForm';
import styles from './tasks.module.css';
import cardStyles from '@/app/styles/shared/cards.module.css';
import buttonStyles from '@/app/styles/shared/buttons.module.css';
import filterStyles from '@/app/styles/shared/filters.module.css';
import listStyles from '@/app/styles/shared/lists.module.css';
import { useData } from '@/providers/DataProvider';

export default function TasksPage() {
  const { getTasks: getTasksFromDB, updateTask } = useData();
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleAddImmediate = (newTask: Task) => {
    console.log('Adding task immediately to UI:', newTask);
    setActiveTasks((prevTasks) => [newTask, ...prevTasks]);
  };

  // Debug tasks function
  const debugTasks = async () => {
    console.log('=== DEBUG: Tasks in state ===');
    console.log('Active tasks:', activeTasks);
    console.log('Completed tasks:', completedTasks);
    try {
      const tasks = await getTasksFromDB();
      console.log('Tasks from DB:', tasks);
    } catch (error) {
      console.error('Error getting tasks for debug:', error);
    }
  };

  // Task toggle handler
  const handleTaskToggle = async (taskId: string) => {
    try {
      // Find the task
      const allTasks = [...activeTasks, ...completedTasks];
      const task = allTasks.find((t) => t.id === taskId);

      if (task) {
        await updateTask({
          id: taskId,
          completed: !task.completed,
          completedAt: !task.completed ? new Date().toISOString() : undefined,
        });

        // Reload the tasks
        await loadTasks();
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  // Other task handlers remain the same
  const handleTaskEdit = async (task: Task) => {
    console.log('Edit task:', task);
  };

  const handleTaskDelete = async (taskId: string) => {
    console.log('Delete task:', taskId);
    await loadTasks();
  };

  // Task loading function
  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('=== LOAD TASKS: Starting task load ===');

      // Get tasks from Supabase
      const supabaseTasks = await getTasksFromDB();
      console.log('LOAD TASKS: Raw tasks from database:', supabaseTasks);

      if (!supabaseTasks || supabaseTasks.length === 0) {
        console.log('LOAD TASKS: No tasks returned from database');
        setActiveTasks([]);
        setCompletedTasks([]);
        setIsLoading(false);
        return;
      }

      // Convert Supabase tasks to app's Task format
      const allTasks = supabaseTasks.map((task) => ({
        id: task.id,
        goalId: task.goal_id || undefined,
        text: task.text,
        completed: task.completed,
        createdAt: task.created_at,
        dueDate: task.due_date || undefined,
        activity: task.activity || undefined,
        priority: (task.priority as 'low' | 'medium' | 'high') || 'medium',
        completedAt: task.completed_at || undefined,
      }));

      // Filter active and completed tasks
      const active = allTasks.filter((task) => !task.completed);
      const completed = allTasks.filter((task) => task.completed);

      // Sort active tasks by dueDate (if available) and then by creation date
      active.sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        } else if (a.dueDate) {
          return -1; // a has due date, b doesn't, a comes first
        } else if (b.dueDate) {
          return 1; // b has due date, a doesn't, b comes first
        }
        // Then by creation date (newest first)
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
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

      // Update state with the properly converted tasks
      setActiveTasks(active);
      setCompletedTasks(completed);
      console.log('LOAD TASKS: State updated with tasks:', {
        activeTasks: active.length,
        completedTasks: completed.length,
      });
    } catch (error) {
      console.error('LOAD TASKS: Error loading tasks:', error);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [getTasksFromDB]);

  // Initial data load
  useEffect(() => {
    loadTasks();

    // Add visibility change listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadTasks();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadTasks]);

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
      <div className={`${cardStyles.card} ${styles.tasksHeader}`}>
        <div>
          <h1>Tasks</h1>
          <p>Track and manage your specific action items</p>
        </div>
      </div>

      <div className={`${cardStyles.card} ${filterStyles.filterTabs}`}>
        <button
          className={`${filterStyles.filterTab} ${
            filter === 'all' ? filterStyles.activeTab : ''
          }`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`${filterStyles.filterTab} ${
            filter === 'active' ? filterStyles.activeTab : ''
          }`}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button
          className={`${filterStyles.filterTab} ${
            filter === 'completed' ? filterStyles.activeTab : ''
          }`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      {/* Debug button with proper onClick handler */}
      <div className={cardStyles.card}>
        <button
          onClick={debugTasks}
          style={{
            margin: '0.5rem 0',
            padding: '0.5rem 1rem',
            backgroundColor: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
          }}
        >
          Debug Tasks
        </button>
      </div>

      <div className={cardStyles.card}>
        <TaskForm onAdd={loadTasks} onAddImmediate={handleAddImmediate} />
      </div>

      {isLoading ? (
        <div className={`${cardStyles.card} ${styles.loadingState}`}>
          Loading tasks...
        </div>
      ) : error ? (
        <div className={`${cardStyles.card} ${styles.errorState}`}>
          <p>{error}</p>
          <button onClick={loadTasks} className={buttonStyles.primaryButton}>
            Retry
          </button>
        </div>
      ) : (
        <div className={`${cardStyles.card} ${listStyles.listContainer}`}>
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={handleTaskToggle}
                onEdit={handleTaskEdit}
                onDelete={handleTaskDelete}
                showActions={true}
                isCompact={false}
              />
            ))
          ) : (
            <div className={listStyles.emptyState}>
              {filter === 'all'
                ? 'No tasks yet. Add some tasks to get started!'
                : filter === 'active'
                ? 'No active tasks. All done!'
                : 'No completed tasks yet.'}
            </div>
          )}
        </div>
      )}

      <div className={`${cardStyles.card} ${styles.linkBack}`}>
        <Link href="/goals" className={buttonStyles.secondaryButton}>
          Back to Goals
        </Link>
      </div>
    </div>
  );
}
