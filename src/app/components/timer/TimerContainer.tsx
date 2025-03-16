// src/app/components/timer/TimerContainer.tsx
'use client';

import { useState, useEffect } from 'react';
import TimerDisplay from './TimerDisplay';
import TimerSettings from './TimerSetting';
import ActivitySelector from './ActivitySelector';
import { useTimerLogic } from '@/hooks/useTimerLogic';
import { defaultActivityCategories } from '@/lib/timer';
import styles from './timer.module.css';

export default function TimerContainer() {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(
    defaultActivityCategories[0]
  );

  const { timerData, startTimer, pauseTimer, resetTimer, updateSettings } =
    useTimerLogic(selectedActivity);

  return (
    <div className={styles.timerContainer}>
      {showSettings ? (
        <TimerSettings
          settings={timerData.settings}
          onSave={updateSettings}
          onCancel={() => setShowSettings(false)}
        />
      ) : (
        <>
          <ActivitySelector
            selectedActivity={selectedActivity}
            onSelectActivity={setSelectedActivity}
          />
          <TimerDisplay
            timerData={timerData}
            onStart={startTimer}
            onPause={pauseTimer}
            onReset={resetTimer}
            onOpenSettings={() => setShowSettings(true)}
          />
        </>
      )}
    </div>
  );
}
