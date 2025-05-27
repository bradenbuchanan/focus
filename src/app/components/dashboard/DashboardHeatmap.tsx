// src/app/components/dashboard/DashboardHeatmap.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const { activityDataSets, isLoading, refreshData } = useMultiActivityData();

  const [selectedActivity, setSelectedActivity] =
    useState<string>('All Activities');
  const [currentActivityData, setCurrentActivityData] =
    useState<ActivityData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Event listeners setup remains the same
  useEffect(() => {
    const unsubscribeData = listenForDataUpdates(() => {
      console.log('Dashboard: Data update event received');
    });

    const unsubscribeSession = listenForSessionCompleted(() => {
      console.log('Dashboard: Session completed event received');
    });

    return () => {
      unsubscribeData();
      unsubscribeSession();
    };
  }, []);

  // Activity data handling remains the same
  useEffect(() => {
    if (!isLoading && activityDataSets.length > 0) {
      const selected =
        activityDataSets.find(
          (dataset: ActivityData) => dataset.name === selectedActivity
        ) || activityDataSets[0];
      setCurrentActivityData(selected);

      if (
        !selectedActivity &&
        activityDataSets.some((d: ActivityData) => d.name === 'All Activities')
      ) {
        setSelectedActivity('All Activities');
      }
    }
  }, [selectedActivity, activityDataSets, isLoading]);

  // Last updated time handling remains the same
  useEffect(() => {
    if (!isLoading) {
      setLastUpdated(new Date());
    }
  }, [activityDataSets, isLoading]);

  const handleRefresh = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  if (isLoading) {
    return (
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Recent Activity</h3>
        </div>
        <div className="card__body">
          <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.7 }}>
            Loading activity data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card__header">
        <h3 className="card__title">Recent Activity</h3>
        <div className="card__actions">
          <select
            className="form-select"
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            {activityDataSets.map((dataset: ActivityData) => (
              <option key={dataset.name} value={dataset.name}>
                {dataset.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn--secondary btn--compact"
            onClick={handleRefresh}
            title="Refresh data"
          >
            ↻ Refresh
          </button>
          <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {currentActivityData && (
        <div className="card__body">
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '1rem',
            }}
          >
            {currentActivityData.maxCount > 0 && (
              <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                Max: {currentActivityData.maxCount} min in a day
              </span>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <CalendarGrid
              calendarData={currentActivityData.data}
              colorScheme={currentActivityData.colorScheme}
            />
          </div>

          <div className="filter-container">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '0.5rem',
                backgroundColor: 'var(--gray-alpha-100)',
                borderRadius: '0.5rem',
                width: 'fit-content',
                margin: '0 auto',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  padding: '0 0.25rem',
                }}
              >
                Less
              </span>
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '2px',
                    border: '1px solid rgba(var(--gray-rgb), 0.1)',
                    backgroundColor:
                      currentActivityData.colorScheme.levels[level],
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                />
              ))}
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  padding: '0 0.25rem',
                }}
              >
                More
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
