// src/app/components/analytics/WeeklySummaryStats.tsx
import { WeeklySummary } from '../../../types/analytics';

interface WeeklySummaryStatsProps {
  summary: WeeklySummary;
}

export function WeeklySummaryStats({ summary }: WeeklySummaryStatsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <div className="card__header" style={{ textAlign: 'center' }}>
        <h2 className="card__title">Productivity Insights</h2>
        <p className="card__subtitle">
          {formatDate(summary.startDate)} - {formatDate(summary.endDate)}
        </p>
      </div>

      <div
        className="card-grid card-grid--stats"
        style={{ marginBottom: '2rem' }}
      >
        <StatCard value={summary.totalFocusTime} label="Minutes Focused" />
        <StatCard value={summary.totalSessions} label="Sessions" />
        <StatCard
          value={
            summary.mostProductiveDay
              ? new Date(summary.mostProductiveDay.day).toLocaleDateString(
                  'en-US',
                  { weekday: 'short' }
                )
              : 'N/A'
          }
          label="Best Day"
        />
      </div>

      {summary.topCategories.length > 0 && (
        <TopCategories
          categories={summary.topCategories}
          totalTime={summary.totalFocusTime}
        />
      )}
    </>
  );
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="card card--stats">
      <span className="stats-value">{value}</span>
      <span className="stats-label">{label}</span>
    </div>
  );
}

function TopCategories({
  categories,
  totalTime,
}: {
  categories: Array<{ name: string; minutes: number }>;
  totalTime: number;
}) {
  const colors = [
    'var(--color-primary)',
    'var(--color-success)',
    'var(--color-warning)',
  ];

  return (
    <div
      className="card--surface card--compact"
      style={{ marginBottom: '2rem' }}
    >
      <h3 className="card__title">Top Focus Categories</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {categories.map((category, index) => (
          <div
            key={index}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: '500' }}>{category.name}</span>
              <span style={{ fontSize: '0.9rem', opacity: '0.8' }}>
                {category.minutes} min
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(
                    100,
                    (category.minutes / totalTime) * 100
                  )}%`,
                  backgroundColor: colors[index] || colors[colors.length - 1],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
