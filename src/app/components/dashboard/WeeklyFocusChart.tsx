// src/app/dashboard/components/WeeklyFocusChart.tsx
'use client';

import styles from '../../dashboard/dashboard.module.css';
import cardStyles from '@/app/styles/shared/cards.module.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  TooltipItem,
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
  // Chart options remain the same
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
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          color: 'rgba(var(--gray-rgb), 0.7)',
          padding: 10,
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

  // Chart data setup remains the same
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
    <div className={`${cardStyles.card} ${styles.chartCard}`}>
      <h3 className={cardStyles.cardTitle}>Weekly Focus Time</h3>
      <div className={styles.miniChart}>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
