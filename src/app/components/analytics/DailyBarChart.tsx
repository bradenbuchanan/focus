// src/app/components/analytics/DailyBarChart.tsx
'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useState, useEffect } from 'react';
import { TimerSession, getSessions } from '@/lib/timer';
import styles from './analytics.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Define timeframe options
type TimeFrame = '7d' | '30d' | '90d' | '6m' | '1y';

export default function DailyBarChart() {
  const [timeframe, setTimeframe] = useState<TimeFrame>('7d');
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [
      {
        label: 'Minutes',
        data: [] as number[],
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
      },
    ],
  });

  useEffect(() => {
    const sessions = getSessions();
    const focusSessions = sessions.filter((s) => s.type === 'focus');

    // Determine date range based on timeframe
    const now = new Date();
    let daysToShow: number;
    let labelFormat: 'day' | 'week' | 'month' = 'day';

    switch (timeframe) {
      case '30d':
        daysToShow = 30;
        break;
      case '90d':
        daysToShow = 90;
        labelFormat = 'week';
        break;
      case '6m':
        daysToShow = 180;
        labelFormat = 'month';
        break;
      case '1y':
        daysToShow = 365;
        labelFormat = 'month';
        break;
      default: // '7d'
        daysToShow = 7;
        break;
    }

    // Create appropriate date bins based on timeframe
    const days: string[] = [];
    const dailyMinutes: number[] = [];

    if (labelFormat === 'day') {
      // Daily view for 7d and 30d
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        const dateString = date.toISOString().split('T')[0];

        // Format label - MM-DD for shorter timeframes
        const displayDate = new Date(dateString);
        const month = displayDate.getMonth() + 1;
        const day = displayDate.getDate();
        days.push(`${month}/${day}`);

        // Calculate minutes for this day
        const dayMinutes = focusSessions
          .filter(
            (s) => s.date.startsWith(dateString) || s.localDate === dateString
          )
          .reduce((total, session) => total + session.duration / 60, 0);

        dailyMinutes.push(Math.round(dayMinutes));
      }
    } else if (labelFormat === 'week') {
      // Weekly view for 90d
      const numWeeks = Math.ceil(daysToShow / 7);

      for (let i = numWeeks - 1; i >= 0; i--) {
        const weekEndDate = new Date();
        weekEndDate.setDate(now.getDate() - i * 7);
        const weekStartDate = new Date(weekEndDate);
        weekStartDate.setDate(weekEndDate.getDate() - 6);

        // Format: "M/D-M/D"
        const startMonth = weekStartDate.getMonth() + 1;
        const startDay = weekStartDate.getDate();
        const endMonth = weekEndDate.getMonth() + 1;
        const endDay = weekEndDate.getDate();
        days.push(`${startMonth}/${startDay}-${endMonth}/${endDay}`);

        let weeklyMinutes = 0;

        // Sum up minutes for each day in this week
        for (let j = 0; j < 7; j++) {
          const date = new Date(weekStartDate);
          date.setDate(weekStartDate.getDate() + j);
          const dateString = date.toISOString().split('T')[0];

          const dayMinutes = focusSessions
            .filter(
              (s) => s.date.startsWith(dateString) || s.localDate === dateString
            )
            .reduce((total, session) => total + session.duration / 60, 0);

          weeklyMinutes += dayMinutes;
        }

        dailyMinutes.push(Math.round(weeklyMinutes));
      }
    } else if (labelFormat === 'month') {
      // Monthly view for 6m and 1y
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];

      const numMonths = timeframe === '6m' ? 6 : 12;

      for (let i = numMonths - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(1); // First day of month
        date.setMonth(now.getMonth() - i);

        const monthName = monthNames[date.getMonth()];
        days.push(monthName);

        // Get first and last day of month
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        let monthlyMinutes = 0;

        // Filter sessions in this month
        const monthSessions = focusSessions.filter((s) => {
          const sessionDate = new Date(s.date);
          return sessionDate >= firstDay && sessionDate <= lastDay;
        });

        monthlyMinutes = monthSessions.reduce(
          (total, session) => total + session.duration / 60,
          0
        );

        dailyMinutes.push(Math.round(monthlyMinutes));
      }
    }

    setChartData({
      labels: days,
      datasets: [
        {
          label: 'Focus Minutes',
          data: dailyMinutes,
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
        },
      ],
    });
  }, [timeframe]); // Re-run when timeframe changes

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: getChartTitle(timeframe),
      },
    },
  };

  // Helper to get chart title based on timeframe
  function getChartTitle(timeframe: TimeFrame): string {
    switch (timeframe) {
      case '7d':
        return 'Daily Focus Time (Past 7 Days)';
      case '30d':
        return 'Daily Focus Time (Past 30 Days)';
      case '90d':
        return 'Weekly Focus Time (Past 90 Days)';
      case '6m':
        return 'Monthly Focus Time (Past 6 Months)';
      case '1y':
        return 'Monthly Focus Time (Past Year)';
      default:
        return 'Focus Time';
    }
  }

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartControls}>
        <div className={styles.timeframeSelector}>
          <button
            className={`${styles.timeframeButton} ${
              timeframe === '7d' ? styles.active : ''
            }`}
            onClick={() => setTimeframe('7d')}
          >
            7 Days
          </button>
          <button
            className={`${styles.timeframeButton} ${
              timeframe === '30d' ? styles.active : ''
            }`}
            onClick={() => setTimeframe('30d')}
          >
            30 Days
          </button>
          <button
            className={`${styles.timeframeButton} ${
              timeframe === '90d' ? styles.active : ''
            }`}
            onClick={() => setTimeframe('90d')}
          >
            90 Days
          </button>
          <button
            className={`${styles.timeframeButton} ${
              timeframe === '6m' ? styles.active : ''
            }`}
            onClick={() => setTimeframe('6m')}
          >
            6 Months
          </button>
          <button
            className={`${styles.timeframeButton} ${
              timeframe === '1y' ? styles.active : ''
            }`}
            onClick={() => setTimeframe('1y')}
          >
            1 Year
          </button>
        </div>
      </div>
      <Bar options={options} data={chartData} />
    </div>
  );
}
