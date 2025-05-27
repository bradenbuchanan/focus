// src/app/dashboard/components/DashboardStats.tsx
'use client';

import { formatTimeValue } from '@/utils/formatTime';

interface StatsProps {
  stats: {
    focusTimeToday: number;
    sessionsCompleted: number;
    currentStreak: number;
  };
}

export default function DashboardStats({ stats }: StatsProps) {
  return (
    <div className="card-grid card-grid--stats">
      <div className="card card--stats">
        <h3 className="stats-label">Today&apos;s Focus Time</h3>
        <p className="stats-value">{formatTimeValue(stats.focusTimeToday)}</p>
      </div>
      <div className="card card--stats">
        <h3 className="stats-label">Sessions Completed</h3>
        <p className="stats-value">{stats.sessionsCompleted}</p>
      </div>
      <div className="card card--stats">
        <h3 className="stats-label">Current Streak</h3>
        <p className="stats-value">{stats.currentStreak} days</p>
      </div>
    </div>
  );
}
