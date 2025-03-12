import TimerContainer from '@/components/timer/TimerContainer';
import styles from './timer.module.css';

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
