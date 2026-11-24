'use client';

import { useState } from 'react';
import s from './vote.module.css';

// Pick an option (preselected from the email button) and confirm. The vote is sent
// only on this tap, never on page load.
export function VoteConfirm({ token, options, initial }) {
  const [choice, setChoice] = useState(initial);
  const [state, setState] = useState('idle'); // idle | sending | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function confirm() {
    if (!choice) return;
    setState('sending');
    setError('');
    try {
      const res = await fetch('/api/vote/', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Yali-Vote': '1' }, body: JSON.stringify({ token, choice }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      setResult(data);
      setState('done');
    } catch (err) {
      setError(err.message);
      setState('error');
    }
  }

  if (state === 'done') {
    const label = options.find((o) => o.id === result.choice)?.label || result.choice;
    return (
      <div>
        <p className={s.text}>{result.status === 'already' ? 'You had already voted. Your recorded vote is:' : 'Thank you. Your vote is recorded:'}</p>
        <p className={s.result}>{label}</p>
        <p className={s.small}>Votes are final.</p>
      </div>
    );
  }

  return (
    <div>
      <div className={s.options} role="radiogroup" aria-label="Fund term">
        {options.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={choice === o.id} className={choice === o.id ? s.optionOn : s.option} onClick={() => setChoice(o.id)}>
            <span className={s.optionLabel}>{o.label}</span>
            <span className={s.optionNote}>{o.note}</span>
            <span className={s.optionMark}>{choice === o.id ? 'Selected' : 'Select'}</span>
          </button>
        ))}
      </div>
      {error ? <p className={s.error}>{error}</p> : null}
      <button type="button" className={s.confirm} disabled={!choice || state === 'sending'} onClick={confirm}>
        {state === 'sending' ? 'Recording...' : choice ? `Confirm ${options.find((o) => o.id === choice).label}` : 'Select an option'}
      </button>
    </div>
  );
}
