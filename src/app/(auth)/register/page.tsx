// src/app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from '../auth.module.css';
import formStyles from '@/app/styles/shared/forms.module.css';
import buttonStyles from '@/app/styles/shared/buttons.module.css';
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
      const result = await signUp(email, password, name);

      if (result.success) {
        setSuccess(true);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(
        'Registration failed: Something went wrong. Please try again later.'
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

            {error && <div className={formStyles.error}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className={formStyles.formGroup}>
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={formStyles.input}
                />
              </div>

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
                  minLength={8}
                  className={formStyles.input}
                />
              </div>

              <div className={formStyles.formActions}>
                <button
                  type="submit"
                  className={buttonStyles.primaryButton}
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
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
