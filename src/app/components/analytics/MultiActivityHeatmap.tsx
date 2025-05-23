// src/components/analytics/MultiActivityHeatmap.tsx
'use client';

import styles from './analytics.module.css';
import cardStyles from '@/app/styles/shared/cards.module.css';
import { useMultiActivityData } from '@/hooks/useActivityCalendarData';
import { CalendarGrid } from './CalendarGrid';

export default function MultiActivityHeatmap() {
  const { activityDataSets, isLoading } = useMultiActivityData();

  if (isLoading) {
    return (
      <div className={styles.loadingIndicator}>Loading activity data...</div>
    );
  }
  return (
    <div className={styles.multiCalendarContainer}>
      {activityDataSets.map((activityData) => (
        <div
          key={activityData.name}
          className={`${cardStyles.card} ${styles.activityHeatmapSection}`}
        >
          <div className={styles.activityTitle}>
            <h3 style={{ color: activityData.colorScheme.base }}>
              {activityData.name}
            </h3>
            {activityData.maxCount > 0 && (
              <span className={styles.maxTimeLabel}>
                Max: {activityData.maxCount} min in a day
              </span>
            )}
          </div>

          <div className={styles.calendarContainer}>
            <CalendarGrid
              calendarData={activityData.data}
              colorScheme={activityData.colorScheme}
            />
          </div>

          <div className={styles.calendarLegend}>
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={styles.legendCell}
                style={{
                  backgroundColor: activityData.colorScheme.levels[level],
                }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      ))}
    </div>
  );
}
