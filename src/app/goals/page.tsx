// src/app/goals/page.tsx
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

type TabType = 'goals' | 'tasks' | 'completed';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [completedGoals, setCompletedGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('goals');
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed'>(
    'all'
  );
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [availableActivities, setAvailableActivities] = useState<string[]>([]);

  // Load goals and tasks
  const loadData = () => {
    console.log('Loading goals data');

    // Get all goals
    const allGoals = getGoals();
    console.log('All goals:', allGoals);

    // Initially, don't filter by completion
    setGoals(allGoals);

    // Separate active and completed goals (consider a goal completed if progress ≥ 100%)
    const active: Goal[] = [];
    const completed: Goal[] = [];

    allGoals.forEach((goal) => {
      // Calculate progress
      const progress = calculateGoalProgress(goal);
      if (progress.percentage >= 100) {
        completed.push(goal);
      } else {
        active.push(goal);
      }
    });

    setGoals(active);
    setCompletedGoals(completed);

    // Get all tasks
    const allTasks = getTasks();

    // Separate active and completed tasks
    const activeTasks = allTasks.filter((task) => !task.completed);
    const doneTasks = allTasks.filter((task) => task.completed);

    // Sort active tasks by due date and creation date
    activeTasks.sort((a, b) => {
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

    doneTasks.sort((a, b) => {
      // Sort by completion date if available, otherwise creation date
      const dateA = a.completedAt
        ? new Date(a.completedAt).getTime()
        : new Date(a.createdAt).getTime();
      const dateB = b.completedAt
        ? new Date(b.completedAt).getTime()
        : new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    setTasks(activeTasks);
    setCompletedTasks(doneTasks);

    // Extract unique activities from all tasks AND goals
    const activities = new Set<string>();

    // Add activities from tasks
    allTasks.forEach((task) => {
      if (task.activity) {
        activities.add(task.activity);
      }
    });

    // Also add activities from goals
    allGoals.forEach((goal) => {
      if (goal.activity) {
        activities.add(goal.activity);
      }
    });

    // Combine with default activities
    defaultActivityCategories.forEach((activity) => activities.add(activity));
    setAvailableActivities(Array.from(activities));
  };

  useEffect(() => {
    loadData();
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
              activity={activityFilter !== 'all' ? activityFilter : undefined}
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
                    {activityFilter !== 'all' ? `for ${activityFilter}` : ''}
                  </h3>
                  <p>
                    Create your first productivity goal to start tracking your
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
