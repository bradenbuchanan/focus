// src/app/components/analytics/WeeklyPatternSection.tsx
import WeeklyHeatmap from './WeeklyHeatmap';
import styles from '../../analytics/analytics.module.css';

export default function WeeklyPatternSection() {
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
          <rect x="3" y="3" width="18" height="18" rx="2"></rect>
          <path d="M3 9h18"></path>
          <path d="M9 21V9"></path>
        </svg>
        Weekly Activity Pattern
      </h3>
      <WeeklyHeatmap />
    </div>
  );
}
