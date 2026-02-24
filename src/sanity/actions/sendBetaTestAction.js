import { useState } from 'react';

export function SendBetaTestAction(props) {
  const { draft, published, id } = props;
  const doc = draft || published;

  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  if (!doc) return null;

  const label = {
    idle: '🧪 Send Beta Test',
    loading: 'Sending...',
    success: 'Sent!',
    error: 'Failed — retry?',
  }[status];

  const handle = async () => {
    if (status === 'loading') return;
    setStatus('loading');

    try {
      const res = await fetch('/api/send-newsletter-beta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsletterId: id }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Unknown error');

      setStatus('success');
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err) {
      console.error('Beta send failed:', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  return {
    label,
    tone: status === 'error' ? 'critical' : status === 'success' ? 'positive' : 'default',
    onHandle: handle,
    disabled: status === 'loading',
  };
}
