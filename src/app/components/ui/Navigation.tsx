'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import styles from './navigation.module.css';

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

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

          {session ? (
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
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className={styles.signOut}
              >
                Sign Out
              </button>
            </>
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
        </nav>
      </div>
    </header>
  );
}
