import { useState } from 'react';

export function SendDataroomInviteAction(props) {
  const { draft, published } = props;
  const doc = draft || published;

  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  if (!doc) return null;

  const { email, name } = doc;
  const noAccess = doc.noAccess === true;
  const dataRoomAccess = doc.dataRoomAccess === true; // backward-compat fallback
  const investorDataRoomAccess = doc.investorDataRoomAccess;
  const notReady = noAccess || !(investorDataRoomAccess ?? dataRoomAccess);

  const idleLabel = notReady
    ? `✉ Send Data Room Invite — ${noAccess ? 'Access revoked' : 'Enable Investor Data Room Access first'}`
    : '✉ Send Data Room Invite';

  const label = {
    idle: idleLabel,
    loading: 'Sending...',
    success: 'Invite sent!',
    error: errorMsg ? `Error: ${errorMsg}` : 'Failed — retry?',
  }[status];

  const handle = async () => {
    if (status === 'loading' || notReady) return;
    setStatus('loading');

    try {
      const res = await fetch('/api/dataroom-invite-manual/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');

      setStatus('success');
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err) {
      console.error('Dataroom invite failed:', err);
      setErrorMsg(err.message || 'Unknown error');
      setStatus('error');
      setTimeout(() => { setStatus('idle'); setErrorMsg(''); }, 6000);
    }
  };

  return {
    label,
    tone: status === 'error' ? 'critical' : status === 'success' ? 'positive' : 'default',
    onHandle: handle,
    disabled: status === 'loading',
  };
}
