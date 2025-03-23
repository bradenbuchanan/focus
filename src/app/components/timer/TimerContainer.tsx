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
import { defaultActivityCategories, TimerState } from '@/lib/timer';
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
    saveAccomplishment,
    skipAccomplishment,
    recordFreeSession,
    completeTask,
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
    const sessionId = recordFreeSession(duration, selectedActivity);
    setCurrentSessionId(sessionId);
    setShowAccomplishmentRecorder(true);
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
            {/* Tabs */}
            <div className={styles.tabsContainer}>
              <button
                className={`${styles.tabButton} ${
                  activeTab === 'timer' ? styles.activeTab : ''
                }`}
                onClick={() => setActiveTab('timer')}
              >
                Timer
              </button>
              <button
                className={`${styles.tabButton} ${
                  activeTab === 'goals' ? styles.activeTab : ''
                }`}
                onClick={() => setActiveTab('goals')}
              >
                Goals & Tasks
              </button>
            </div>

            {/* Activity selector is always visible */}
            <ActivitySelector
              selectedActivity={selectedActivity}
              onSelectActivity={setSelectedActivity}
            />

            {/* Timer content - hidden when not active */}
            <div
              className={styles.tabContent}
              style={{ display: activeTab === 'timer' ? 'block' : 'none' }}
            >
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

              {/* Keep both timer components mounted but only show the active one */}
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
            </div>

            {/* Goals & Tasks content - hidden when not active */}
            <div
              className={styles.tabContent}
              style={{ display: activeTab === 'goals' ? 'block' : 'none' }}
            >
              <TimerGoalsTasksPanel
                activity={selectedActivity}
                onTaskComplete={completeTask}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
