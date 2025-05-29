'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
      }}
    >
      <div
        className="card card--elevated"
        style={{
          width: '100%',
          maxWidth: '420px',
        }}
      >
        <div className="card__header">
          <h1 className="card__title">Login</h1>
          <p>Welcome back! Sign in to continue your focus journey.</p>
        </div>

        <div className="card__body">
          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className={`btn btn--primary btn--full ${
                  isLoading ? 'btn--loading' : ''
                }`}
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p>
              Don&apos;t have an account? <Link href="/register">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
