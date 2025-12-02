'use client';

import { useState } from 'react';
import styles from './PressMailingList.module.css';

export default function PressMailingList() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setStatus('error');
      setMessage('Please enter your email address');
      return;
    }

    setStatus('loading');

    try {
      // TODO: Replace with your actual mailing list API endpoint
      // For now, we'll simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));

      setStatus('success');
      setMessage('Thank you for subscribing to our press mailing list!');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
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
      </div>
    </div>
  );
}
