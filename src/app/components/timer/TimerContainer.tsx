// src/app/components/timer/TimerContainer.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { useData } from '@/providers/DataProvider';
import { Task, Goal } from '@/lib/timer';
import TimerDisplay from './TimerDisplay';
import TimerSettings from './TimerSetting';
import AccomplishmentRecorder from './AccomplishmentRecorder';
import FreeTimer from './FreeTimer';
import { TaskList } from '@/app/components/ui/TaskList';
import { GoalList } from '@/app/components/ui/GoalList';
import ActivitySelector from './ActivitySelector';
import { defaultActivityCategories } from '@/lib/timer';

export default function TimerContainer() {
  const [selectedActivity, setSelectedActivity] = useState(
    defaultActivityCategories[0]
  );
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'free'>('pomodoro');
  const [showSettings, setShowSettings] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

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
  } = useTimer(selectedActivity);

  const { getTasks, getGoals } = useData();

  useEffect(() => {
    async function loadData() {
      const allTasks = await getTasks();
      const allGoals = await getGoals();

      // Filter and convert task data
      const filteredTasks = allTasks
        .filter(
          (task) =>
            !task.completed &&
            (task.activity === selectedActivity || !task.activity)
        )
        .map((task) => ({
          id: task.id,
          goalId: task.goal_id || undefined,
          text: task.text,
          completed: task.completed,
          createdAt: task.created_at,
          dueDate: task.due_date || undefined,
          activity: task.activity || undefined,
          priority: (task.priority as 'low' | 'medium' | 'high') || undefined,
          completedAt: task.completed_at || undefined,
        }));

      // Filter and convert goal data
      const filteredGoals = allGoals
        .filter((goal) => goal.activity === selectedActivity || !goal.activity)
        .map((goal) => ({
          id: goal.id,
          title: goal.title,
          description: goal.description || undefined,
          type: goal.type as 'time' | 'sessions',
          target: goal.target,
          period: goal.period as 'daily' | 'weekly' | 'monthly' | 'yearly',
          startDate: goal.start_date,
          endDate: goal.end_date || undefined,
          createdAt: goal.created_at,
          activity: goal.activity || undefined,
        }));

      setTasks(filteredTasks);
      setGoals(filteredGoals);
    }

    loadData();
  }, [selectedActivity, getTasks, getGoals]);

  const handleSaveAccomplishment = async (text: string, category?: string) => {
    await saveAccomplishment(text, undefined, category);
  };

  const handleFreeSessionComplete = async (duration: number) => {
    await recordFreeSession(duration, selectedActivity);
  };

  if (showSettings) {
    return (
      <TimerSettings
        settings={timerData.settings}
        onSave={(settings) => {
          updateSettings(settings);
          setShowSettings(false);
        }}
        onCancel={() => setShowSettings(false)}
      />
    );
  }

  if (showAccomplishmentPrompt) {
    return (
      <AccomplishmentRecorder
        activity={selectedActivity}
        onSave={handleSaveAccomplishment}
        onSkip={skipAccomplishment}
      />
    );
  }

  return (
    <div className="timer-container animate-fade-in">
      <ActivitySelector
        selectedActivity={selectedActivity}
        onSelectActivity={setSelectedActivity}
      />

      <div className="filter-tabs">
        <button
          className={`filter-tab ${
            timerMode === 'pomodoro' ? 'filter-tab--active' : ''
          }`}
          onClick={() => setTimerMode('pomodoro')}
        >
          Pomodoro Timer
        </button>
        <button
          className={`filter-tab ${
            timerMode === 'free' ? 'filter-tab--active' : ''
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

      <div className="timer-content">
        <div className="card card--compact">
          <div className="card__header">
            <h3 className="list-title">Active Tasks</h3>
          </div>
          <div className="card__body">
            {tasks.length > 0 ? (
              <TaskList tasks={tasks} isCompact={true} />
            ) : (
              <div className="list-empty">
                <p>No tasks for {selectedActivity}</p>
              </div>
            )}
          </div>
        </div>

        <div className="card card--compact">
          <div className="card__header">
            <h3 className="list-title">Active Goals</h3>
          </div>
          <div className="card__body">
            {goals.length > 0 ? (
              <GoalList goals={goals} isCompact={true} />
            ) : (
              <div className="list-empty">
                <p>No goals for {selectedActivity}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
