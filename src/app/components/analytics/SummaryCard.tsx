// src/app/components/analytics/SummaryCard.tsx
import { AnalyticsSummary } from '@/hooks/useAnalyticsSummary';
import { formatTimeValue } from '@/utils/formatTime';
import styles from '../../analytics/analytics.module.css';
import cardStyles from '@/app/styles/shared/cards.module.css';

interface SummaryCardProps {
  summary: AnalyticsSummary;
}

export default function SummaryCard({ summary }: SummaryCardProps) {
  return (
    <div className={`${cardStyles.card} ${styles.summaryCard}`}>
      <h2 className={`${cardStyles.cardTitle} ${styles.summaryTitle}`}>
        Performance Summary
      </h2>
      <ul className={styles.summaryList}>
        <li className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Focus Time</span>
          <span className={styles.summaryValue}>
            {formatTimeValue(summary.totalFocusTime)}
          </span>
        </li>
        <li className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Completed Sessions</span>
          <span className={styles.summaryValue}>{summary.totalSessions}</span>
        </li>
        <li className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Average Session</span>
          <span className={styles.summaryValue}>
            {formatTimeValue(summary.avgSessionLength)}
          </span>
        </li>
        <li className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Favorite Activity</span>
          <span className={styles.summaryValue}>
            {summary.favoriteActivity || 'N/A'}
          </span>
        </li>
        <li className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Most Productive Day</span>
          <span className={styles.summaryValue}>
            {summary.mostProductiveDay || 'N/A'}
          </span>
        </li>
        <li className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Peak Productivity Hour</span>
          <span className={styles.summaryValue}>
            {summary.mostProductiveHour !== undefined
              ? `${summary.mostProductiveHour}:00`
              : 'N/A'}
          </span>
        </li>
        <li className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Session Completion Rate</span>
          <span className={styles.summaryValue}>{summary.completionRate}%</span>
        </li>
      </ul>
    </div>
  );
}
