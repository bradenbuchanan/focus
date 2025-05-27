import React from 'react';

interface SectionTitleProps {
  title: string;
  icon: React.ReactNode;
}

export default function SectionTitle({ title, icon }: SectionTitleProps) {
  return (
    <h3 className="card__title">
      {icon}
      {title}
    </h3>
  );
}
