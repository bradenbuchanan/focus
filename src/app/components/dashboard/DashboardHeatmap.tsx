// src/app/components/dashboard/DashboardHeatmap.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './dashboardHeatmap.module.css';
import {
  ActivityData,
  useMultiActivityData,
} from '@/hooks/useActivityCalendarData';
import { CalendarGrid } from '../analytics/CalendarGrid';
import {
  listenForDataUpdates,
  listenForSessionCompleted,
} from '@/utils/events';

export default function DashboardHeatmap() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { activityDataSets, isLoading, refreshData } =
    useMultiActivityData(refreshKey);

  const [selectedActivity, setSelectedActivity] =
    useState<string>('All Activities');
  const [currentActivityData, setCurrentActivityData] =
    useState<ActivityData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Set up event listeners for refresh
  useEffect(() => {
    const unsubscribeData = listenForDataUpdates(() => {
      console.log('Dashboard: Data update event received');
      setRefreshKey((prev) => prev + 1);
    });

    const unsubscribeSession = listenForSessionCompleted(() => {
      console.log('Dashboard: Session completed event received');
      setRefreshKey((prev) => prev + 1);
    });

    return () => {
      unsubscribeData();
      unsubscribeSession();
    };
  }, []);

  // Update current activity data when selection changes
  useEffect(() => {
    if (!isLoading && activityDataSets.length > 0) {
      const selected =
        activityDataSets.find(
          (dataset: ActivityData) => dataset.name === selectedActivity
        ) || activityDataSets[0];
      setCurrentActivityData(selected);

      // Default to "All Activities" if available
      if (
        !selectedActivity &&
        activityDataSets.some((d: ActivityData) => d.name === 'All Activities')
      ) {
        setSelectedActivity('All Activities');
      }
    }
  }, [selectedActivity, activityDataSets, isLoading]);

  // Update last updated time when data changes
  useEffect(() => {
    if (!isLoading) {
      setLastUpdated(new Date());
    }
  }, [activityDataSets, isLoading]);

  // Add manual refresh button
  const handleRefresh = useCallback(async () => {
    await refreshData();
    setRefreshKey((prev) => prev + 1);
  }, [refreshData]);

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
            {activityDataSets.map((dataset: ActivityData) => (
              <option key={dataset.name} value={dataset.name}>
                {dataset.name}
              </option>
            ))}
          </select>
          <button
            className={styles.refreshButton}
            onClick={handleRefresh}
            title="Refresh data"
          >
            ↻ Refresh
          </button>
          <span className={styles.lastUpdated}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
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
