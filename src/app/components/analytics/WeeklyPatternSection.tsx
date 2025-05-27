import WeeklyHeatmap from './WeeklyHeatmap';

export default function WeeklyPatternSection() {
  return (
    <div className="animate-fade-in">
      <h3
        className="card__title"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ width: '20px', height: '20px', opacity: '0.7' }}
        >
          <rect x="3" y="3" width="18" height="18" rx="2"></rect>
          <path d="M3 9h18"></path>
          <path d="M9 21V9"></path>
        </svg>
        Weekly Activity Pattern
      </h3>
      <WeeklyHeatmap />
    </div>
  );
}
