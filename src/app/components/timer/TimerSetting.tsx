'use client';

// src/components/timer/TimerSettings.tsx
import { useState } from 'react';
import { TimerSettings as TimerSettingsType, saveSettings } from '@/lib/timer';
import styles from './timer.module.css';

interface TimerSettingsProps {
  settings: TimerSettingsType;
  onSave: (settings: TimerSettingsType) => void;
  onCancel: () => void;
}

export default function TimerSettings({
  settings,
  onSave,
  onCancel,
}: TimerSettingsProps) {
  const [editSettings, setEditSettings] = useState<TimerSettingsType>({
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
    saveSettings(editSettings);
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
