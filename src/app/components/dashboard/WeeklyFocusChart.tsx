// src/app/dashboard/components/WeeklyFocusChart.tsx
'use client';

import styles from '../../dashboard/dashboard.module.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  TooltipItem,
  // Removing unused imports:
  // Scale,
  // ScaleOptionsByType,
  // CoreScaleOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface WeeklyFocusChartProps {
  weeklyData: {
    labels: string[];
    values: number[];
  };
}

export default function WeeklyFocusChart({
  weeklyData,
}: WeeklyFocusChartProps) {
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 10,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          title: function (tooltipItems: TooltipItem<'bar'>[]) {
            return `${tooltipItems[0].label}`;
          },
          label: function (tooltipItem: TooltipItem<'bar'>) {
            return `${tooltipItem.raw} minutes`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(var(--gray-rgb), 0.1)',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          color: 'rgba(var(--gray-rgb), 0.7)',
          padding: 10,
          // Update the callback signature to match what Chart.js expects
          callback: function (tickValue: string | number) {
            const numValue = Number(tickValue);
            if (numValue % 1 === 0) {
              return numValue;
            }
            return '';
          },
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          color: 'rgba(var(--gray-rgb), 0.7)',
          padding: 10,
        },
      },
    },
  };

  // Chart data
  const chartData = {
    labels: weeklyData.labels,
    datasets: [
      {
        data: weeklyData.values,
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        hoverBackgroundColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 0,
        borderRadius: 6,
        barThickness: 16,
      },
    ],
  };

  return (
    <div className={styles.chartCard}>
      <h3>Weekly Focus Time</h3>
      <div className={styles.miniChart}>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
