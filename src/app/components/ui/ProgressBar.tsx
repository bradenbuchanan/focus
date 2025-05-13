// src/components/ui/ProgressBar.tsx
'use client';

import React from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  percentage: number;
  color?: string;
  height?: string;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function ProgressBar({
  percentage,
  color = '#3B82F6',
  height = '0.5rem',
  showLabel = false,
  label,
  className = '',
}: ProgressBarProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className={`${styles.progressContainer} ${className}`}>
      {showLabel && (
        <div className={styles.progressLabel}>
          {label || `${Math.round(clampedPercentage)}%`}
        </div>
      )}
      <div className={styles.progressBar} style={{ height }}>
        <div
          className={styles.progressFill}
          style={{
            width: `${clampedPercentage}%`,
            backgroundColor: clampedPercentage >= 100 ? '#4CAF50' : color,
          }}
        />
      </div>
    </div>
  );
}
