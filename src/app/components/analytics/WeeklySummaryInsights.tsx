// src/app/components/analytics/WeeklySummaryInsights.tsx
interface WeeklySummaryInsightsProps {
  insights: string | null;
}

export function WeeklySummaryInsights({
  insights,
}: WeeklySummaryInsightsProps) {
  if (!insights) {
    return (
      <div className="card--surface card--compact">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>No insights available for this period yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card--surface card--compact">
      <h3 className="card__title">Your Insights</h3>
      <div className="card__body">
        {insights.split('\n\n').map((paragraph, index) => (
          <p key={index} style={{ marginBottom: '1rem' }}>
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
