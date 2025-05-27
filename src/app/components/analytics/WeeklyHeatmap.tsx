'use client';

import { useState, useEffect } from 'react';
import { useData } from '@/providers/DataProvider';
import { TimerSession } from '@/lib/timer';

export default function WeeklyHeatmap() {
  const [heatmapData, setHeatmapData] = useState<number[][]>(
    Array(7)
      .fill(0)
      .map(() => Array(24).fill(0))
  );

  const { getSessions } = useData();

  useEffect(() => {
    async function loadData() {
      try {
        const dbSessions = await getSessions();

        // Convert database sessions to TimerSession format
        const sessions = dbSessions.map((s) => ({
          id: s.id,
          date: s.start_time,
          localDate: s.start_time.split('T')[0],
          duration: s.duration || 0,
          type: (s.category === 'focus' ? 'focus' : 'break') as
            | 'focus'
            | 'break',
          completed: s.completed,
          activity: s.activity || undefined,
        }));

        // Filter for focus sessions
        const focusSessions = sessions.filter(
          (s: TimerSession) => s.type === 'focus'
        );

        // Initialize heatmap data (7 days × 24 hours)
        const heatmap = Array(7)
          .fill(0)
          .map(() => Array(24).fill(0));

        focusSessions.forEach((session: TimerSession) => {
          // Use localDate if available, otherwise fall back to ISO date
          const dateStr = session.localDate || session.date.split('T')[0];
          const date = new Date(dateStr);
          const day = date.getDay();
          const hour = date.getHours();

          // Add minutes to the appropriate cell
          heatmap[day][hour] += session.duration / 60;
        });

        setHeatmapData(heatmap);
      } catch (error) {
        console.error('Error loading heatmap data:', error);
      }
    }

    loadData();
  }, [getSessions]);

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
    <div className="card chart-container">
      <h3 className="card__title">Weekly Focus Pattern</h3>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-sm)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-muted)',
          }}
        >
          {days.map((day) => (
            <div key={day} style={{ width: '24px', textAlign: 'center' }}>
              {day}
            </div>
          ))}
        </div>
        <div className="calendar-grid">
          {heatmapData.map((dayData, dayIndex) => (
            <div key={dayIndex} className="calendar-row">
              {dayData.map((value, hourIndex) => (
                <div
                  key={`${dayIndex}-${hourIndex}`}
                  className="calendar-cell"
                  style={{ backgroundColor: getCellColor(value) }}
                  title={`${days[dayIndex]} ${hourIndex}:00 - ${value.toFixed(
                    1
                  )} min`}
                ></div>
              ))}
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: '300px',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-muted)',
          }}
        >
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
