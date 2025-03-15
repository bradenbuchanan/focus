'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Goal, getGoals } from '@/lib/timer';
import GoalCard from '@/app/components/goals/GoalCard';
import GoalForm from '@/app/components/goals/GoalForm';
import styles from './goals.module.css';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Load goals
  const loadGoals = () => {
    const allGoals = getGoals();
    setGoals(allGoals);
  };

  useEffect(() => {
    loadGoals();
  }, []);

  return (
    <div className={styles.goalsPage}>
      <div className={styles.goalsHeader}>
        <div>
          <h1>Focus Goals</h1>
          <p>Set and track your productivity goals</p>
        </div>
        <button
          className={styles.createButton}
          onClick={() => setShowForm(true)}
        >
          Create New Goal
        </button>
      </div>

      {showForm ? (
        <GoalForm
          onSave={() => {
            loadGoals();
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <>
          {goals.length > 0 ? (
            <div className={styles.goalsList}>
              {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} onDelete={loadGoals} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <h3>No goals set yet</h3>
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

      <div className={styles.timerLink}>
        <Link href="/timer" className={styles.secondaryButton}>
          Back to Timer
        </Link>
      </div>
    </div>
  );
}
