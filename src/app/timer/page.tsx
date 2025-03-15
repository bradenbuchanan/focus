// src/app/timer/page.tsx
import TimerContainer from '@/app/components/timer/TimerContainer';
import styles from '@/app/components/timer/timer.module.css';

export default function TimerPage() {
  return (
    <div className={styles.timerPage}>
      <h1>Focus Timer</h1>
      <p>
        Stay focused and boost your productivity with the Pomodoro technique.
      </p>
      <TimerContainer />
    </div>
  );
}
