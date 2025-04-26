'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Goal,
  Task,
  getGoals,
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
import { useRouter } from 'next/navigation';

type TabType = 'goals' | 'tasks' | 'completed';

export default function GoalsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [completedGoals, setCompletedGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('goals');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [availableActivities, setAvailableActivities] = useState<string[]>([]);
  const { getGoals: getSessions } = useData();
  const router = useRouter();

  // Load goals and tasks
  const loadData = async () => {
    setIsLoading(true);
    console.log('Loading goals data');

    try {
      // Get all goals using the useData hook
      const dbGoals = await getSessions();
      console.log('All goals from database:', dbGoals);

      if (!dbGoals || dbGoals.length === 0) {
        console.log('No goals found, retrying...');
        // Add a small delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Retry the fetch
        const retryGoals = await getSessions();
        console.log('Retry results:', retryGoals);
        if (!retryGoals || retryGoals.length === 0) {
          console.log('Still no goals after retry');
        }
      }

      // Rest of your existing loadData logic...
    } catch (error) {
      console.error('Error loading data:', error);
      // Your existing error handling...
    } finally {
      setIsLoading(false);
    }
  };

  // Modify your useEffect
  useEffect(() => {
    let mounted = true;

    // Use an async IIFE to properly handle the async loadData
    (async () => {
      if (mounted) {
        await loadData();
        console.log('Initial data load complete');
      }
    })();

    // Add a revalidation check after a short delay
    const revalidationTimeout = setTimeout(() => {
      if (mounted && goals.length === 0) {
        console.log('No goals found after initial load, revalidating...');
        loadData();
      }
    }, 2000);

    // Set up visibility change listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mounted) {
        loadData();
      }
    };

    // Add a focus event listener
    const handleFocus = () => {
      if (mounted) {
        loadData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      clearTimeout(revalidationTimeout);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    // Use an async IIFE to properly handle the async loadData
    (async () => {
      if (mounted) {
        await loadData();
        console.log('Initial data load complete');
      }
    })();

    // Set up visibility change listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mounted) {
        // Again, use an async IIFE
        (async () => {
          await loadData();
          console.log('Visibility change data load complete');
        })();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Filter tasks based on activity and completion status
  const getFilteredTasks = (tasksList: Task[]) => {
    return tasksList.filter((task) => {
      // Filter by activity
      if (activityFilter !== 'all' && task.activity !== activityFilter) {
        return false;
      }
      return true;
    });
  };

  // Filter goals based on activity
  const getFilteredGoals = (goalsList: Goal[]) => {
    if (activityFilter === 'all') return goalsList;

    // Only return goals where the activity matches the filter
    return goalsList.filter((goal) => goal.activity === activityFilter);
  };

  const filteredActiveTasks = getFilteredTasks(tasks);
  const filteredCompletedTasks = getFilteredTasks(completedTasks);
  const filteredGoals = getFilteredGoals(goals);
  const filteredCompletedGoals = getFilteredGoals(completedGoals);

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
        {activeTab === 'goals' ? (
          <button
            className={styles.createButton}
            onClick={() => setShowForm(true)}
          >
            Create New Goal
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <div className={styles.loadingState}>
          <p>Loading goals...</p>
        </div>
      ) : (
        <>
          {/* Activity filter section - show for all tabs */}
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
            // Goals tab content
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
                        Create your first productivity goal to start tracking
                        your progress
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
            // Tasks tab content
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
            // Completed tab content
            <div className={styles.completedSection}>
              {/* Completed goals section */}
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

              {/* Completed tasks section */}
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

// Helper function to format dates nicely
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
