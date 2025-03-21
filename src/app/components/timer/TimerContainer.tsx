'use client';

import { useState, useEffect } from 'react';
import TimerDisplay from './TimerDisplay';
import TimerSettings from './TimerSetting';
import ActivitySelector from './ActivitySelector';
import AccomplishmentRecorder from './AccomplishmentRecorder';
import FreeTimer from './FreeTimer';
import { useTimerLogic } from '@/hooks/timer/useTimerLogic';
import { defaultActivityCategories, TimerState } from '@/lib/timer';
import styles from './timer.module.css';

export default function TimerContainer() {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(
    defaultActivityCategories[0]
  );
  // Create our own direct state for accomplishment recorder
  const [showAccomplishmentRecorder, setShowAccomplishmentRecorder] =
    useState(false);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'free'>('pomodoro');

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

  // Check if we should show the accomplishment recorder based on timer state
  useEffect(() => {
    if (
      timerData.state === TimerState.BREAK &&
      timerData.showAccomplishmentRecorder
    ) {
      setShowAccomplishmentRecorder(true);
    }
  }, [timerData.state, timerData.showAccomplishmentRecorder]);

  // Handle free session completion directly
  const handleFreeSessionComplete = (duration: number) => {
    // Get the session ID from recording the session
    const sessionId = recordFreeSession(duration, selectedActivity);

    // Store the session ID for the accomplishment
    setCurrentSessionId(sessionId);

    // Explicitly show the accomplishment recorder
    console.log('Free session completed, showing accomplishment recorder');
    setShowAccomplishmentRecorder(true);
  };

  // Handle saving an accomplishment
  const handleSaveAccomplishment = (accomplishment: string) => {
    console.log(
      'Saving accomplishment:',
      accomplishment,
      'for session:',
      currentSessionId
    );
    saveAccomplishment(accomplishment, currentSessionId);
    setShowAccomplishmentRecorder(false);
    setCurrentSessionId('');
    setTimerMode('pomodoro'); // Reset to pomodoro mode after free session
  };

  // Handle skipping the accomplishment
  const handleSkipAccomplishment = () => {
    console.log('Skipping accomplishment for session:', currentSessionId);
    skipAccomplishment();
    setShowAccomplishmentRecorder(false);
    setCurrentSessionId('');
    setTimerMode('pomodoro'); // Reset to pomodoro mode after free session
  };

  console.log('Component render state:', {
    showAccomplishmentRecorder,
    currentSessionId,
    timerState: timerData.state,
    showAccomplishmentFlag: timerData.showAccomplishmentRecorder,
  });

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
          onSave={handleSaveAccomplishment}
          onSkip={handleSkipAccomplishment}
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
