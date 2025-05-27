import { AnalyticsSummary } from '@/hooks/useAnalyticsSummary';
import { formatTimeValue } from '@/utils/formatTime';

interface SummaryCardProps {
  summary: AnalyticsSummary;
}

export default function SummaryCard({ summary }: SummaryCardProps) {
  return (
    <div className="card card--elevated">
      <h2 className="card__title">Performance Summary</h2>
      <ul className="list">
        <li className="list-item list-item--compact">
          <span className="list-item__text">Total Focus Time</span>
          <span className="list-item__trailing">
            {formatTimeValue(summary.totalFocusTime)}
          </span>
        </li>
        <li className="list-item list-item--compact">
          <span className="list-item__text">Completed Sessions</span>
          <span className="list-item__trailing">{summary.totalSessions}</span>
        </li>
        <li className="list-item list-item--compact">
          <span className="list-item__text">Average Session</span>
          <span className="list-item__trailing">
            {formatTimeValue(summary.avgSessionLength)}
          </span>
        </li>
        <li className="list-item list-item--compact">
          <span className="list-item__text">Favorite Activity</span>
          <span className="list-item__trailing">
            {summary.favoriteActivity || 'N/A'}
          </span>
        </li>
        <li className="list-item list-item--compact">
          <span className="list-item__text">Most Productive Day</span>
          <span className="list-item__trailing">
            {summary.mostProductiveDay || 'N/A'}
          </span>
        </li>
        <li className="list-item list-item--compact">
          <span className="list-item__text">Peak Productivity Hour</span>
          <span className="list-item__trailing">
            {summary.mostProductiveHour !== undefined
              ? `${summary.mostProductiveHour}:00`
              : 'N/A'}
          </span>
        </li>
        <li className="list-item list-item--compact">
          <span className="list-item__text">Session Completion Rate</span>
          <span className="list-item__trailing">{summary.completionRate}%</span>
        </li>
      </ul>
    </div>
  );
}
