// src/app/settings/cache/page.tsx
'use client';

import { useState } from 'react';
import { useCache } from '@/hooks/useCache';

// Define a proper type for cache stats
interface CacheStats {
  [key: string]: {
    size: number;
    keys: string[];
  };
}

export default function CacheManagementPage() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const { clearAllCaches, getCacheStats } = useCache(); // Now we can use getCacheStats

  const handleGetStats = () => {
    const cacheStats = getCacheStats(); // This now returns the actual stats
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
        <p>Manage your application&apos;s data cache for better performance</p>
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
            <div style={{ marginBottom: '1rem' }}>
              {Object.entries(stats).map(([cacheName, cacheData]) => (
                <div key={cacheName} style={{ marginBottom: '0.5rem' }}>
                  <strong>{cacheName}:</strong> {cacheData.size} items
                  {cacheData.size > 0 && (
                    <details style={{ marginLeft: '1rem', fontSize: '0.9rem' }}>
                      <summary>View keys</summary>
                      <ul style={{ marginTop: '0.5rem' }}>
                        {cacheData.keys.map((key, index) => (
                          <li key={index}>{key}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              ))}
            </div>
            <details>
              <summary>Raw JSON</summary>
              <pre
                style={{
                  fontSize: '0.9rem',
                  overflow: 'auto',
                  marginTop: '0.5rem',
                }}
              >
                {JSON.stringify(stats, null, 2)}
              </pre>
            </details>
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
              Use &quot;Clear All Cache&quot; if you&apos;re experiencing stale
              data issues
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
