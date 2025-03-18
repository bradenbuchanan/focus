// src/app/components/analytics/FocusDistributionSection.tsx
import DailyBarChart from './DailyBarChart';
import styles from '../../analytics/analytics.module.css';

export default function FocusDistributionSection() {
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
          <path d="M12 20V10"></path>
          <path d="M18 20V4"></path>
          <path d="M6 20v-4"></path>
        </svg>
        Focus Time Distribution
      </h3>
      <DailyBarChart />
    </div>
  );
}
