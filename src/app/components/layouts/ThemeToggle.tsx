'use client';

import { useTheme } from '../../../providers/ThemeProvider'; // Adjust the import path as needed
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme} className={styles.themeToggle}>
      {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🌑'}
      <span className={styles.label}>
        {theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Darker'}
      </span>
    </button>
  );
}
