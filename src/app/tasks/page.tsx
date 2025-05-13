// src/app/tasks/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Task } from '@/lib/timer';
import { TaskItem } from '@/app/components/ui/TaskItem'; // Updated import
import TaskForm from '@/app/components/goals/TaskForm';
import styles from './tasks.module.css';
import { useData } from '@/providers/DataProvider';
import { supabase } from '@/lib/supabase';

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

  // Updated handler to work with unified TaskItem
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

  const handleTaskEdit = async (task: Task) => {
    // Implement edit functionality if needed
    console.log('Edit task:', task);
  };

  const handleTaskDelete = async (taskId: string) => {
    // Implement delete functionality if needed
    console.log('Delete task:', taskId);
    await loadTasks();
  };

  const debugTasks = async () => {
    console.log('=== DEBUG: Directly checking tasks in Supabase ===');
    try {
      // Get the current user
      const { data: userData } = await supabase.auth.getUser();
      console.log('Current user:', userData?.user?.id);

      // Direct query to see all tasks for this user
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userData?.user?.id);

      console.log('Direct Supabase query result:', {
        success: !error,
        count: data?.length || 0,
        tasks: data,
      });

      // Also try your loadTasks function
      await loadTasks();
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  // Change: Use useCallback to memoize the loadTasks function
  // This prevents it from being recreated on every render
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

      console.log('LOAD TASKS: Processing tasks...');

      // Convert Supabase tasks to your app's Task format
      const convertedTasks = supabaseTasks.map((task) => ({
        id: task.id,
        goalId: task.goal_id || undefined,
        text: task.text,
        completed: task.completed,
        createdAt: task.created_at, // Convert snake_case to camelCase
        dueDate: task.due_date || undefined,
        activity: task.activity || undefined,
        priority: (task.priority as 'low' | 'medium' | 'high') || 'medium',
        completedAt: task.completed_at || undefined,
      }));

      console.log('LOAD TASKS: Converted tasks:', convertedTasks);

      // Separate active and completed tasks
      const active = convertedTasks.filter((task) => !task.completed);
      const completed = convertedTasks.filter((task) => task.completed);

      console.log('LOAD TASKS: Separated tasks:', {
        active: active.length,
        completed: completed.length,
      });

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

      console.log('LOAD TASKS: Sorted tasks:', {
        active: active.length,
        completed: completed.length,
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
  }, [getTasksFromDB]); // Add getTasksFromDB as a dependency

  useEffect(() => {
    // Load tasks initially
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
  }, [loadTasks]); // Change: Add loadTasks to the dependency array

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

  // Option 1: Simply remove the unused activityFilter state
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

      {/* Debug button moved here for better visibility */}
      <button
        onClick={debugTasks}
        style={{
          margin: '1rem 0',
          padding: '0.5rem 1rem',
          backgroundColor: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '0.25rem',
        }}
      >
        Debug Tasks
      </button>

      <TaskForm onAdd={loadTasks} onAddImmediate={handleAddImmediate} />

      {isLoading ? (
        <div className={styles.loadingState}>Loading tasks...</div>
      ) : error ? (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button onClick={loadTasks} className={styles.retryButton}>
            Retry
          </button>
        </div>
      ) : (
        <div className={styles.tasksList}>
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
            <div className={styles.noTasks}>
              {filter === 'all'
                ? 'No tasks yet. Add some tasks to get started!'
                : filter === 'active'
                ? 'No active tasks. All done!'
                : 'No completed tasks yet.'}
            </div>
          )}
        </div>
      )}

      <div className={styles.linkBack}>
        <Link href="/goals" className={styles.secondaryButton}>
          Back to Goals
        </Link>
      </div>
    </div>
  );
}
