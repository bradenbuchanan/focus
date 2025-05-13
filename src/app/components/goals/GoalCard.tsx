// src/app/components/goals/GoalCard.tsx
'use client';

import { useState } from 'react';
import { Goal, calculateGoalProgress } from '@/lib/timer';
import { GoalCard as UnifiedGoalCard } from '../../components/ui/GoalCard';
import { TaskList } from '../../components/ui/TaskList';
import GoalEditForm from './GoalEditForm';

interface GoalCardProps {
  goal: Goal;
  onDelete: () => void;
  onEdit: () => void;
}

export default function GoalCard({ goal, onDelete, onEdit }: GoalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const progress = calculateGoalProgress(goal);

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
    <>
      <UnifiedGoalCard
        goal={goal}
        progress={progress}
        onEdit={() => setIsEditing(true)}
        onDelete={onDelete}
        onGoalClick={() => setShowTasks(!showTasks)}
      />

      {showTasks && <TaskList goalId={goal.id} className="mt-4" />}
    </>
  );
}
