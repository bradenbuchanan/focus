// src/app/components/goals/GoalCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { Goal, TimerSession, calculateGoalProgress } from '@/lib/timer';
import { GoalCard as UnifiedGoalCard } from '../../components/ui/GoalCard';
import { TaskList } from '../../components/ui/TaskList';
import GoalEditForm from './GoalEditForm';
import { useData } from '@/providers/DataProvider';

interface GoalCardProps {
  goal: Goal;
  onDelete: () => void;
  onEdit: () => void;
}

export default function GoalCard({ goal, onDelete, onEdit }: GoalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
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

  // Calculate progress with loaded sessions
  const progress =
    sessions.length > 0
      ? calculateGoalProgress(goal, sessions)
      : { current: 0, percentage: 0 };

  if (isEditing) {
    return (
      <GoalEditForm
        goal={goal}
        onCancel={() => setIsEditing(false)}
        onSave={() => {
          setIsEditing(false);
          onEdit();
        }}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      <UnifiedGoalCard
        goal={goal}
        progress={progress}
        onEdit={() => setIsEditing(true)}
        onDelete={onDelete}
        onGoalClick={() => setShowTasks(!showTasks)}
      />

      {showTasks && (
        <div
          className="card card--compact animate-slide-up transition-all"
          style={{ marginTop: '1rem' }}
        >
          <div className="card__header">
            <h4 className="card__title">Tasks for this goal:</h4>
          </div>
          <div className="card__body">
            <TaskList tasks={[]} isCompact={true} />
          </div>
        </div>
      )}
    </div>
  );
}
