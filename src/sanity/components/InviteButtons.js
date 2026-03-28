import { useState } from 'react';
import { useFormValue } from 'sanity';

const btnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 14px',
  fontSize: '13px',
  fontFamily: 'inherit',
  fontWeight: 500,
  border: '1px solid currentColor',
  borderRadius: '3px',
  cursor: 'pointer',
  background: 'transparent',
};

export function InviteButtons() {
  const email = useFormValue(['email']);
  const name = useFormValue(['name']);
  const isActive = useFormValue(['isActive']);
  const dataRoomAccess = useFormValue(['dataRoomAccess']);

  const [portalStatus, setPortalStatus] = useState('idle');
  const [dataroomStatus, setDataroomStatus] = useState('idle');

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yali.vc';

  const sendPortalInvite = async () => {
    if (portalStatus === 'loading') return;
    setPortalStatus('loading');
    try {
      const res = await fetch(`${origin}/api/portal-invite-manual/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');
      setPortalStatus('success');
      setTimeout(() => setPortalStatus('idle'), 4000);
    } catch (err) {
      console.error('Portal invite failed:', err);
      setPortalStatus('error');
      setTimeout(() => setPortalStatus('idle'), 6000);
    }
  };

  const sendDataroomInvite = async () => {
    if (dataroomStatus === 'loading') return;
    setDataroomStatus('loading');
    try {
      const res = await fetch(`${origin}/api/dataroom-invite-manual/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');
      setDataroomStatus('success');
      setTimeout(() => setDataroomStatus('idle'), 4000);
    } catch (err) {
      console.error('Dataroom invite failed:', err);
      setDataroomStatus('error');
      setTimeout(() => setDataroomStatus('idle'), 6000);
    }
  };

  const portalLabel =
    portalStatus === 'loading' ? 'Sending...' :
    portalStatus === 'success' ? '✓ Portal invite sent!' :
    portalStatus === 'error' ? 'Failed — retry?' :
    !isActive ? '✉ Portal Invite (user inactive)' :
    '✉ Send Portal Invite';

  const dataroomLabel =
    dataroomStatus === 'loading' ? 'Sending...' :
    dataroomStatus === 'success' ? '✓ Data Room invite sent!' :
    dataroomStatus === 'error' ? 'Failed — retry?' :
    !isActive ? '✉ Data Room Invite (user inactive)' :
    !dataRoomAccess ? '✉ Data Room Invite (access not enabled)' :
    '✉ Send Data Room Invite';

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '4px 0' }}>
      <button
        type="button"
        style={{
          ...btnStyle,
          opacity: !isActive || portalStatus === 'loading' ? 0.4 : 1,
          color: portalStatus === 'success' ? '#2e7d32' : portalStatus === 'error' ? '#c62828' : '#4b5563',
        }}
        disabled={!isActive || portalStatus === 'loading'}
        onClick={sendPortalInvite}
      >
        {portalLabel}
      </button>
      <button
        type="button"
        style={{
          ...btnStyle,
          opacity: !isActive || !dataRoomAccess || dataroomStatus === 'loading' ? 0.4 : 1,
          color: dataroomStatus === 'success' ? '#2e7d32' : dataroomStatus === 'error' ? '#c62828' : '#4b5563',
        }}
        disabled={!isActive || !dataRoomAccess || dataroomStatus === 'loading'}
        onClick={sendDataroomInvite}
      >
        {dataroomLabel}
      </button>
    </div>
  );
}
