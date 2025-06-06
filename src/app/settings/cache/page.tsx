// src/app/settings/cache/page.tsx
'use client';

import { useState } from 'react';
import { useCache } from '@/hooks/useCache';

export default function CacheManagementPage() {
  const [stats, setStats] = useState<any>(null);
  const { clearAllCaches, logCacheStats } = useCache();

  const handleGetStats = () => {
    const cacheStats = logCacheStats();
    setStats(cacheStats);
  };

  const handleClearCache = () => {
    if (
      confirm(
        'Are you sure you want to clear all cached data? This will force fresh data loading.'
      )
    ) {
      clearAllCaches();
      setStats(null);
    }
  };

  return (
    <div className="card">
      <div className="card__header">
        <h1 className="card__title">Cache Management</h1>
        <p>Manage your application's data cache for better performance</p>
      </div>

      <div className="card__body">
        <div className="form-group">
          <h3>Cache Statistics</h3>
          <div className="btn-group">
            <button className="btn btn--secondary" onClick={handleGetStats}>
              Get Cache Stats
            </button>
            <button className="btn btn--danger" onClick={handleClearCache}>
              Clear All Cache
            </button>
          </div>
        </div>

        {stats && (
          <div className="card card--surface">
            <h4>Current Cache Status</h4>
            <pre style={{ fontSize: '0.9rem', overflow: 'auto' }}>
              {JSON.stringify(stats, null, 2)}
            </pre>
          </div>
        )}

        <div className="card card--compact">
          <h4>About Caching</h4>
          <ul>
            <li>Sessions are cached for 2 minutes</li>
            <li>Tasks are cached for 3 minutes</li>
            <li>Goals and accomplishments are cached for 5 minutes</li>
            <li>Cache is automatically cleared when data is modified</li>
            <li>
              Use "Clear All Cache" if you're experiencing stale data issues
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
