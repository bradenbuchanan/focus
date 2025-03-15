// src/app/components/analytics/WeeklyHeatmap.tsx
'use client';

import { useState, useEffect } from 'react';
import { TimerSession, getSessions } from '@/lib/timer';
import styles from './analytics.module.css';

export default function WeeklyHeatmap() {
  const [heatmapData, setHeatmapData] = useState<number[][]>(
    Array(7)
      .fill(0)
      .map(() => Array(24).fill(0))
  );

  useEffect(() => {
    const sessions = getSessions();
    const focusSessions = sessions.filter((s) => s.type === 'focus');

    // Initialize heatmap data (7 days × 24 hours)
    const heatmap = Array(7)
      .fill(0)
      .map(() => Array(24).fill(0));

    focusSessions.forEach((session) => {
      const date = new Date(session.date);
      const day = date.getDay(); // 0-6 (Sunday-Saturday)
      const hour = date.getHours(); // 0-23

      // Add minutes to the appropriate cell
      heatmap[day][hour] += session.duration / 60;
    });

    setHeatmapData(heatmap);
  }, []);

  // Day and hour labels
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Function to get cell color based on value
  const getCellColor = (value: number) => {
    if (value === 0) return 'var(--gray-alpha-100)';

    // Color intensity based on minutes (0-60+)
    const intensity = Math.min(1, value / 60);
    return `rgba(54, 162, 235, ${intensity})`;
  };

  return (
    <div className={styles.heatmapContainer}>
      <h3>Weekly Focus Pattern</h3>
      <div className={styles.heatmap}>
        <div className={styles.heatmapLabels}>
          {days.map((day) => (
            <div key={day} className={styles.dayLabel}>
              {day}
            </div>
          ))}
        </div>
        <div className={styles.heatmapGrid}>
          {heatmapData.map((dayData, dayIndex) => (
            <div key={dayIndex} className={styles.heatmapRow}>
              {dayData.map((value, hourIndex) => (
                <div
                  key={`${dayIndex}-${hourIndex}`}
                  className={styles.heatmapCell}
                  style={{ backgroundColor: getCellColor(value) }}
                  title={`${days[dayIndex]} ${hourIndex}:00 - ${value.toFixed(
                    1
                  )} min`}
                ></div>
              ))}
            </div>
          ))}
        </div>
        <div className={styles.hourLabels}>
          <div>12 AM</div>
          <div>6 AM</div>
          <div>12 PM</div>
          <div>6 PM</div>
          <div>12 AM</div>
        </div>
      </div>
    </div>
  );
}
