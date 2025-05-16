// src/app/components/timer/TimerSetting.tsx
'use client';

import { useState } from 'react';
import type { TimerSettings } from '@/lib/timer';
import styles from './timer.module.css';
import buttonStyles from '@/app/styles/shared/buttons.module.css';

// Local function to save settings to localStorage
const saveTimerSettings = (settings: TimerSettings): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('timerSettings', JSON.stringify(settings));
  }
};

interface TimerSettingsComponentProps {
  settings: TimerSettings;
  onSave: (settings: TimerSettings) => void;
  onCancel: () => void;
}

export default function TimerSetting({
  settings,
  onSave,
  onCancel,
}: TimerSettingsComponentProps) {
  const [editSettings, setEditSettings] = useState<TimerSettings>({
    ...settings,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setEditSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseInt(value, 10),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save to localStorage
    saveTimerSettings(editSettings);
    // Notify parent component
    onSave(editSettings);
  };

  return (
    <div className={styles.settingsContainer}>
      <h2>Timer Settings</h2>
      <form onSubmit={handleSubmit}>
        {/* All your form groups... */}

        <div className={styles.settingsButtons}>
          <button type="submit" className={buttonStyles.primaryButton}>
            Save Settings
          </button>
          <button
            type="button"
            className={buttonStyles.secondaryButton}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
