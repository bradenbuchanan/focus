// src/app/goals/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Goal,
  Task,
  getTasks,
  defaultActivityCategories,
  calculateGoalProgress,
} from '@/lib/timer';
import GoalCard from '@/app/components/goals/GoalCard';
import GoalForm from '@/app/components/goals/GoalForm';
import TaskItem from '@/app/components/goals/TaskItem';
import TaskForm from '@/app/components/goals/TaskForm';
import styles from './goals.module.css';
import tasksStyles from '@/app/components/goals/TaskList.module.css';
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

  const { getGoals: getSessions } = useData();

  // Computed values using useMemo
  const filteredGoals = useMemo(() => {
    if (activityFilter === 'all') return goals;
    return goals.filter((goal) => goal.activity === activityFilter);
  }, [goals, activityFilter]);

  const filteredCompletedGoals = useMemo(() => {
    if (activityFilter === 'all') return completedGoals;
    return completedGoals.filter((goal) => goal.activity === activityFilter);
  }, [completedGoals, activityFilter]);

  const filteredActiveTasks = useMemo(() => {
    if (activityFilter === 'all') return tasks;
    return tasks.filter((task) => task.activity === activityFilter);
  }, [tasks, activityFilter]);

  const filteredCompletedTasks = useMemo(() => {
    if (activityFilter === 'all') return completedTasks;
    return completedTasks.filter((task) => task.activity === activityFilter);
  }, [completedTasks, activityFilter]);

  // Debug logging effect
  useEffect(() => {
    console.log('Current state:', {
      isLoading,
      error,
      goals: goals.length,
      completedGoals: completedGoals.length,
      tasks: tasks.length,
      completedTasks: completedTasks.length,
      filteredGoals: filteredGoals.length,
      filteredCompletedGoals: filteredCompletedGoals.length,
      filteredActiveTasks: filteredActiveTasks.length,
      filteredCompletedTasks: filteredCompletedTasks.length,
      activityFilter,
      activeTab,
    });
  }, [
    isLoading,
    error,
    goals,
    completedGoals,
    tasks,
    completedTasks,
    filteredGoals,
    filteredCompletedGoals,
    filteredActiveTasks,
    filteredCompletedTasks,
    activityFilter,
    activeTab,
  ]);

  // Load data function
  const loadData = async () => {
    console.log('Starting data load');
    setIsLoading(true);
    setError(null);

    try {
      // Get goals from database
      const dbGoals = await getSessions();
      console.log('Received goals from database:', dbGoals);

      if (!dbGoals || !Array.isArray(dbGoals)) {
        throw new Error('Invalid goals data received');
      }

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
        const progress = calculateGoalProgress(goal);
        if (progress.percentage >= 100) {
          completed.push(goal);
        } else {
          active.push(goal);
        }
      });

      // Get and process tasks
      const allTasks = getTasks();
      const activeTasks = allTasks.filter((task) => !task.completed);
      const doneTasks = allTasks.filter((task) => task.completed);

      // Sort tasks by date
      activeTasks.sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
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
  };

  // Initial data load effect
  useEffect(() => {
    loadData();
  }, []);

  // Helper function for date formatting
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Return JSX
  return (
    <div className={styles.goalsPage}>
      <div className={styles.goalsHeader}>
        <div>
          <h1>Focus Goals & Tasks</h1>
          <p>Set objectives and track your progress</p>
        </div>
        <div className={styles.tabsContainer}>
          <button
            className={`${styles.tabButton} ${
              activeTab === 'goals' ? styles.activeTab : ''
            }`}
            onClick={() => setActiveTab('goals')}
          >
            Goals
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === 'tasks' ? styles.activeTab : ''
            }`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === 'completed' ? styles.activeTab : ''
            }`}
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </button>
        </div>
        {activeTab === 'goals' && (
          <button
            className={styles.createButton}
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
          <button onClick={loadData} className={styles.retryButton}>
            Retry
          </button>
        </div>
      ) : (
        <>
          {availableActivities.length > 0 && (
            <div className={styles.filterBar}>
              <div className={styles.activityFilters}>
                <span className={styles.filterLabel}>Filter by Activity:</span>
                <div className={styles.activityButtons}>
                  <button
                    className={`${styles.activityButton} ${
                      activityFilter === 'all' ? styles.active : ''
                    }`}
                    onClick={() => setActivityFilter('all')}
                  >
                    All Activities
                  </button>
                  {availableActivities.map((activity) => (
                    <button
                      key={activity}
                      className={`${styles.activityButton} ${
                        activityFilter === activity ? styles.active : ''
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
                    <div className={styles.goalsList}>
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
                    <div className={styles.emptyState}>
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
                        className={styles.createButton}
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
            <div className={styles.tasksSection}>
              <TaskForm
                onAdd={loadData}
                activity={activityFilter !== 'all' ? activityFilter : undefined}
              />

              <div className={tasksStyles.tasksList}>
                {filteredActiveTasks.length > 0 ? (
                  filteredActiveTasks.map((task) => (
                    <TaskItem key={task.id} task={task} onUpdate={loadData} />
                  ))
                ) : (
                  <div className={tasksStyles.noTasks}>
                    {activityFilter === 'all'
                      ? 'No active tasks. Add some tasks above to get started!'
                      : `No active tasks for ${activityFilter}. Add one above!`}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.completedSection}>
              <div className={styles.completedGoals}>
                <h3 className={styles.sectionTitle}>Completed Goals</h3>
                {filteredCompletedGoals.length > 0 ? (
                  <div className={styles.goalsList}>
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
                  <div className={styles.noItems}>
                    {activityFilter === 'all'
                      ? 'No completed goals yet. Keep working toward your objectives!'
                      : `No completed goals for ${activityFilter} yet.`}
                  </div>
                )}
              </div>

              <div className={styles.completedTasks}>
                <h3 className={styles.sectionTitle}>Completed Tasks</h3>
                <div className={tasksStyles.tasksList}>
                  {filteredCompletedTasks.length > 0 ? (
                    filteredCompletedTasks.map((task) => (
                      <div key={task.id} className={styles.completedTaskItem}>
                        <TaskItem task={task} onUpdate={loadData} />
                        <div className={styles.completionDate}>
                          Completed:{' '}
                          {formatDate(task.completedAt || task.createdAt)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.noItems}>
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
            <Link href="/timer" className={styles.secondaryButton}>
              Back to Timer
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
