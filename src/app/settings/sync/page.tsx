// src/app/settings/sync/page.tsx
'use client';

import { useState } from 'react';
import { useData } from '@/providers/DataProvider';
import styles from '../settings.module.css';

export default function DataSyncPage() {
  const [syncState, setSyncState] = useState<
    'idle' | 'syncing' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState('');
  const { getSessions } = useData();

  const syncData = async () => {
    try {
      setSyncState('syncing');
      setMessage('Synchronizing your data...');

      // Fetch latest data from the server
      const sessions = await getSessions();

      setMessage(`Successfully synchronized ${sessions.length} sessions.`);
      setSyncState('success');
    } catch (error) {
      console.error('Sync error:', error);
      setMessage(
        `Synchronization failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      setSyncState('error');
    }
  };

  return (
    <div className={styles.settingsPage}>
      <h1>Data Synchronization</h1>
      <p>Sync your data between devices and ensure everything is up to date.</p>

      <div className={styles.section}>
        <h2>Synchronize Data</h2>
        <p>
          This will fetch the latest data from the server and update your local
          cache. Use this if you&apos;ve made changes on another device and want
          to see them here.
        </p>

        <button
          className={styles.primaryButton}
          onClick={syncData}
          disabled={syncState === 'syncing'}
        >
          {syncState === 'syncing' ? 'Synchronizing...' : 'Sync Now'}
        </button>

        {message && (
          <div
            className={`${styles.messageBox} ${
              syncState === 'success'
                ? styles.success
                : syncState === 'error'
                ? styles.error
                : ''
            }`}
          >
            {message}
          </div>
        )}
      </div>

      <div className={styles.infoBox}>
        <h3>About Data Synchronization</h3>
        <p>
          Focus automatically syncs your data when you take actions like
          completing a session or updating a goal. Use this manual sync only if
          you notice that some changes made on other devices aren&apos;t
          appearing.
        </p>
      </div>
    </div>
  );
}
