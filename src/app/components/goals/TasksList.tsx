// src/app/components/goals/TasksList.tsx
'use client';

import { useEffect, useState } from 'react';
import { Task } from '@/lib/timer';
import { TaskList } from '../../components/ui/TaskList';
import TaskForm from './TaskForm';
import { useData } from '@/providers/DataProvider';

interface TasksListProps {
  goalId: string;
}

export default function TasksList({ goalId }: TasksListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [availableActivities, setAvailableActivities] = useState<string[]>([]);

  const { getTasks } = useData();

  const loadTasks = async () => {
    try {
      // Get all tasks from the data provider
      const allTasks = await getTasks();

      // Convert from database format to app format
      const appTasks: Task[] = allTasks.map((dbTask) => ({
        id: dbTask.id,
        goalId: dbTask.goal_id || undefined,
        text: dbTask.text,
        completed: dbTask.completed,
        createdAt: dbTask.created_at,
        dueDate: dbTask.due_date || undefined,
        activity: dbTask.activity || undefined,
        priority: (dbTask.priority as 'low' | 'medium' | 'high') || undefined,
        completedAt: dbTask.completed_at || undefined,
      }));

      // Filter tasks for this goal
      const goalTasks = appTasks.filter((task) => task.goalId === goalId);

      // Filter based on completion status
      const filteredTasks = showCompleted
        ? goalTasks
        : goalTasks.filter((task: Task) => !task.completed);

      // Filter by activity
      const activityFilteredTasks =
        activityFilter === 'all'
          ? filteredTasks
          : filteredTasks.filter(
              (task: Task) => task.activity === activityFilter
            );

      setTasks(activityFilteredTasks);

      // Update available activities
      const activities = new Set<string>();
      goalTasks.forEach((task: Task) => {
        if (task.activity) {
          activities.add(task.activity);
        }
      });
      setAvailableActivities(Array.from(activities));
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [goalId, showCompleted, activityFilter]);

  return (
    <div className="card">
      <div className="card__header">
        <h4 className="card__title">Tasks for this Goal</h4>
      </div>

      <div className="card__body">
        {availableActivities.length > 0 && (
          <div className="filter-container">
            <div>
              <span className="filter-label">Filter by Activity:</span>
              <div className="filter-buttons">
                <button
                  className={`filter-button ${
                    activityFilter === 'all' ? 'filter-button--active' : ''
                  }`}
                  onClick={() => setActivityFilter('all')}
                >
                  All Activities
                </button>
                {availableActivities.map((activity) => (
                  <button
                    key={activity}
                    className={`filter-button ${
                      activityFilter === activity ? 'filter-button--active' : ''
                    }`}
                    onClick={() => setActivityFilter(activity)}
                  >
                    {activity}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <TaskForm
          goalId={goalId}
          onAdd={loadTasks}
          activity={activityFilter !== 'all' ? activityFilter : undefined}
        />

        <TaskList tasks={tasks} isCompact={false} onTaskUpdate={loadTasks} />
      </div>

      <div className="card__footer" style={{ justifyContent: 'center' }}>
        <button
          className="btn btn--ghost btn--sm transition-all hover-lift"
          onClick={() => setShowCompleted(!showCompleted)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: 0.8,
          }}
        >
          <span style={{ fontSize: '0.7rem' }}>
            {showCompleted ? '▲' : '▼'}
          </span>
          {showCompleted ? 'Hide' : 'Show'} completed tasks
        </button>
      </div>
    </div>
  );
}
