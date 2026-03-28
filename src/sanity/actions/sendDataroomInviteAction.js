import { useState } from 'react';

export function SendDataroomInviteAction(props) {
  const { draft, published } = props;
  const doc = draft || published;

  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  if (!doc) return null;

  const { email, name, isActive, dataRoomAccess } = doc;

  const isDisabled = !isActive || !dataRoomAccess || status === 'loading';

  const disabledReason = !dataRoomAccess
    ? 'Enable Data Room Access first'
    : !isActive
    ? 'Activate this user first'
    : null;

  const label = {
    idle: '✉ Send Data Room Invite',
    loading: 'Sending...',
    success: 'Invite sent!',
    error: errorMsg ? `Error: ${errorMsg}` : 'Failed — retry?',
  }[status];

  const handle = async () => {
    if (isDisabled) return;
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
    label: disabledReason ? `✉ Send Data Room Invite — ${disabledReason}` : label,
    tone: status === 'error' ? 'critical' : status === 'success' ? 'positive' : 'default',
    onHandle: handle,
    disabled: isDisabled,
  };
}
