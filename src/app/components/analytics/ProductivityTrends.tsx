// src/app/components/analytics/ProductivityTrends.tsx
'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useState, useEffect } from 'react';
import { TimerSession, getSessions } from '@/lib/timer';
import styles from './analytics.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Define timeframe options
type TimeFrame = '4w' | '3m' | '6m' | '1y';

export default function ProductivityTrends() {
  const [timeframe, setTimeframe] = useState<TimeFrame>('4w');
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [
      {
        label: 'Average Session Length (min)',
        data: [] as number[],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Number of Sessions',
        data: [] as number[],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  });

  useEffect(() => {
    const sessions = getSessions();
    const focusSessions = sessions.filter((s) => s.type === 'focus');

    // Configure based on timeframe
    let periodCount: number;
    let periodName: string;
    let daysPerPeriod: number;

    switch (timeframe) {
      case '3m':
        periodCount = 12; // 12 weeks
        periodName = 'Week';
        daysPerPeriod = 7;
        break;
      case '6m':
        periodCount = 6; // 6 months
        periodName = 'Month';
        daysPerPeriod = 30;
        break;
      case '1y':
        periodCount = 12; // 12 months
        periodName = 'Month';
        daysPerPeriod = 30;
        break;
      default: // '4w'
        periodCount = 4; // 4 weeks
        periodName = 'Week';
        daysPerPeriod = 7;
        break;
    }

    const now = new Date();
    const periods: string[] = [];
    const avgSessionLengths: number[] = [];
    const sessionsPerPeriod: number[] = [];

    for (let i = periodCount - 1; i >= 0; i--) {
      const startDate = new Date();
      const periodOffset = i * daysPerPeriod;
      startDate.setDate(now.getDate() - (periodOffset + daysPerPeriod - 1));

      const endDate = new Date();
      endDate.setDate(now.getDate() - periodOffset);

      // Generate period label
      let periodLabel: string;

      if (periodName === 'Week') {
        periodLabel = `${periodName} ${periodCount - i}`;
      } else {
        // For months, use month names
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
        periodLabel = monthNames[endDate.getMonth()];
      }

      periods.push(periodLabel);

      // Filter sessions in this period
      const periodSessions = focusSessions.filter((s) => {
        // Use localDate if available
        const dateStr = s.localDate || s.date.split('T')[0];
        const sessionDate = new Date(dateStr);
        return sessionDate >= startDate && sessionDate <= endDate;
      });

      // Calculate average session length
      const totalMinutes = periodSessions.reduce(
        (total, session) => total + session.duration / 60,
        0
      );
      const avgLength = periodSessions.length
        ? Math.round(totalMinutes / periodSessions.length)
        : 0;

      avgSessionLengths.push(avgLength);
      sessionsPerPeriod.push(periodSessions.length);
    }

    setChartData({
      labels: periods,
      datasets: [
        {
          label: 'Average Session Length (min)',
          data: avgSessionLengths,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
        {
          label: 'Number of Sessions',
          data: sessionsPerPeriod,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
      ],
    });
  }, [timeframe]);

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

  function getChartTitle(timeframe: TimeFrame): string {
    switch (timeframe) {
      case '4w':
        return 'Productivity Trends (4 Weeks)';
      case '3m':
        return 'Productivity Trends (3 Months)';
      case '6m':
        return 'Productivity Trends (6 Months)';
      case '1y':
        return 'Productivity Trends (1 Year)';
      default:
        return 'Productivity Trends';
    }
  }

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartControls}>
        <div className={styles.timeframeSelector}>
          <button
            className={`${styles.timeframeButton} ${
              timeframe === '4w' ? styles.active : ''
            }`}
            onClick={() => setTimeframe('4w')}
          >
            4 Weeks
          </button>
          <button
            className={`${styles.timeframeButton} ${
              timeframe === '3m' ? styles.active : ''
            }`}
            onClick={() => setTimeframe('3m')}
          >
            3 Months
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
      <Line options={options} data={chartData} />
    </div>
  );
}
