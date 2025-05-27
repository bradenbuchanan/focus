// src/components/analytics/MultiActivityHeatmap.tsx
'use client';

import { useMultiActivityData } from '@/hooks/useActivityCalendarData';
import { CalendarGrid } from './CalendarGrid';

export default function MultiActivityHeatmap() {
  const { activityDataSets, isLoading } = useMultiActivityData();

  if (isLoading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem', opacity: '0.7' }}>
          Loading activity data...
        </div>
      </div>
    );
  }

  return (
    <div>
      {activityDataSets.map((activityData) => (
        <div key={activityData.name} className="card card--compact">
          <div className="card__header">
            <h3
              className="card__title"
              style={{ color: activityData.colorScheme.base }}
            >
              {activityData.name}
            </h3>
            {activityData.maxCount > 0 && (
              <span style={{ fontSize: '0.85rem', opacity: '0.7' }}>
                Max: {activityData.maxCount} min in a day
              </span>
            )}
          </div>

          <div className="card__body">
            <CalendarGrid
              calendarData={activityData.data}
              colorScheme={activityData.colorScheme}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              marginTop: '16px',
              fontSize: '0.75rem',
            }}
          >
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                style={{
                  width: '13px',
                  height: '13px',
                  borderRadius: '2px',
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
