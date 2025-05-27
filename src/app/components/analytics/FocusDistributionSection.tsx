// src/app/components/analytics/FocusDistributionSection.tsx
import DailyBarChart from './DailyBarChart';

export default function FocusDistributionSection() {
  return (
    <div className="chart-container animate-fade-in">
      <h3 className="card__title">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ width: '20px', height: '20px', marginRight: '0.5rem' }}
        >
          <path d="M12 20V10"></path>
          <path d="M18 20V4"></path>
          <path d="M6 20v-4"></path>
        </svg>
        Focus Time Distribution
      </h3>
      <DailyBarChart />
    </div>
  );
}
