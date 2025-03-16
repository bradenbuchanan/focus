// src/app/dashboard/components/DashboardHeatmap.tsx
'use client';

import { useState, useEffect } from 'react';
import { getSessions } from '@/lib/timer';
import styles from '../../dashboard/dashboard.module.css';

type HeatmapDay = {
  date: string;
  count: number;
  intensity: number;
};

export default function DashboardHeatmap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([]);

  useEffect(() => {
    const sessions = getSessions();
    const focusSessions = sessions.filter((s) => s.type === 'focus');

    console.log('Dashboard - All sessions:', sessions);
    console.log('Dashboard - Focus sessions:', focusSessions);

    // Create a date map for recent days (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const dateMap = new Map<string, number>();

    // Initialize dates with 0
    for (
      let d = new Date(thirtyDaysAgo);
      d <= today;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, 0);
    }

    // Populate with actual data
    focusSessions.forEach((session) => {
      const dateStr = session.localDate || session.date.split('T')[0];
      if (dateMap.has(dateStr)) {
        const minutes = Math.round(session.duration / 60);
        dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + minutes);
      }
    });

    // Convert to array for rendering
    const dataArray: HeatmapDay[] = [];
    let max = 0;

    dateMap.forEach((count, date) => {
      if (count > max) max = count;
      dataArray.push({ date, count, intensity: 0 });
    });

    // Calculate intensity levels (0-4) for coloring
    dataArray.forEach((day) => {
      if (day.count === 0) {
        day.intensity = 0;
      } else if (day.count <= max * 0.25) {
        day.intensity = 1;
      } else if (day.count <= max * 0.5) {
        day.intensity = 2;
      } else if (day.count <= max * 0.75) {
        day.intensity = 3;
      } else {
        day.intensity = 4;
      }
    });

    setHeatmapData(dataArray);
  }, []);

  const getCellColor = (intensity: number) => {
    switch (intensity) {
      case 0:
        return 'var(--gray-alpha-100)';
      case 1:
        return 'rgba(54, 162, 235, 0.25)';
      case 2:
        return 'rgba(54, 162, 235, 0.5)';
      case 3:
        return 'rgba(54, 162, 235, 0.75)';
      case 4:
        return 'rgba(54, 162, 235, 1)';
      default:
        return 'var(--gray-alpha-100)';
    }
  };

  // Render a simplified heatmap for dashboard
  const renderHeatmap = () => {
    // Sort data by date
    const sortedData = [...heatmapData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return (
      <div className={styles.dashboardHeatmap}>
        {sortedData.map((day) => (
          <div
            key={day.date}
            className={styles.heatmapCell}
            style={{ backgroundColor: getCellColor(day.intensity) }}
            title={`${day.date}: ${day.count} minutes`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={styles.heatmapCard}>
      <h3>Recent Activity</h3>
      <div className={styles.heatmapWrapper}>{renderHeatmap()}</div>
      <div className={styles.heatmapLegend}>
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={styles.legendCell}
            style={{ backgroundColor: getCellColor(level) }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
