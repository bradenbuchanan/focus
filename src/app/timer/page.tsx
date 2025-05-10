// src/app/timer/page.tsx
import TimerContainer from '@/app/components/timer/TimerContainer';
import styles from '@/app/components/timer/timer.module.css';
export default function TimerPage() {
  return (
    <div className={styles.timerPage}>
      <TimerContainer />
    </div>
  );
}
