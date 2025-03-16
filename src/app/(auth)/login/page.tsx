// src/app/(auth)/login/page.tsx

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from '../auth.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // This is the login handler - replace your existing handleSubmit function with this one
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Attempting to sign in with:', { email });
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      console.log('Sign in result:', result);

      if (result?.error) {
        setError(`Authentication error: ${result.error}`);
        setIsLoading(false);
        return;
      }

      console.log('Sign in successful, redirecting to dashboard');
      // Try this alternative approach
      router.push('/dashboard');

      // If that doesn't work, uncomment this:
      // setTimeout(() => {
      //   window.location.href = '/dashboard';
      // }, 500);
    } catch (error) {
      console.error('Sign in error:', error);
      setError(
        `Exception during sign in: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authForm}>
        <h1>Login</h1>
        <p>Welcome back! Sign in to continue your focus journey.</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.authLinks}>
          <p>
            Don't have an account? <Link href="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
