// src/app/components/dashboard/DashboardHeatmap.tsx
'use client';

import { useState, useEffect } from 'react';
import { getSessions } from '@/lib/timer';
import styles from './dashboardHeatmap.module.css';

type HeatmapDay = {
  date: string;
  count: number;
  intensity: number;
  dayOfWeek: number; // 0-6 for Sunday-Saturday
};

export default function DashboardHeatmap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([]);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Function to refresh data
  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    // Format date consistently
    const formatDateString = (date: Date): string => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(date.getDate()).padStart(2, '0')}`;
    };

    // Today at midnight local time
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayFormatted = formatDateString(today);
    console.log(
      'Heatmap Today:',
      todayFormatted,
      'Day of week:',
      today.getDay()
    );
    setCurrentDate(todayFormatted);

    // 30 days ago
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const sessions = getSessions();
    const focusSessions = sessions.filter((s) => s.type === 'focus');

    // Create date map with empty values
    const dateMap: Record<string, { count: number; dayOfWeek: number }> = {};

    // Initialize all dates in the range
    for (
      let d = new Date(thirtyDaysAgo);
      d <= today;
      d.setDate(d.getDate() + 1)
    ) {
      const dateString = formatDateString(d);
      dateMap[dateString] = { count: 0, dayOfWeek: d.getDay() };
    }

    // Add session data
    focusSessions.forEach((session) => {
      let dateString;
      if (session.localDate) {
        dateString = session.localDate;
      } else {
        const sessionDate = new Date(session.date);
        dateString = formatDateString(sessionDate);
      }

      if (dateMap[dateString]) {
        dateMap[dateString].count += Math.round(session.duration / 60);
      }
    });

    // Convert to array and calculate intensity
    const dataArray: HeatmapDay[] = [];
    let maxCount = 0;

    Object.entries(dateMap).forEach(([date, data]) => {
      if (data.count > maxCount) maxCount = data.count;

      dataArray.push({
        date,
        count: data.count,
        intensity: 0, // Will be calculated next
        dayOfWeek: data.dayOfWeek,
      });
    });

    // Calculate intensity levels
    dataArray.forEach((day) => {
      if (day.count === 0) {
        day.intensity = 0;
      } else if (day.count <= maxCount * 0.25) {
        day.intensity = 1;
      } else if (day.count <= maxCount * 0.5) {
        day.intensity = 2;
      } else if (day.count <= maxCount * 0.75) {
        day.intensity = 3;
      } else {
        day.intensity = 4;
      }
    });

    setHeatmapData(dataArray);
  }, [refreshTrigger]); // This makes it re-run when refreshTrigger changes

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshData();
    }, 30000);

    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Color intensity function
  const getCellColor = (intensity: number) => {
    switch (intensity) {
      case 0:
        return 'rgba(255, 255, 255, 0.1)';
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

  // Group by day of week and week
  const renderCalendar = () => {
    if (heatmapData.length === 0) return <div>Loading...</div>;

    // Sort by date
    const sortedData = [...heatmapData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group by week
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Create a 7×n grid (7 days per week)
    // First, organize by day of week
    const byDayOfWeek: HeatmapDay[][] = Array(7)
      .fill(null)
      .map(() => []);

    sortedData.forEach((day) => {
      byDayOfWeek[day.dayOfWeek].push(day);
    });

    // Make sure all arrays have the same length by adding empty days
    const maxWeeks = Math.max(...byDayOfWeek.map((days) => days.length));

    byDayOfWeek.forEach((dayArray) => {
      while (dayArray.length < maxWeeks) {
        dayArray.push({
          date: '',
          count: 0,
          intensity: 0,
          dayOfWeek: dayArray[0]?.dayOfWeek || 0,
        });
      }
    });

    // Find months for header
    const months: { name: string; position: number }[] = [];
    let currentMonth = -1;

    for (let week = 0; week < maxWeeks; week++) {
      // Use Sunday as reference for the week
      const weekDate = byDayOfWeek[0][week]?.date || '';
      if (!weekDate) continue;

      const date = new Date(weekDate);
      const month = date.getMonth();

      if (month !== currentMonth) {
        months.push({
          name: date.toLocaleString('default', { month: 'short' }),
          position: week,
        });
        currentMonth = month;
      }
    }

    return (
      <div className={styles.calendarHeatmapWrapper}>
        {/* Month labels */}
        <div className={styles.monthLabelsRow}>
          {months.map((month, i) => (
            <div
              key={i}
              className={styles.monthLabel}
              style={{ left: `${month.position * 20}px` }}
            >
              {month.name}
            </div>
          ))}
        </div>

        <div className={styles.calendarGrid}>
          {/* Day labels on left */}
          <div className={styles.dayLabelsColumn}>
            {dayNames.map(
              (day, i) =>
                i % 2 === 0 && (
                  <div key={day} className={styles.dayLabel}>
                    {day}
                  </div>
                )
            )}
          </div>

          {/* Day cells grid */}
          <div className={styles.weekRows}>
            {dayNames.map((day, dayIndex) => (
              <div key={day} className={styles.dayRow}>
                {byDayOfWeek[dayIndex].map((cell, weekIndex) => (
                  <div
                    key={`${dayIndex}-${weekIndex}`}
                    className={styles.dayCell}
                    style={{
                      backgroundColor: getCellColor(cell.intensity),
                      // Highlight today
                      border:
                        cell.date === currentDate
                          ? '2px solid white'
                          : undefined,
                    }}
                    title={
                      cell.date
                        ? `${day} ${cell.date}: ${cell.count} minutes`
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3>Recent Activity</h3>
        <button
          onClick={refreshData}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            padding: '4px 8px',
          }}
          title={`Last updated: ${lastUpdated.toLocaleTimeString()}`}
        >
          ↻ Refresh
        </button>
      </div>
      <div className={styles.heatmapWrapper}>{renderCalendar()}</div>
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
