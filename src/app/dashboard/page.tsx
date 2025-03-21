// src/app/dashboard/page.tsx
'use client';

import ProtectedRoute from '../components/auth/ProtectedRoute';
import { useSession } from 'next-auth/react';
import styles from './dashboard.module.css';
import DashboardStats from '../components/dashboard/DashboardStats';
import WeeklyFocusChart from '../components/dashboard/WeeklyFocusChart';
import DashboardHeatmap from '../components/dashboard/DashboardHeatmap';
import TopActivities from '../components/dashboard/TopActivities';
import ActiveGoals from '../components/dashboard/ActiveGoals';
import DashboardActions from '../components/dashboard/DashboardActions';
import WeeklySummaryCard from '../components/analytics/WeeklySummaryCard';
import { useDashboardData } from './hooks/useDashboardData';

export default function Dashboard() {
  const { data: session } = useSession();
  const { stats, activeGoals } = useDashboardData();

  return (
    <ProtectedRoute>
      <div className={styles.dashboard}>
        <h1>Dashboard</h1>

        <p>
          Welcome back, {session?.user?.name || 'User'}! Here's an overview of
          your focus activity.
        </p>

        {/* Add Weekly Summary Card */}
        {session?.user?.id && <WeeklySummaryCard userId={session.user.id} />}

        <DashboardStats stats={stats} />

        <DashboardHeatmap />

        <div className={styles.chartsPreview}>
          <WeeklyFocusChart weeklyData={stats.weeklyData} />
          <TopActivities activities={stats.topActivities} />
        </div>

        {activeGoals.length > 0 && <ActiveGoals goals={activeGoals} />}

        <DashboardActions />
      </div>
    </ProtectedRoute>
  );
}
