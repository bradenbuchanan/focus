// src/app/components/analytics/ProductivityPatternsSection.tsx
import ProductivityTrends from './ProductivityTrends';
import ActivityPieChart from './ActivityPieChart';
import styles from '../../analytics/analytics.module.css';

export default function ProductivityPatternsSection() {
  return (
    <div className={styles.chartSection}>
      <h3 className={styles.sectionTitle}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
        </svg>
        Productivity Patterns
      </h3>
      <div className={styles.analyticsGrid}>
        <ProductivityTrends />
        <ActivityPieChart />
      </div>
    </div>
  );
}
