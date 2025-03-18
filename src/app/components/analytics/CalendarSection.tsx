// src/app/components/analytics/CalendarSection.tsx
import MultiActivityHeatmap from './MultiActivityHeatmap';
import styles from '../../analytics/analytics.module.css';

export default function CalendarSection() {
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
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        Activity Calendar
      </h3>
      <MultiActivityHeatmap />
    </div>
  );
}
