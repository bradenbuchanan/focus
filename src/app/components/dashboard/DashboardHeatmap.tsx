// src/app/components/dashboard/DashboardHeatmap.tsx
'use client';

import { useState, useEffect } from 'react';
import styles from './dashboardHeatmap.module.css';
import {
  ActivityData,
  useMultiActivityData,
} from '@/hooks/useActivityCalendarData';
import { CalendarGrid } from '../analytics/CalendarGrid';

export default function DashboardHeatmap() {
  const { activityDataSets, isLoading } = useMultiActivityData();
  const [selectedActivity, setSelectedActivity] =
    useState<string>('All Activities');
  const [currentActivityData, setCurrentActivityData] =
    useState<ActivityData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Function to refresh data
  const refreshData = () => {
    setLastUpdated(new Date());
  };

  // Update current activity data when selection changes
  useEffect(() => {
    if (!isLoading && activityDataSets.length > 0) {
      const selected =
        activityDataSets.find((dataset) => dataset.name === selectedActivity) ||
        activityDataSets[0];
      setCurrentActivityData(selected);

      // Default to "All Activities" if available
      if (
        !selectedActivity &&
        activityDataSets.some((d) => d.name === 'All Activities')
      ) {
        setSelectedActivity('All Activities');
      }
    }
  }, [selectedActivity, activityDataSets, isLoading]);

  if (isLoading) {
    return (
      <div className={styles.heatmapCard}>
        <h3>Recent Activity</h3>
        <div className={styles.loadingIndicator}>Loading activity data...</div>
      </div>
    );
  }

  return (
    <div className={styles.heatmapCard}>
      <div className={styles.heatmapHeader}>
        <h3>Recent Activity</h3>
        <div className={styles.controlsRow}>
          <select
            className={styles.activitySelector}
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value)}
          >
            {activityDataSets.map((dataset) => (
              <option key={dataset.name} value={dataset.name}>
                {dataset.name}
              </option>
            ))}
          </select>
          <button
            onClick={refreshData}
            className={styles.refreshButton}
            title={`Last updated: ${lastUpdated.toLocaleTimeString()}`}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {currentActivityData && (
        <div className={styles.activityHeatmapSection}>
          <div className={styles.maxCountInfo}>
            {currentActivityData.maxCount > 0 && (
              <span className={styles.maxTimeLabel}>
                Max: {currentActivityData.maxCount} min in a day
              </span>
            )}
          </div>

          <div className={styles.heatmapWrapper}>
            <CalendarGrid
              calendarData={currentActivityData.data}
              colorScheme={currentActivityData.colorScheme}
            />
          </div>

          <div className={styles.heatmapLegend}>
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={styles.legendCell}
                style={{
                  backgroundColor:
                    currentActivityData.colorScheme.levels[level],
                }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      )}
    </div>
  );
}
