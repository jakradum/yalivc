'use client';

import { useState } from 'react';
import s from './home.module.css';

// Exports the *published* deck (what the live routes show). ~25s cold.
export function ExportPdfButton({ deckId }) {
  const [state, setState] = useState('idle'); // idle | working | error
  const [msg, setMsg] = useState('');

  async function run() {
    setState('working');
    setMsg('');
    try {
      const res = await fetch(`/api/decks/${deckId}/pdf/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataSource: 'sanity', manifest: 'published' }),
      });
      if (!res.ok) throw new Error(res.status === 504 ? 'Timed out (60s limit). Try again.' : `Export failed (${res.status})`);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${deckId}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
      setState('idle');
    } catch (e) {
      setMsg(e.message);
      setState('error');
    }
  }

  return (
    <span className={s.exportWrap}>
      <button className={s.btn} onClick={run} disabled={state === 'working'}>
        {state === 'working' ? 'Exporting… (~30s)' : 'Export PDF'}
      </button>
      {state === 'error' ? <span className={s.err} role="alert">{msg}</span> : null}
    </span>
  );
}
