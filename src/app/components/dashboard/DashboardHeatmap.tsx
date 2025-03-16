// src/app/components/dashboard/DashboardHeatmap.tsx
'use client';

import { useState, useEffect } from 'react';
import { getSessions, getLocalDateString } from '@/lib/timer';
import styles from './dashboardHeatmap.module.css';

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
      const dateStr = getLocalDateString(d);
      dateMap.set(dateStr, 0);
    }

    // Populate with actual data
    focusSessions.forEach((session) => {
      const dateStr =
        session.localDate || getLocalDateString(new Date(session.date));
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

  // Group data by weeks for the grid layout
  const renderCalendarHeatmap = () => {
    // Sort data by date
    const sortedData = [...heatmapData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group by weeks
    const weeks: HeatmapDay[][] = [];
    let currentWeek: HeatmapDay[] = [];

    sortedData.forEach((day) => {
      const date = new Date(day.date);

      // If this is the first day or a Sunday, start a new week
      if (currentWeek.length === 0 || date.getDay() === 0) {
        if (currentWeek.length > 0) {
          // If we have a partial week, pad it with empty days
          while (currentWeek.length < 7) {
            currentWeek.push({
              date: '',
              count: 0,
              intensity: 0,
            });
          }
          weeks.push(currentWeek);
        }
        currentWeek = [];
      }

      // Add the day to the current week
      currentWeek.push(day);
    });

    // Add the last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: '',
          count: 0,
          intensity: 0,
        });
      }
      weeks.push(currentWeek);
    }

    // Get the months for the header
    const months: { name: string; startWeek: number }[] = [];
    let currentMonth = -1;

    weeks.forEach((week, weekIndex) => {
      // Check the first valid day in the week
      for (const day of week) {
        if (day.date) {
          const date = new Date(day.date);
          const month = date.getMonth();

          if (month !== currentMonth) {
            months.push({
              name: date.toLocaleDateString('default', { month: 'short' }),
              startWeek: weekIndex,
            });
            currentMonth = month;
          }
          break;
        }
      }
    });

    // Days of the week labels
    const dayLabels = ['Sun', 'Tue', 'Thu', 'Sat'];

    return (
      <div className={styles.calendarHeatmapWrapper}>
        {/* Month labels at the top */}
        <div className={styles.monthLabelsRow}>
          {months.map((month, index) => (
            <div
              key={index}
              className={styles.monthLabel}
              style={{
                left: `${month.startWeek * 20 + 30}px`, // Adjust based on cell width
              }}
            >
              {month.name}
            </div>
          ))}
        </div>

        <div className={styles.calendarGrid}>
          {/* Day labels on the left */}
          <div className={styles.dayLabelsColumn}>
            {dayLabels.map((day) => (
              <div key={day} className={styles.dayLabel}>
                {day}
              </div>
            ))}
          </div>

          {/* The grid of days */}
          <div className={styles.weekRows}>
            {Array.from({ length: 7 }).map((_, dayOfWeek) => (
              <div key={dayOfWeek} className={styles.dayRow}>
                {weeks.map((week, weekIndex) => (
                  <div
                    key={`${weekIndex}-${dayOfWeek}`}
                    className={styles.dayCell}
                    style={{
                      backgroundColor: getCellColor(
                        week[dayOfWeek]?.intensity || 0
                      ),
                    }}
                    title={
                      week[dayOfWeek]?.date
                        ? `${week[dayOfWeek].date}: ${week[dayOfWeek].count} minutes`
                        : 'No data'
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.heatmapCard}>
      <h3>Recent Activity</h3>
      <div className={styles.heatmapWrapper}>{renderCalendarHeatmap()}</div>
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
