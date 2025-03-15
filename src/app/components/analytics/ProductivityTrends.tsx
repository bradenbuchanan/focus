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

export default function ProductivityTrends() {
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

    // Group by week (last 4 weeks)
    const now = new Date();
    const weeks: string[] = [];
    const avgSessionLengths: number[] = [];
    const sessionsPerWeek: number[] = [];

    // Create array of last 4 weeks
    for (let i = 3; i >= 0; i--) {
      const startDate = new Date();
      startDate.setDate(now.getDate() - (i * 7 + 6));
      const endDate = new Date();
      endDate.setDate(now.getDate() - i * 7);

      const weekLabel = `Week ${4 - i}`;
      weeks.push(weekLabel);

      // Filter sessions in this week
      const weekSessions = focusSessions.filter((s) => {
        const sessionDate = new Date(s.date);
        return sessionDate >= startDate && sessionDate <= endDate;
      });

      // Calculate average session length
      const totalMinutes = weekSessions.reduce(
        (total, session) => total + session.duration / 60,
        0
      );
      const avgLength = weekSessions.length
        ? Math.round(totalMinutes / weekSessions.length)
        : 0;

      avgSessionLengths.push(avgLength);
      sessionsPerWeek.push(weekSessions.length);
    }

    setChartData({
      labels: weeks,
      datasets: [
        {
          label: 'Average Session Length (min)',
          data: avgSessionLengths,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
        {
          label: 'Number of Sessions',
          data: sessionsPerWeek,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
      ],
    });
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Productivity Trends',
      },
    },
  };

  return (
    <div className={styles.chartContainer}>
      <Line options={options} data={chartData} />
    </div>
  );
}
