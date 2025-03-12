import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Focus</h1>
        <p className={styles.subtitle}>
          A simple, powerful tool to boost your productivity
        </p>

        <div className={styles.features}>
          <div className={styles.feature}>
            <h3>Pomodoro Timer</h3>
            <p>Use scientifically-proven time blocking to maximize focus</p>
          </div>
          <div className={styles.feature}>
            <h3>Track Progress</h3>
            <p>Monitor your productivity habits and see improvements</p>
          </div>
          <div className={styles.feature}>
            <h3>Group Challenges</h3>
            <p>Motivate each other with group focused sessions</p>
          </div>
        </div>

        <div className={styles.ctas}>
          <Link href="/timer" className={styles.primary}>
            Start Focusing
          </Link>
          <Link href="/register" className={styles.secondary}>
            Create Account
          </Link>
        </div>
      </main>
    </div>
  );
}
