'use client';

import { useState } from 'react';
import styles from './FooterSubscribe.module.css';

export default function FooterSubscribe({ variant = 'dark', showLabel = true }) {
  // variant: 'dark' (footer - burgundy bg) or 'light' (content pages - light bg)
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const isValidEmail = (email) => {
    // Stricter regex: local part, @, domain with dot, valid TLD (2-6 chars)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !isValidEmail(email)) {
      setStatus('error');
      setMessage('Enter a valid email');
      return;
    }

    setStatus('loading');

    try {
      const response = await fetch('/api/subscribe-tattva', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      setStatus('success');
      setMessage('Subscribed!');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Something went wrong');
    }
  };

  const containerClass = variant === 'light'
    ? `${styles.container} ${styles.containerLight}`
    : styles.container;

  return (
    <div className={containerClass}>
      {showLabel && (
        <p className={variant === 'light' ? styles.labelLight : styles.label}>
          Get deep tech insights in your inbox
        </p>
      )}
      {status === 'success' ? (
        <p className={variant === 'light' ? styles.successMessageLight : styles.successMessage}>
          {message}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputWrapper}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={variant === 'light' ? styles.inputLight : styles.input}
              disabled={status === 'loading'}
            />
            <button
              type="submit"
              className={variant === 'light' ? styles.buttonLight : styles.button}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? '...' : '→'}
            </button>
          </div>
          {status === 'error' && (
            <p className={variant === 'light' ? styles.errorMessageLight : styles.errorMessage}>
              {message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
