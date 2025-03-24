// src/app/settings/migrate-data/MigrationForm.tsx
'use client';

import { useState } from 'react';
import { migrateLocalDataToSupabase } from '@/utils/dataMigration';
import styles from './migration.module.css';
import { useAuth } from '@/context/AuthContext';

export default function MigrationForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const { user } = useAuth();

  const handleMigrate = async () => {
    if (!user) {
      setResult({
        success: false,
        error: 'You must be logged in to migrate data',
      });
      return;
    }

    setIsLoading(true);

    try {
      const migrationResult = await migrateLocalDataToSupabase();
      setResult(migrationResult);

      // If successful, optionally clear localStorage
      if (migrationResult.success) {
        if (
          confirm(
            'Data migrated successfully! Do you want to clear localStorage data now?'
          )
        ) {
          localStorage.removeItem('timerSessions');
          localStorage.removeItem('focusAccomplishments');
          localStorage.removeItem('focusGoals');
          localStorage.removeItem('focusTasks');
        }
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
    <div className={styles.migrationContainer}>
      <h2>Migrate Local Storage Data to Supabase</h2>
      <p>
        This will transfer your locally stored data to your Supabase account.
      </p>

      {!user && (
        <div className={styles.error}>
          You need to be logged in to migrate your data.
        </div>
      )}

      <button
        className={styles.primaryButton}
        onClick={handleMigrate}
        disabled={isLoading || !user}
      >
        {isLoading ? 'Migrating...' : 'Migrate My Data'}
      </button>

      {result && (
        <div
          className={`${styles.result} ${
            result.success ? styles.success : styles.error
          }`}
        >
          {result.success ? (
            <p>
              Successfully migrated {result.sessionsMigrated} sessions,{' '}
              {result.accomplishmentsMigrated} accomplishments,{' '}
              {result.goalsMigrated} goals, and {result.tasksMigrated} tasks!
            </p>
          ) : (
            <p>Error: {result.error}</p>
          )}
        </div>
      )}

      <div className={styles.infoBox}>
        <h3>Important Notes:</h3>
        <ul>
          <li>This migration is a one-time process.</li>
          <li>
            Your locally stored data will remain until you choose to clear it.
          </li>
          <li>You should migrate your data only once to avoid duplicates.</li>
          <li>
            After migration, your data will be accessible from any device you
            log in to.
          </li>
        </ul>
      </div>
    </div>
  );
}
