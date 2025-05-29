'use client';

import { useState } from 'react';
import Link from 'next/link';
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
        {success ? (
          <div className="card__body" style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#4caf50', marginBottom: '1rem' }}>
              Account Created Successfully!
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              Please check your email to confirm your registration.
            </p>
            <p>
              <Link href="/login">Return to login</Link> once you&apos;ve
              confirmed your email.
            </p>
          </div>
        ) : (
          <>
            <div className="card__header">
              <h1 className="card__title">Create an Account</h1>
              <p>
                Join thousands of users improving their productivity with Focus.
              </p>
            </div>

            <div className="card__body">
              {error && <div className="form-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>

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
                    minLength={8}
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
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </button>
                </div>
              </form>

              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <p>
                  Already have an account? <Link href="/login">Sign in</Link>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
