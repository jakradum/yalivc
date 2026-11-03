'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import s from '../travel.module.css';

export function DecideButtons({ id }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function decide(action) {
    if (action === 'reject' && !window.confirm('Reject this request? The requester will be emailed.')) return;
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/team-travel-decide/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "Couldn't save.");
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className={s.actions}>
      <button type="button" className={s.btn} disabled={busy} onClick={() => decide('approve')}>Approve</button>
      <button type="button" className={s.btnGhost} disabled={busy} onClick={() => decide('reject')}>Reject</button>
      {error && <span className={s.error} role="alert">{error}</span>}
    </div>
  );
}
