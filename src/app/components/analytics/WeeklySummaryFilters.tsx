// src/app/components/analytics/WeeklySummaryFilters.tsx
import { TimeFrame } from '../../../types/analytics';

interface WeeklySummaryFiltersProps {
  timeframe: TimeFrame;
  onTimeframeChange: (timeframe: TimeFrame) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
  availableActivities: string[];
  selectedActivities: string[];
  onActivityToggle: (activity: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export function WeeklySummaryFilters({
  timeframe,
  onTimeframeChange,
  dateRange,
  onDateRangeChange,
  availableActivities,
  selectedActivities,
  onActivityToggle,
  onGenerate,
  isLoading,
}: WeeklySummaryFiltersProps) {
  return (
    <div className="filter-container">
      <h3 className="card__title">Generate Productivity Insights</h3>

      <BetaNotice />

      <TimeframeSelector value={timeframe} onChange={onTimeframeChange} />

      {timeframe === 'custom' && (
        <DateRangePicker
          startDate={dateRange.start}
          endDate={dateRange.end}
          onChange={onDateRangeChange}
        />
      )}

      {availableActivities.length > 0 && (
        <ActivityFilter
          activities={availableActivities}
          selected={selectedActivities}
          onToggle={onActivityToggle}
        />
      )}

      <button
        className="btn btn--primary btn--full"
        onClick={onGenerate}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Generate Insights'}
      </button>
    </div>
  );
}

function BetaNotice() {
  return (
    <>
      <div
        className="card--surface card--compact"
        style={{ marginBottom: '1rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            className="priority-badge"
            style={{ backgroundColor: '#f59e0b' }}
          >
            BETA
          </span>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            Weekly insights feature with AI-powered analytics. Limited API calls
            available.
          </p>
        </div>
      </div>

      <div
        className="card--surface card--compact"
        style={{ marginBottom: '1rem' }}
      >
        <p>
          <strong>Note:</strong> Generating insights uses the Gemini API and
          counts toward your API usage limit. Choose your time periods
          carefully.
        </p>
      </div>
    </>
  );
}

function TimeframeSelector({
  value,
  onChange,
}: {
  value: TimeFrame;
  onChange: (value: TimeFrame) => void;
}) {
  return (
    <div className="form-group">
      <label className="form-label">Time Period:</label>
      <div className="filter-tabs">
        <button
          className={`filter-tab ${
            value === 'week' ? 'filter-tab--active' : ''
          }`}
          onClick={() => onChange('week')}
        >
          This Week
        </button>
        <button
          className={`filter-tab ${
            value === 'month' ? 'filter-tab--active' : ''
          }`}
          onClick={() => onChange('month')}
        >
          This Month
        </button>
        <button
          className={`filter-tab ${
            value === 'custom' ? 'filter-tab--active' : ''
          }`}
          onClick={() => onChange('custom')}
        >
          Custom Range
        </button>
      </div>
    </div>
  );
}

function DateRangePicker({
  startDate,
  endDate,
  onChange,
}: {
  startDate: string;
  endDate: string;
  onChange: (range: { start: string; end: string }) => void;
}) {
  return (
    <div className="filter-date-range">
      <div className="filter-date-input">
        <label className="form-label" htmlFor="startDate">
          Start Date:
        </label>
        <input
          type="date"
          id="startDate"
          className="form-input"
          value={startDate}
          onChange={(e) => onChange({ start: e.target.value, end: endDate })}
        />
      </div>
      <div className="filter-date-input">
        <label className="form-label" htmlFor="endDate">
          End Date:
        </label>
        <input
          type="date"
          id="endDate"
          className="form-input"
          value={endDate}
          onChange={(e) => onChange({ start: startDate, end: e.target.value })}
        />
      </div>
    </div>
  );
}

function ActivityFilter({
  activities,
  selected,
  onToggle,
}: {
  activities: string[];
  selected: string[];
  onToggle: (activity: string) => void;
}) {
  return (
    <div className="form-group">
      <label className="form-label">Filter by Activities (optional):</label>
      <div className="filter-buttons">
        {activities.map((activity) => (
          <button
            key={activity}
            className={`filter-button ${
              selected.includes(activity) ? 'filter-button--active' : ''
            }`}
            onClick={() => onToggle(activity)}
          >
            {activity}
          </button>
        ))}
      </div>
    </div>
  );
}
