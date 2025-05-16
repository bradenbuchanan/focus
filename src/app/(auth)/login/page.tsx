// src/app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../auth.module.css';
import formStyles from '@/app/styles/shared/forms.module.css';
import buttonStyles from '@/app/styles/shared/buttons.module.css';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (error) {
      console.error('Sign in error:', error);
      setError(
        `Login failed: ${
          error instanceof Error ? error.message : 'Invalid credentials'
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authForm}>
        <h1>Login</h1>
        <p>Welcome back! Sign in to continue your focus journey.</p>

        {error && <div className={formStyles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={formStyles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={formStyles.input}
            />
          </div>

          <div className={formStyles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={formStyles.input}
            />
          </div>

          <div className={formStyles.formActions}>
            <button
              type="submit"
              className={buttonStyles.primaryButton}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className={styles.authLinks}>
          <p>
            Don&apos;t have an account? <Link href="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
