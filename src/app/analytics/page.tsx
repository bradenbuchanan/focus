// src/app/analytics/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import styles from './analytics.module.css';
import cardStyles from '@/app/styles/shared/cards.module.css';
import WeeklySummaryCard from '@/app/components/analytics/WeeklySummaryCard';

// Import custom hook
import { useAnalyticsSummary } from '@/hooks/useAnalyticsSummary';

// Import components
import SummaryCard from '@/app/components/analytics/SummaryCard';
import CalendarSection from '@/app/components/analytics/CalendarSection';
import FocusDistributionSection from '../../app/components/analytics/FocusDistributionSection';
import ProductivityPatternsSection from '../../app/components/analytics/ProductivityPatternsSection';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const summary = useAnalyticsSummary();

  return (
    <div className={styles.analyticsPage}>
      <h1>Analytics & Insights</h1>
      <p>Detailed breakdown of your focus habits and productivity patterns.</p>

      {user && <WeeklySummaryCard />}

      <div className={styles.statsSection}>
        <SummaryCard summary={summary} />
      </div>

      <div className={styles.chartGrid}>
        <CalendarSection />
        <FocusDistributionSection />
        <ProductivityPatternsSection />
      </div>
    </div>
  );
}
