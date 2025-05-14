// src/app/components/ui/GoalList.tsx
'use client';

import { useState, useEffect } from 'react';
import { Goal, TimerSession, calculateGoalProgress } from '@/lib/timer';
import { GoalCard } from './GoalCard';
import { useData } from '@/providers/DataProvider';
import styles from './GoalList.module.css';

interface GoalListProps {
  goals: Goal[];
  isCompact?: boolean;
  onGoalUpdate?: () => void;
  className?: string;
}

export function GoalList({
  goals,
  isCompact = false,
  onGoalUpdate,
  className = '',
}: GoalListProps) {
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const { getSessions } = useData();

  // Load sessions when component mounts
  useEffect(() => {
    async function loadSessions() {
      try {
        const dbSessions = await getSessions();
        // Convert database sessions to TimerSession format
        const timerSessions: TimerSession[] = dbSessions.map((s) => ({
          id: s.id,
          date: s.start_time,
          localDate: s.start_time.split('T')[0], // Extract date part
          duration: s.duration || 0,
          type: (s.category === 'focus' ? 'focus' : 'break') as
            | 'focus'
            | 'break',
          completed: s.completed,
          activity: s.activity || undefined,
        }));
        setSessions(timerSessions);
      } catch (error) {
        console.error('Error loading sessions:', error);
        setSessions([]);
      }
    }

    loadSessions();
  }, [getSessions]);

  if (goals.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.goalList} ${className}`}>
      {goals.map((goal) => {
        const progress =
          sessions.length > 0
            ? calculateGoalProgress(goal, sessions)
            : { current: 0, percentage: 0 };

        return (
          <GoalCard
            key={goal.id}
            goal={goal}
            progress={progress}
            isCompact={isCompact}
            showActions={!isCompact}
            onGoalClick={onGoalUpdate}
          />
        );
      })}
    </div>
  );
}
