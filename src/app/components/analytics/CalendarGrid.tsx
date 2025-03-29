// src/components/analytics/CalendarGrid.tsx
import React from 'react';
import styles from './analytics.module.css';
import { CalendarDay } from '@/hooks/useActivityCalendarData';

interface CalendarGridProps {
  calendarData: CalendarDay[];
  colorScheme: {
    base: string;
    levels: string[];
  };
}

export function CalendarGrid({ calendarData, colorScheme }: CalendarGridProps) {
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
                    backgroundColor:
                      colorScheme.levels[week[dayIndex]?.intensity || 0],
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
    </div>
  );
}
