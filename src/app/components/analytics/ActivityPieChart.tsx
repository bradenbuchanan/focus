// src/app/components/analytics/ActivityPieChart.tsx
'use client';

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { useState, useEffect, useRef } from 'react';
import { getSessions } from '@/lib/timer';
import styles from './analytics.module.css';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ActivityPieChart() {
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [
      {
        data: [] as number[],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#8F9BBA',
        ],
        borderWidth: 1,
      },
    ],
  });

  useEffect(() => {
    const sessions = getSessions();
    const focusSessions = sessions.filter((s) => s.type === 'focus');

    // Group by activity
    const activityMap = new Map<string, number>();

    focusSessions.forEach((session) => {
      const activity = session.activity || 'Other';
      const minutes = session.duration / 60;
      if (activityMap.has(activity)) {
        activityMap.set(activity, activityMap.get(activity)! + minutes);
      } else {
        activityMap.set(activity, minutes);
      }
    });

    // Convert to chart data
    const labels = Array.from(activityMap.keys());
    const data = Array.from(activityMap.values()).map((minutes) =>
      Math.round(minutes)
    );

    setChartData({
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#8F9BBA',
          ],
          borderWidth: 1,
        },
      ],
    });
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 10,
          font: {
            size: 10,
          },
        },
      },
    },
  };

  return (
    <div className={styles.chartContainer}>
      <h3>Time by Activity</h3>
      <div
        style={{
          height: '350px',
          position: 'relative',
          width: '100%',
          maxWidth: '340px',
          margin: '0 auto',
        }}
      >
        <Pie ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
}
