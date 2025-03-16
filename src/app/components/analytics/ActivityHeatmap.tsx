// Updated ActivityCalendar.tsx
'use client';

import { useState, useEffect } from 'react';
import { TimerSession, getSessions, getLocalDateString } from '@/lib/timer';
import styles from './analytics.module.css';

type CalendarDay = {
  date: string;
  count: number;
  intensity: number;
};

export default function ActivityCalendar() {
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [maxCount, setMaxCount] = useState(0);

  useEffect(() => {
    const sessions = getSessions();
    const focusSessions = sessions.filter((s) => s.type === 'focus');

    // Create a date map for the last year (365 days)
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setDate(today.getDate() - 365);

    const dateMap = new Map<string, number>();

    // Initialize all dates in the past year with 0
    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = getLocalDateString(d);
      dateMap.set(dateStr, 0);
    }

    // Populate with actual data
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
    const dataArray: CalendarDay[] = [];
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

    setMaxCount(max);
    setCalendarData(dataArray);
  }, []);

  const getCellColor = (intensity: number) => {
    switch (intensity) {
      case 0:
        return 'var(--gray-alpha-100)';
      case 1:
        return 'rgba(0, 136, 204, 0.25)';
      case 2:
        return 'rgba(0, 136, 204, 0.5)';
      case 3:
        return 'rgba(0, 136, 204, 0.75)';
      case 4:
        return 'rgba(0, 136, 204, 1)';
      default:
        return 'var(--gray-alpha-100)';
    }
  };

  // Generate weeks for the calendar grid
  const generateWeeks = () => {
    // Sort data by date
    const sortedData = [...calendarData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group by weeks
    const weeks: { [key: string]: CalendarDay[] } = {};

    sortedData.forEach((day) => {
      const date = new Date(day.date);
      // Get week number (using the date as a unique identifier)
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().slice(0, 10);

      if (!weeks[weekKey]) {
        weeks[weekKey] = Array(7).fill(null);
      }

      // Set the day in the correct position (0-6)
      weeks[weekKey][date.getDay()] = day;
    });

    // Convert to array and fill null spots with empty days
    return Object.entries(weeks).map(([weekKey, days]) => {
      return days.map((day, index) => {
        if (day === null) {
          // Create an empty day for this position
          const weekStart = new Date(weekKey);
          const emptyDate = new Date(weekStart);
          emptyDate.setDate(weekStart.getDate() + index);
          return {
            date: emptyDate.toISOString().slice(0, 10),
            count: 0,
            intensity: 0,
          };
        }
        return day;
      });
    });
  };

  // Extract months for the calendar header
  const getMonthLabels = () => {
    const sortedData = [...calendarData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (sortedData.length === 0) return [];

    const weeks = generateWeeks();
    const months: { name: string; position: number }[] = [];
    let currentMonth = -1;

    // Go through week by week
    weeks.forEach((week, weekIndex) => {
      // Check the Sunday (first day) of each week
      if (week[0]) {
        const date = new Date(week[0].date);
        const month = date.getMonth();

        // If this is a new month, add it to the list
        if (month !== currentMonth) {
          months.push({
            name: date.toLocaleString('default', { month: 'short' }),
            position: weekIndex, // Position is the week index
          });
          currentMonth = month;
        }
      }
    });

    return months;
  };

  // Render the calendar grid
  const renderCalendar = () => {
    const weeks = generateWeeks();
    const monthLabels = getMonthLabels();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className={styles.githubCalendar}>
        {/* Month labels at the top */}
        <div className={styles.monthLabelsRow}>
          {monthLabels.map((month, index) => (
            <div
              key={index}
              className={styles.monthLabel}
              style={{
                left: `${month.position * 15}px`, // Adjust based on cell width + gap
              }}
            >
              {month.name}
            </div>
          ))}
        </div>

        <div className={styles.calendarBody}>
          {/* Day labels on the left */}
          <div className={styles.dayLabels}>
            {/* Only show every other day to save space */}
            {days
              .filter((_, i) => i % 2 !== 0)
              .map((day) => (
                <div key={day} className={styles.dayLabel}>
                  {day}
                </div>
              ))}
          </div>

          {/* Main calendar grid */}
          <div className={styles.calendarGrid}>
            {/* For each day of the week */}
            {Array.from({ length: 7 }).map((_, dayIndex) => (
              <div key={dayIndex} className={styles.calendarRow}>
                {/* For each week */}
                {weeks.map((week, weekIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={styles.calendarCell}
                    style={{
                      backgroundColor: getCellColor(
                        week[dayIndex]?.intensity || 0
                      ),
                    }}
                    title={
                      week[dayIndex]
                        ? `${week[dayIndex].date}: ${week[dayIndex].count} minutes`
                        : 'No data'
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.calendarLegend}>
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
  };

  return (
    <div className={styles.calendarContainer}>
      <h3>Activity Calendar</h3>
      <div className={styles.calendarDescription}>
        Your focus activity over the past year
      </div>

      {renderCalendar()}
    </div>
  );
}
