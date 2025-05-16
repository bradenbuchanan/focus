// src/app/dashboard/page.tsx
'use client';

import ProtectedRoute from '../components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import styles from './dashboard.module.css';
import DashboardStats from '../components/dashboard/DashboardStats';
import WeeklyFocusChart from '../components/dashboard/WeeklyFocusChart';
import DashboardHeatmap from '../components/dashboard/DashboardHeatmap';
import TopActivities from '../components/dashboard/TopActivities';
import DashboardActions from '../components/dashboard/DashboardActions';
import PriorityFocus from '../components/dashboard/PriorityFocus';
import { useDashboardData } from './hooks/useDashboardData';
import buttonStyles from '@/app/styles/shared/buttons.module.css';

export default function Dashboard() {
  const { user } = useAuth();
  const { stats } = useDashboardData();

  return (
    <ProtectedRoute>
      <div className={styles.dashboard}>
        <h1>Dashboard</h1>

        <p>
          Welcome back, {user?.user_metadata?.name || 'User'}! Here&apos;s an
          overview of your focus activity.
        </p>

        {/* Add the Priority Focus component here */}
        <PriorityFocus />

        <DashboardStats stats={stats} />

        <DashboardHeatmap />

        <div className={styles.chartsPreview}>
          <WeeklyFocusChart weeklyData={stats.weeklyData} />
          <TopActivities activities={stats.topActivities} />
        </div>

        <DashboardActions />
      </div>
    </ProtectedRoute>
  );
}
