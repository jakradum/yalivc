'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

function UnsubscribeCard() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [state, setState] = useState('confirm'); // confirm | done

  let displayEmail = '';
  try {
    displayEmail = token ? atob(token) : '';
  } catch { /* invalid token — show nothing */ }

  const handleConfirm = async () => {
    try {
      await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    } catch { /* swallow */ }
    setState('done');
  };

  if (state === 'done') {
    return (
      <div className={styles.card}>
        <p className={styles.label}>UNSUBSCRIBE</p>
        <h1 className={styles.heading}>Done.</h1>
        <p className={styles.body}>You have been removed. You will not hear from us again.</p>
        <Link href="/" className={styles.backLinkDone}>← Back to yali.vc</Link>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <p className={styles.label}>UNSUBSCRIBE</p>
      <h1 className={styles.heading}>Remove from list</h1>
      <p className={styles.body}>
        You will stop receiving the Yali Capital newsletter. No further emails will be sent to this address.
      </p>
      {displayEmail && <div className={styles.emailBox}>{displayEmail}</div>}
      <button className={styles.button} onClick={handleConfirm}>CONFIRM UNSUBSCRIBE</button>
      <Link href="/" className={styles.backLink}>← Back to yali.vc</Link>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div className={styles.page}>
      <Suspense>
        <UnsubscribeCard />
      </Suspense>
    </div>
  );
}
