// src/app/components/timer/TimerSetting.tsx
'use client';

import { useState } from 'react';
import type { TimerSettings } from '@/lib/timer';
import styles from './timer.module.css';

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
        <div className={styles.settingGroup}>
          <label htmlFor="focusDuration">Focus Duration (minutes)</label>
          <input
            type="number"
            id="focusDuration"
            name="focusDuration"
            min="1"
            max="120"
            value={editSettings.focusDuration}
            onChange={handleChange}
          />
        </div>

        <div className={styles.settingGroup}>
          <label htmlFor="breakDuration">Break Duration (minutes)</label>
          <input
            type="number"
            id="breakDuration"
            name="breakDuration"
            min="1"
            max="60"
            value={editSettings.breakDuration}
            onChange={handleChange}
          />
        </div>

        <div className={styles.settingGroup}>
          <label htmlFor="longBreakDuration">
            Long Break Duration (minutes)
          </label>
          <input
            type="number"
            id="longBreakDuration"
            name="longBreakDuration"
            min="1"
            max="60"
            value={editSettings.longBreakDuration}
            onChange={handleChange}
          />
        </div>

        <div className={styles.settingGroup}>
          <label htmlFor="longBreakInterval">Long Break After (sessions)</label>
          <input
            type="number"
            id="longBreakInterval"
            name="longBreakInterval"
            min="1"
            max="10"
            value={editSettings.longBreakInterval}
            onChange={handleChange}
          />
        </div>

        <div className={styles.settingGroup}>
          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="autoStartBreaks"
              name="autoStartBreaks"
              checked={editSettings.autoStartBreaks}
              onChange={handleChange}
            />
            <label htmlFor="autoStartBreaks">Auto-start breaks</label>
          </div>
        </div>

        <div className={styles.settingGroup}>
          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="autoStartPomodoros"
              name="autoStartPomodoros"
              checked={editSettings.autoStartPomodoros}
              onChange={handleChange}
            />
            <label htmlFor="autoStartPomodoros">
              Auto-start focus sessions
            </label>
          </div>
        </div>

        <div className={styles.settingsButtons}>
          <button type="submit" className={styles.primaryButton}>
            Save Settings
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
