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

export default function DailyBarChart() {
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

    // Group by date (last 7 days)
    const now = new Date();
    const days: string[] = [];
    const dailyMinutes: number[] = [];

    // Create array of last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      days.push(dateString.slice(5)); // MM-DD format

      // Calculate minutes for this day
      const dayMinutes = focusSessions
        .filter((s) => s.date.startsWith(dateString))
        .reduce((total, session) => total + session.duration / 60, 0);

      dailyMinutes.push(Math.round(dayMinutes));
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
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Daily Focus Time (Past 7 Days)',
      },
    },
  };

  return (
    <div className={styles.chartContainer}>
      <Bar options={options} data={chartData} />
    </div>
  );
}
