// src/app/components/analytics/SectionTitle.tsx
import React from 'react';
import styles from '../../analytics/analytics.module.css';

interface SectionTitleProps {
  title: string;
  icon: React.ReactNode;
}

export default function SectionTitle({ title, icon }: SectionTitleProps) {
  return (
    <h3 className={styles.sectionTitle}>
      {icon}
      {title}
    </h3>
  );
}
