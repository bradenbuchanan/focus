// src/app/dashboard/components/TopActivities.tsx
'use client';

import styles from './dashboardTopActivities.module.css';
import { formatTimeValue } from '../../dashboard/utils/format';

interface TopActivitiesProps {
  activities: { name: string; minutes: number }[];
}

export default function TopActivities({ activities }: TopActivitiesProps) {
  return (
    <div className={styles.topActivitiesCard}>
      <h3>Top Activities</h3>
      {activities.length > 0 ? (
        <ul className={styles.topActivitiesList}>
          {activities.map((activity, index) => (
            <li key={index} className={styles.topActivity}>
              <span className={styles.activityName}>{activity.name}</span>
              <span className={styles.activityTime}>
                {formatTimeValue(activity.minutes)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.noData}>No activities recorded yet</p>
      )}
    </div>
  );
}
