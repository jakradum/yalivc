'use client';

import Link from 'next/link';
import styles from './styles/not-found.module.css';

export default function Error({ reset }) {
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Something went wrong</h1>
      <p className={styles.sub}>
        An unexpected error occurred. Try refreshing the page.
      </p>
      <button
        onClick={reset}
        className={styles.link}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        Try again
      </button>
      <Link href="/" className={styles.link} style={{ marginTop: '1rem' }}>
        Go back to yali.vc
      </Link>
    </div>
  );
}
