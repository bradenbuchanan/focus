// src/app/settings/page.tsx
import MigrationForm from './migrate-data/MigrationForm';
import styles from './settings.module.css';

export default function SettingsPage() {
  return (
    <div className={styles.settingsPage}>
      <h1>Settings</h1>

      <div className={styles.section}>
        <h2>Data Management</h2>
        <MigrationForm />
      </div>

      {/* You can add other settings sections here */}
    </div>
  );
}
