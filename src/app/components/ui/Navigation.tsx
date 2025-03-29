// src/app/components/ui/Navigation.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './navigation.module.css';
import ThemeToggle from '../layouts/ThemeToggle';
import { useAuth } from '@/context/AuthContext';

export default function Navigation() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          Focus
        </Link>

        <nav className={styles.nav}>
          <Link
            href="/timer"
            className={pathname === '/timer' ? styles.active : ''}
          >
            Timer
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                className={pathname === '/dashboard' ? styles.active : ''}
              >
                Dashboard
              </Link>
              <Link
                href="/analytics"
                className={pathname === '/analytics' ? styles.active : ''}
              >
                Analytics
              </Link>
              <Link
                href="/goals"
                className={pathname === '/goals' ? styles.active : ''}
              >
                Goals
              </Link>
            </>
          ) : null}
        </nav>

        <div className={styles.actions}>
          {user ? (
            <button onClick={handleSignOut} className={styles.signOut}>
              Sign Out
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className={pathname === '/login' ? styles.active : ''}
              >
                Login
              </Link>
              <Link
                href="/register"
                className={
                  pathname === '/register' ? styles.active : styles.register
                }
              >
                Register
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
