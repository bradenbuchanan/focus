// src/app/components/analytics/ProductivityPatternsSection.tsx
import ProductivityTrends from './ProductivityTrends';
import ActivityPieChart from './ActivityPieChart';

export default function ProductivityPatternsSection() {
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
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
        </svg>
        Productivity Patterns
      </h3>
      <div className="analytics-grid">
        <ProductivityTrends />
        <ActivityPieChart />
      </div>
    </div>
  );
}
