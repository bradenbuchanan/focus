// src/app/components/timer/TimerContainer.tsx
'use client';

import { useState, useEffect } from 'react';
import TimerDisplay from './TimerDisplay';
import TimerSettings from './TimerSetting';
import ActivitySelector from './ActivitySelector';
import AccomplishmentRecorder from './AccomplishmentRecorder';
import { useTimerLogic } from '@/hooks/timer/useTimerLogic';
import { defaultActivityCategories, TimerState } from '@/lib/timer';
import styles from './timer.module.css';

export default function TimerContainer() {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(
    defaultActivityCategories[0]
  );
  const [showAccomplishmentRecorder, setShowAccomplishmentRecorder] =
    useState(false);

  const {
    timerData,
    startTimer,
    pauseTimer,
    resetTimer,
    updateSettings,
    saveAccomplishment,
    skipAccomplishment,
  } = useTimerLogic(selectedActivity);

  // Check if we should show the accomplishment recorder
  useEffect(() => {
    // Show the recorder when a focus session just ended and we're in a break
    setShowAccomplishmentRecorder(
      timerData.state === TimerState.BREAK &&
        !!timerData.showAccomplishmentRecorder // Use !! to convert to a definite boolean
    );
  }, [timerData.state, timerData.showAccomplishmentRecorder]);

  return (
    <div className={styles.timerContainer}>
      {showSettings ? (
        <TimerSettings
          settings={timerData.settings}
          onSave={updateSettings}
          onCancel={() => setShowSettings(false)}
        />
      ) : showAccomplishmentRecorder ? (
        <AccomplishmentRecorder
          activity={selectedActivity}
          onSave={saveAccomplishment}
          onSkip={skipAccomplishment}
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
