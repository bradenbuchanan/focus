// src/app/components/dashboard/DashboardActions.tsx
'use client';

import Link from 'next/link';

export default function DashboardActions() {
  return (
    <div className="card card--compact">
      <div className="btn-group btn-group--center">
        <Link href="/timer" className="btn btn--primary btn--lg">
          Start Focus Session
        </Link>
        <Link href="/analytics" className="btn btn--secondary btn--lg">
          View Detailed Analytics
        </Link>
      </div>
    </div>
  );
}
