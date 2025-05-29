// src/components/ui/ProgressBar.tsx
'use client';

import React from 'react';

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
    <div className={className} style={{ width: '100%' }}>
      {showLabel && (
        <div
          style={{
            fontSize: '0.85rem',
            marginBottom: '0.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {label || `${Math.round(clampedPercentage)}%`}
        </div>
      )}
      <div className="progress-bar" style={{ height }}>
        <div
          className="progress-fill"
          style={{
            width: `${clampedPercentage}%`,
            backgroundColor: clampedPercentage >= 100 ? '#4CAF50' : color,
          }}
        />
      </div>
    </div>
  );
}
