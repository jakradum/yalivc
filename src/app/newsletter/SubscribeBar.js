'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function SubscribeBar() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe-tattva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className={styles.subscribeBar}>
      <span className={styles.subscribeText}>Get new editions by email</span>
      {status === 'success' ? (
        <span className={styles.subscribeSuccess}>You&apos;re on the list.</span>
      ) : status === 'error' ? (
        <span className={styles.subscribeSuccess}>Something went wrong. Try again.</span>
      ) : (
        <form className={styles.subscribeForm} onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className={styles.subscribeInput}
            required
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            className={styles.subscribeButton}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? '...' : 'SUBSCRIBE'}
          </button>
        </form>
      )}
    </div>
  );
}
