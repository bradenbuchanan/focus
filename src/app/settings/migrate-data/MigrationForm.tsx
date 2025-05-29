// src/app/settings/migrate-data/MigrationForm.tsx
'use client';

import { useState } from 'react';
import { migrateLocalData } from './actions';

// Define a specific type for the migration result
interface MigrationResult {
  success: boolean;
  sessionsCount?: number;
  accomplishmentsCount?: number;
  error?: string;
}

export default function MigrationForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const handleMigrate = async () => {
    if (typeof window === 'undefined') return;

    setIsLoading(true);

    try {
      // Get data from localStorage
      const sessionsData = localStorage.getItem('timerSessions') || '[]';
      const accomplishmentsData =
        localStorage.getItem('focusAccomplishments') || '[]';

      // Prepare form data
      const formData = new FormData();
      formData.append('sessions', sessionsData);
      formData.append('accomplishments', accomplishmentsData);

      // Call the server action
      const migrationResult = (await migrateLocalData(
        formData
      )) as MigrationResult;
      setResult(migrationResult);

      // If successful, optionally clear localStorage
      if (
        migrationResult.success &&
        confirm(
          'Data migrated successfully! Do you want to clear localStorage data now?'
        )
      ) {
        localStorage.removeItem('timerSessions');
        localStorage.removeItem('focusAccomplishments');
      }
    } catch (error) {
      console.error('Migration error:', error);
      setResult({
        success: false,
        error: 'Migration failed. See console for details.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card card--compact">
      <div className="card__header">
        <h2 className="card__title">Migrate Local Storage Data to Database</h2>
        <p>
          This will transfer your locally stored sessions and accomplishments to
          the database.
        </p>
      </div>

      <div className="card__body">
        <button
          className={`btn btn--primary ${isLoading ? 'btn--loading' : ''}`}
          onClick={handleMigrate}
          disabled={isLoading}
        >
          {isLoading ? 'Migrating...' : 'Migrate My Data'}
        </button>

        {result && (
          <div
            className={`card card--compact ${
              result.success ? 'card--success' : 'card--error'
            }`}
            style={{
              marginTop: '1rem',
              backgroundColor: result.success
                ? 'rgba(76, 175, 80, 0.1)'
                : 'rgba(244, 67, 54, 0.1)',
              borderColor: result.success
                ? 'rgba(76, 175, 80, 0.3)'
                : 'rgba(244, 67, 54, 0.3)',
              color: result.success ? '#2e7d32' : '#d32f2f',
            }}
          >
            {result.success ? (
              <p>
                Successfully migrated {result.sessionsCount} sessions and{' '}
                {result.accomplishmentsCount} accomplishments!
              </p>
            ) : (
              <p>Error: {result.error}</p>
            )}
          </div>
        )}

        <div
          className="card card--compact"
          style={{
            marginTop: '1.5rem',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            borderColor: 'rgba(33, 150, 243, 0.3)',
          }}
        >
          <h3 className="card__title" style={{ color: '#1976d2' }}>
            Important Notes:
          </h3>
          <ul style={{ marginBottom: 0 }}>
            <li>This migration is a one-time process.</li>
            <li>
              Your locally stored data will remain until you choose to clear it.
            </li>
            <li>You should migrate your data only once to avoid duplicates.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
