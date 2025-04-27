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
import { formatTime, TimerState } from '@/lib/timer';

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
      <div className={styles.timerWrapper}>
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
            <div className={styles.timerCard}>
              {/* Activity selector with improved styling */}
              <div className={styles.activitySection}>
                <h2 className={styles.sectionTitle}>
                  What are you focusing on?
                </h2>
                <div className={styles.activityPills}>
                  {defaultActivityCategories.map((activity) => (
                    <button
                      key={activity}
                      className={`${styles.activityPill} ${
                        selectedActivity === activity ? styles.pillSelected : ''
                      }`}
                      onClick={() => setSelectedActivity(activity)}
                    >
                      {activity}
                    </button>
                  ))}
                  <button
                    className={styles.activityPill}
                    onClick={() => {
                      /* Add custom activity logic */
                    }}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {/* Timer mode selector */}
              <div className={styles.modeTabsContainer}>
                <div className={styles.modeTabs}>
                  <button
                    className={`${styles.modeTab} ${
                      timerMode === 'pomodoro' ? styles.activeTab : ''
                    }`}
                    onClick={() => setTimerMode('pomodoro')}
                  >
                    Pomodoro Timer
                  </button>
                  <button
                    className={`${styles.modeTab} ${
                      timerMode === 'free' ? styles.activeTab : ''
                    }`}
                    onClick={() => setTimerMode('free')}
                  >
                    Free Timer
                  </button>
                </div>
              </div>

              {/* Enhanced timer display */}
              <div className={styles.timerDisplayWrapper}>
                {/* Pomodoro timer */}
                <div className={timerMode === 'pomodoro' ? '' : styles.hidden}>
                  <div className={styles.timerCircle}>
                    <div
                      className={styles.timerCircleProgress}
                      style={
                        {
                          '--progress-percent': `${
                            ((timerData.settings.focusDuration * 60 -
                              timerData.timeRemaining) /
                              (timerData.settings.focusDuration * 60)) *
                            100
                          }%`,
                        } as React.CSSProperties
                      }
                    ></div>
                    <div className={styles.timerTime}>
                      {formatTime(timerData.timeRemaining)}
                    </div>
                    <div className={styles.timerLabel}>
                      {timerData.state === TimerState.BREAK
                        ? 'Break Time'
                        : 'Focus Time'}
                    </div>
                  </div>

                  <div className={styles.timerControls}>
                    {timerData.state === TimerState.RUNNING ? (
                      <button
                        onClick={pauseTimer}
                        className={styles.primaryButton}
                      >
                        Pause
                      </button>
                    ) : (
                      <button
                        onClick={startTimer}
                        className={styles.primaryButton}
                      >
                        {timerData.state === TimerState.IDLE
                          ? 'Start'
                          : 'Resume'}
                      </button>
                    )}
                    <button
                      onClick={resetTimer}
                      className={styles.secondaryButton}
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setShowSettings(true)}
                      className={styles.secondaryButton}
                    >
                      Settings
                    </button>
                  </div>
                </div>

                {/* Free timer */}
                <div className={timerMode === 'free' ? '' : styles.hidden}>
                  <FreeTimer
                    activity={selectedActivity}
                    onComplete={handleFreeSessionComplete}
                    onCancel={() => setTimerMode('pomodoro')}
                  />
                </div>
              </div>
            </div>

            {/* Tasks and goals section */}
            <div className={styles.tasksCard}>
              <TimerGoalsTasksPanel
                activity={
                  selectedActivity === 'All Activities'
                    ? undefined
                    : selectedActivity
                }
                onTaskComplete={async (taskId) => {
                  await completeTask(taskId);
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
