import { useState, useEffect, useRef } from 'react';

export function SendFullListAction(props) {
  const { draft, published, id } = props;
  const doc = draft || published;

  const [status, setStatus] = useState('idle'); // idle | confirm | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const confirmTimer = useRef(null);

  useEffect(() => () => clearTimeout(confirmTimer.current), []);

  if (!doc) return null;

  const label = {
    idle: '📨 Send to Full List',
    confirm: '⚠️ Click again to confirm',
    loading: 'Sending...',
    success: 'Sent!',
    error: errorMsg ? `Error: ${errorMsg}` : 'Failed — retry?',
  }[status];

  const handle = async () => {
    if (status === 'loading') return;

    if (status !== 'confirm') {
      setStatus('confirm');
      confirmTimer.current = setTimeout(() => setStatus('idle'), 4000);
      return;
    }

    clearTimeout(confirmTimer.current);
    setStatus('loading');

    try {
      const res = await fetch('/api/send-newsletter/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsletterId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');
      setStatus('success');
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err) {
      console.error('Full list send failed:', err);
      setErrorMsg(err.message || 'Unknown error');
      setStatus('error');
      setTimeout(() => { setStatus('idle'); setErrorMsg(''); }, 6000);
    }
  };

  return {
    label,
    tone: status === 'error' ? 'critical' : status === 'success' ? 'positive' : status === 'confirm' ? 'caution' : 'default',
    onHandle: handle,
    disabled: status === 'loading',
  };
}
