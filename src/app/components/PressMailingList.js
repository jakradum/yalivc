'use client';

import { useState } from 'react';
import styles from './PressMailingList.module.css';
import Button from './button';

export default function PressMailingList() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
      const response = await fetch('/api/subscribe-press', {
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
      setMessage('Thank you for subscribing to our press mailing list!');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h3 className={styles.title}>Join our press mailing list</h3>
        <p className={styles.description}>
          Stay updated with the latest news and press releases from Yali Capital.
        </p>

        {status === 'success' ? (
          <p className={styles.successMessage}>{message}</p>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputWrapper}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={styles.input}
                disabled={status === 'loading'}
              />
              <button
                type="submit"
                className={styles.button}
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
            {status === 'error' && (
              <p className={styles.errorMessage}>{message}</p>
            )}
          </form>
        )}

        <div className={styles.mediaKitLink}>
          <p>Covering us in your story?</p>
          <Button href="/newsroom/press-downloads" color="black">Use our media kit</Button>
        </div>
      </div>
    </div>
  );
}
