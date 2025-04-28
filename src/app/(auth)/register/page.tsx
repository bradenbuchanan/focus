// src/app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from '../auth.module.css';
import { useAuth } from '@/context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signUp(email, password, name);
      setSuccess(true);
    } catch (error) {
      console.error('Registration error:', error);
      setError(
        `Registration failed: ${
          error instanceof Error ? error.message : 'Something went wrong'
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authForm}>
        {success ? (
          <div className={styles.successMessage}>
            <h2>Account Created Successfully!</h2>
            <p>Please check your email to confirm your registration.</p>
            <p>
              <Link href="/login">Return to login</Link> once you&apos;ve
              confirmed your email.
            </p>
          </div>
        ) : (
          <>
            <h1>Create an Account</h1>
            <p>
              Join thousands of users improving their productivity with Focus.
            </p>

            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

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
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className={styles.authLinks}>
              <p>
                Already have an account? <Link href="/login">Sign in</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
