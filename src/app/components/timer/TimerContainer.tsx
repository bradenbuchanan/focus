// src/app/components/timer/TimerContainer.tsx
'use client';

import { useState, useEffect } from 'react';
import TimerDisplay from './TimerDisplay';
import TimerSettings from './TimerSetting';
import ActivitySelector from './ActivitySelector';
import AccomplishmentRecorder from './AccomplishmentRecorder';
import FreeTimer from './FreeTimer';
import TimerGoalsTasksPanel from './TimerGoalsTasksPanel';
import { useTimerLogic } from '@/hooks/timer/useTimerLogic';
import { defaultActivityCategories } from '@/lib/timer';
import styles from './timer.module.css';

export default function TimerContainer() {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(
    defaultActivityCategories[0]
  );
  const [showAccomplishmentRecorder, setShowAccomplishmentRecorder] =
    useState(false);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'free'>('pomodoro');
  const [activeTab, setActiveTab] = useState<'timer' | 'goals'>('timer');

  const {
    timerData,
    startTimer,
    pauseTimer,
    resetTimer,
    updateSettings,
    showAccomplishmentPrompt,
    saveAccomplishment,
    skipAccomplishment,
    recordFreeSession,
    completeTask,
  } = useTimerLogic(selectedActivity);

  // Check if we should show the accomplishment recorder
  useEffect(() => {
    setShowAccomplishmentRecorder(showAccomplishmentPrompt);
  }, [showAccomplishmentPrompt]);

  // Handle free session completion directly
  const handleFreeSessionComplete = async (duration: number) => {
    // Use await to resolve the Promise before setting state
    const sessionId = await recordFreeSession(duration, selectedActivity);
    setCurrentSessionId(sessionId);
    // The showAccomplishmentRecorder will be set by the effect above
  };

  // Handle saving an accomplishment with category support
  const handleSaveAccomplishment = (text: string, category?: string) => {
    saveAccomplishment(text, currentSessionId, category);
    setShowAccomplishmentRecorder(false);
    setCurrentSessionId('');
    setTimerMode('pomodoro');
    setActiveTab('timer'); // Return to timer tab after saving
  };

  // Handle skipping the accomplishment
  const handleSkipAccomplishment = () => {
    skipAccomplishment();
    setShowAccomplishmentRecorder(false);
    setCurrentSessionId('');
    setTimerMode('pomodoro');
    setActiveTab('timer'); // Return to timer tab after skipping
  };

  return (
    <div className={styles.timerPageContainer}>
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
            {/* Activity selector stays at the top */}
            <ActivitySelector
              selectedActivity={selectedActivity}
              onSelectActivity={setSelectedActivity}
            />

            {/* Timer mode switcher */}
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

            {/* Timer display */}
            <div
              style={{ display: timerMode === 'pomodoro' ? 'block' : 'none' }}
            >
              <TimerDisplay
                timerData={timerData}
                onStart={startTimer}
                onPause={pauseTimer}
                onReset={resetTimer}
                onOpenSettings={() => setShowSettings(true)}
              />
            </div>

            <div style={{ display: timerMode === 'free' ? 'block' : 'none' }}>
              <FreeTimer
                activity={selectedActivity}
                onComplete={handleFreeSessionComplete}
                onCancel={() => setTimerMode('pomodoro')}
              />
            </div>

            {/* Goals & Tasks Panel - now always visible below timer */}
            <TimerGoalsTasksPanel
              activity={selectedActivity}
              onTaskComplete={completeTask}
            />
          </>
        )}
      </div>
    </div>
  );
}
