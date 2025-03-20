'use client';

import { useState, useEffect } from 'react';
import TimerDisplay from './TimerDisplay';
import TimerSettings from './TimerSetting';
import ActivitySelector from './ActivitySelector';
import AccomplishmentRecorder from './AccomplishmentRecorder';
import FreeTimer from './FreeTimer'; // Import the new component
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
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'free'>('pomodoro');
  // Add this missing state declaration
  const [freeSessionCompleted, setFreeSessionCompleted] = useState(false);

  const {
    timerData,
    startTimer,
    pauseTimer,
    resetTimer,
    updateSettings,
    saveAccomplishment,
    skipAccomplishment,
    recordFreeSession,
  } = useTimerLogic(selectedActivity);

  // Check if we should show the accomplishment recorder
  useEffect(() => {
    // Show the recorder when a focus session just ended and we're in a break
    setShowAccomplishmentRecorder(
      timerData.state === TimerState.BREAK &&
        !!timerData.showAccomplishmentRecorder
    );
  }, [timerData.state, timerData.showAccomplishmentRecorder]);

  const handleFreeSessionComplete = (duration: number) => {
    // Record the free session
    recordFreeSession(duration, selectedActivity);

    // Set a flag that we just completed a free session
    setFreeSessionCompleted(true);

    // Show accomplishment recorder
    setShowAccomplishmentRecorder(true);
  };

  console.log(
    'Component render - showAccomplishmentRecorder:',
    showAccomplishmentRecorder
  );
  console.log('Timer data:', timerData);

  return (
    <div className={styles.timerContainer}>
      {showSettings ? (
        <TimerSettings
          settings={timerData.settings}
          onSave={(settings) => {
            updateSettings(settings);
            setShowSettings(false);
          }}
          onCancel={() => setShowSettings(false)}
        />
      ) : showAccomplishmentRecorder ? (
        <AccomplishmentRecorder
          activity={selectedActivity}
          onSave={(accomplishment) => {
            console.log('Saving accomplishment:', accomplishment);
            saveAccomplishment(accomplishment);
            setShowAccomplishmentRecorder(false);
            if (freeSessionCompleted) {
              setFreeSessionCompleted(false);
              setTimerMode('pomodoro'); // Reset to pomodoro mode after free session
            }
          }}
          onSkip={() => {
            console.log('Skipping accomplishment');
            skipAccomplishment();
            setShowAccomplishmentRecorder(false);
            if (freeSessionCompleted) {
              setFreeSessionCompleted(false);
              setTimerMode('pomodoro'); // Reset to pomodoro mode after free session
            }
          }}
        />
      ) : (
        <>
          <ActivitySelector
            selectedActivity={selectedActivity}
            onSelectActivity={setSelectedActivity}
          />

          <div className={styles.modeSwitcher}>
            <button
              className={`${styles.modeButton} ${
                timerMode === 'pomodoro' ? styles.modeButtonActive : ''
              }`}
              onClick={() => setTimerMode('pomodoro')}
            >
              Pomodoro Timer
            </button>
            <button
              className={`${styles.modeButton} ${
                timerMode === 'free' ? styles.modeButtonActive : ''
              }`}
              onClick={() => setTimerMode('free')}
            >
              Free Timer
            </button>
          </div>

          {timerMode === 'pomodoro' ? (
            <TimerDisplay
              timerData={timerData}
              onStart={startTimer}
              onPause={pauseTimer}
              onReset={resetTimer}
              onOpenSettings={() => setShowSettings(true)}
            />
          ) : (
            <FreeTimer
              activity={selectedActivity}
              onComplete={handleFreeSessionComplete}
              onCancel={() => setTimerMode('pomodoro')}
            />
          )}
        </>
      )}
    </div>
  );
}
