'use client';

import { formatTimeValue } from '@/utils/formatTime';

interface TopActivitiesProps {
  activities: { name: string; minutes: number }[];
}

export default function TopActivities({ activities }: TopActivitiesProps) {
  return (
    <div className="card">
      <h3 className="card__title">Top Activities</h3>
      {activities.length > 0 ? (
        <ul className="list">
          {activities.map((activity, index) => (
            <li key={index} className="list-item list-item--compact">
              <div className="list-item__content">
                <span className="list-item__text">{activity.name}</span>
              </div>
              <div className="list-item__trailing">
                <span style={{ fontWeight: 600, opacity: 0.8 }}>
                  {formatTimeValue(activity.minutes)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="list-empty">
          <p>No activities recorded yet</p>
        </div>
      )}
    </div>
  );
}
