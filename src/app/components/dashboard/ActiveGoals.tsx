// src/app/components/dashboard/ActiveGoals.tsx
'use client';

import Link from 'next/link';
import { GoalCard } from '../../components/ui/GoalCard';

interface GoalsProps {
  goals: Array<{
    goal: {
      id: string;
      title: string;
      type: 'time' | 'sessions'; // Change from string to union type
      period: 'daily' | 'weekly' | 'monthly' | 'yearly'; // Also update period to be more specific
      target: number;
      startDate: string;
      createdAt: string;
      activity?: string;
      description?: string;
    };
    progress: {
      current: number;
      percentage: number;
    };
  }>;
}

export default function ActiveGoals({ goals }: GoalsProps) {
  return (
    <section className="card card--compact">
      <div className="card__header">
        <h2 className="card__title">Active Goals</h2>
      </div>
      <div className="card-grid card-grid--compact">
        {goals.map(({ goal, progress }) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            progress={progress}
            isCompact={true}
            showActions={false}
          />
        ))}
        <Link
          href="/goals"
          className="card card--interactive hover-lift transition-all"
        >
          <div className="card__body">View All Goals</div>
        </Link>
      </div>
    </section>
  );
}
