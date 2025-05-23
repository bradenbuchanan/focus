// src/app/goals/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Goal,
  Task,
  TimerSession,
  defaultActivityCategories,
  calculateGoalProgress,
} from '@/lib/timer';
import GoalCard from '@/app/components/goals/GoalCard';
import GoalForm from '@/app/components/goals/GoalForm';
import { TaskItem } from '@/app/components/ui/TaskItem';
import TaskForm from '@/app/components/goals/TaskForm';
import styles from './goals.module.css';
import cardStyles from '@/app/styles/shared/cards.module.css';
import buttonStyles from '@/app/styles/shared/buttons.module.css';
import filterStyles from '@/app/styles/shared/filters.module.css';
import listStyles from '@/app/styles/shared/lists.module.css';
import { useData } from '@/providers/DataProvider';

type TabType = 'goals' | 'tasks' | 'completed';

export default function GoalsPage() {
  // State declarations
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [completedGoals, setCompletedGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('goals');
  const [showForm, setShowForm] = useState(false);
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [availableActivities, setAvailableActivities] = useState<string[]>([]);
  const { getGoals, getTasks, getSessions } = useData();

  // Filtered data logic remains the same
  const filteredGoals =
    activityFilter === 'all'
      ? goals
      : goals.filter((goal) => goal.activity === activityFilter);

  const filteredCompletedGoals =
    activityFilter === 'all'
      ? completedGoals
      : completedGoals.filter((goal) => goal.activity === activityFilter);

  const filteredActiveTasks =
    activityFilter === 'all'
      ? tasks
      : tasks.filter((task) => task.activity === activityFilter);

  const filteredCompletedTasks =
    activityFilter === 'all'
      ? completedTasks
      : completedTasks.filter((task) => task.activity === activityFilter);

  // Load data function
  const loadData = useCallback(async () => {
    console.log('Starting data load');
    setIsLoading(true);
    setError(null);

    try {
      // Get all data from database
      const [dbGoals, tasksFromDB, dbSessions] = await Promise.all([
        getGoals(),
        getTasks(),
        getSessions(),
      ]);

      console.log('Received data from database:', {
        goals: dbGoals,
        tasks: tasksFromDB,
        sessions: dbSessions,
      });

      if (!dbGoals || !Array.isArray(dbGoals)) {
        throw new Error('Invalid goals data received');
      }

      // Convert database sessions to TimerSession format
      const sessions: TimerSession[] = dbSessions.map((s) => ({
        id: s.id,
        date: s.start_time,
        localDate: s.start_time.split('T')[0],
        duration: s.duration || 0,
        type: (s.category === 'focus' ? 'focus' : 'break') as 'focus' | 'break',
        completed: s.completed,
        activity: s.activity || undefined,
      }));

      // Map database goals to application's Goal type
      const allGoals = dbGoals.map((dbGoal) => ({
        id: dbGoal.id,
        title: dbGoal.title,
        description: dbGoal.description || undefined,
        type: dbGoal.type as 'time' | 'sessions',
        target: dbGoal.target,
        period: dbGoal.period as 'daily' | 'weekly' | 'monthly' | 'yearly',
        startDate: dbGoal.start_date,
        endDate: dbGoal.end_date || undefined,
        createdAt: dbGoal.created_at,
        activity: dbGoal.activity || undefined,
      }));

      console.log('Mapped goals:', allGoals);

      // Separate active and completed goals
      const active: Goal[] = [];
      const completed: Goal[] = [];

      allGoals.forEach((goal) => {
        const progress = calculateGoalProgress(goal, sessions); // Pass sessions here
        if (progress.percentage >= 100) {
          completed.push(goal);
        } else {
          active.push(goal);
        }
      });

      // Convert Supabase tasks to app's Task format
      const allTasks = tasksFromDB.map((task) => ({
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

      console.log('Converted tasks:', allTasks);

      // Filter active and completed tasks
      const activeTasks = allTasks.filter((task) => !task.completed);
      const doneTasks = allTasks.filter((task) => task.completed);

      // Sort active tasks by dueDate (if available) and then by creation date
      activeTasks.sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        } else if (a.dueDate) {
          return -1; // a has due date, b doesn't, a comes first
        } else if (b.dueDate) {
          return 1; // b has due date, a doesn't, b comes first
        }
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      doneTasks.sort((a, b) => {
        const dateA = a.completedAt
          ? new Date(a.completedAt)
          : new Date(a.createdAt);
        const dateB = b.completedAt
          ? new Date(b.completedAt)
          : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      console.log('Sorted tasks:', {
        active: activeTasks.length,
        completed: doneTasks.length,
      });

      // Extract unique activities
      const activities = new Set<string>();
      [...allGoals, ...allTasks].forEach((item) => {
        if (item.activity) {
          activities.add(item.activity);
        }
      });
      defaultActivityCategories.forEach((activity) => activities.add(activity));

      // Update all state at once
      setGoals(active);
      setCompletedGoals(completed);
      setTasks(activeTasks);
      setCompletedTasks(doneTasks);
      setAvailableActivities(Array.from(activities));

      console.log('Data load complete', {
        activeGoals: active.length,
        completedGoals: completed.length,
        activeTasks: activeTasks.length,
        completedTasks: doneTasks.length,
        activities: Array.from(activities),
      });
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [getGoals, getTasks, getSessions]);

  // Initial data load effect
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper function for date formatting
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={styles.goalsPage}>
      <div className={styles.goalsHeader}>
        <div>
          <h1>Focus Goals & Tasks</h1>
          <p>Set objectives and track your progress</p>
        </div>
        <div className={filterStyles.filterTabs}>
          <button
            className={`${filterStyles.filterTab} ${
              activeTab === 'goals' ? filterStyles.activeTab : ''
            }`}
            onClick={() => setActiveTab('goals')}
          >
            Goals
          </button>
          <button
            className={`${filterStyles.filterTab} ${
              activeTab === 'tasks' ? filterStyles.activeTab : ''
            }`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
          </button>
          <button
            className={`${filterStyles.filterTab} ${
              activeTab === 'completed' ? filterStyles.activeTab : ''
            }`}
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </button>
        </div>
        {activeTab === 'goals' && (
          <button
            className={buttonStyles.primaryButton}
            onClick={() => setShowForm(true)}
          >
            Create New Goal
          </button>
        )}
      </div>

      {isLoading ? (
        <div className={styles.loadingState}>
          <p>Loading goals...</p>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button onClick={loadData} className={buttonStyles.primaryButton}>
            Retry
          </button>
        </div>
      ) : (
        <>
          {availableActivities.length > 0 && (
            <div className={filterStyles.filterContainer}>
              <div className={filterStyles.activityFilters}>
                <span className={filterStyles.filterLabel}>
                  Filter by Activity:
                </span>
                <div className={filterStyles.activityButtons}>
                  <button
                    className={`${filterStyles.activityButton} ${
                      activityFilter === 'all' ? filterStyles.activeButton : ''
                    }`}
                    onClick={() => setActivityFilter('all')}
                  >
                    All Activities
                  </button>
                  {availableActivities.map((activity) => (
                    <button
                      key={activity}
                      className={`${filterStyles.activityButton} ${
                        activityFilter === activity
                          ? filterStyles.activeButton
                          : ''
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

          {activeTab === 'goals' ? (
            <>
              {showForm ? (
                <GoalForm
                  onSave={() => {
                    loadData();
                    setShowForm(false);
                  }}
                  onCancel={() => setShowForm(false)}
                  activity={
                    activityFilter !== 'all' ? activityFilter : undefined
                  }
                />
              ) : (
                <>
                  {filteredGoals.length > 0 ? (
                    <div className={listStyles.listContainer}>
                      {filteredGoals.map((goal) => (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          onDelete={loadData}
                          onEdit={loadData}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className={listStyles.emptyState}>
                      <h3>
                        No active goals{' '}
                        {activityFilter !== 'all'
                          ? `for ${activityFilter}`
                          : ''}
                      </h3>
                      <p>
                        Create your first productivity goal to track your
                        progress
                      </p>
                      <button
                        className={buttonStyles.primaryButton}
                        onClick={() => setShowForm(true)}
                      >
                        Create Your First Goal
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          ) : activeTab === 'tasks' ? (
            <div className={`${cardStyles.card} ${styles.tasksSection}`}>
              <TaskForm
                onAdd={loadData}
                activity={activityFilter !== 'all' ? activityFilter : undefined}
              />

              <div className={listStyles.listContainer}>
                {filteredActiveTasks.length > 0 ? (
                  filteredActiveTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={loadData}
                    />
                  ))
                ) : (
                  <div className={listStyles.emptyState}>
                    {activityFilter === 'all'
                      ? 'No active tasks. Add some tasks above to get started!'
                      : `No active tasks for ${activityFilter}. Add one above!`}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.completedSection}>
              <div className={`${cardStyles.card} ${styles.completedGoals}`}>
                <h3 className={cardStyles.cardTitle}>Completed Goals</h3>
                {filteredCompletedGoals.length > 0 ? (
                  <div className={listStyles.listContainer}>
                    {filteredCompletedGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        onDelete={loadData}
                        onEdit={loadData}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={listStyles.emptyState}>
                    {activityFilter === 'all'
                      ? 'No completed goals yet. Keep working toward your objectives!'
                      : `No completed goals for ${activityFilter} yet.`}
                  </div>
                )}
              </div>

              <div className={`${cardStyles.card} ${styles.completedTasks}`}>
                <h3 className={cardStyles.cardTitle}>Completed Tasks</h3>
                <div className={listStyles.listContainer}>
                  {filteredCompletedTasks.length > 0 ? (
                    filteredCompletedTasks.map((task) => (
                      <div key={task.id} className={styles.completedTaskItem}>
                        <TaskItem task={task} onToggleComplete={loadData} />
                        <div className={styles.completionDate}>
                          Completed:{' '}
                          {formatDate(task.completedAt || task.createdAt)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={listStyles.emptyState}>
                      {activityFilter === 'all'
                        ? 'No completed tasks yet.'
                        : `No completed tasks for ${activityFilter} yet.`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className={styles.timerLink}>
            <Link href="/timer" className={buttonStyles.secondaryButton}>
              Back to Timer
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
