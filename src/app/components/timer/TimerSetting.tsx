// src/app/components/timer/TimerSetting.tsx
'use client';

import { useState } from 'react';
import type { TimerSettings } from '@/lib/timer';

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
    <div className="card card--spacious">
      <h2>Timer Settings</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="focusDuration" className="form-label">
            Focus Duration (minutes)
          </label>
          <input
            type="number"
            id="focusDuration"
            name="focusDuration"
            min="1"
            max="120"
            value={editSettings.focusDuration}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="breakDuration" className="form-label">
            Short Break Duration (minutes)
          </label>
          <input
            type="number"
            id="breakDuration"
            name="breakDuration"
            min="1"
            max="30"
            value={editSettings.breakDuration}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="longBreakDuration" className="form-label">
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
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="longBreakInterval" className="form-label">
            Long Break After (sessions)
          </label>
          <input
            type="number"
            id="longBreakInterval"
            name="longBreakInterval"
            min="1"
            max="10"
            value={editSettings.longBreakInterval}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <div className="form-check">
            <input
              type="checkbox"
              name="autoStartBreaks"
              checked={editSettings.autoStartBreaks}
              onChange={handleChange}
              className="form-checkbox"
            />
            <label className="form-check-label">Auto-start breaks</label>
          </div>
        </div>

        <div className="form-group">
          <div className="form-check">
            <input
              type="checkbox"
              name="autoStartPomodoros"
              checked={editSettings.autoStartPomodoros}
              onChange={handleChange}
              className="form-checkbox"
            />
            <label className="form-check-label">
              Auto-start focus sessions
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn--primary">
            Save Settings
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
