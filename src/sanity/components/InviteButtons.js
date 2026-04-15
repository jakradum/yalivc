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
  const noAccess = useFormValue(['noAccess']);
  const lpPortalAccess = useFormValue(['lpPortalAccess']);
  const isActive = useFormValue(['isActive']); // backward-compat fallback (pre-migration)
  const investorDataRoomAccess = useFormValue(['investorDataRoomAccess']);

  const [portalStatus, setPortalStatus] = useState('idle');
  const [dataroomStatus, setDataroomStatus] = useState('idle');

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yali.vc';

  // lpPortalAccess ?? isActive: use new field if set, fall back to old field before migration
  const portalDisabled = noAccess || !(lpPortalAccess ?? isActive);
  const dataroomDisabled = noAccess || !investorDataRoomAccess;

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
    noAccess ? '✉ Portal Invite (access revoked)' :
    portalDisabled ? '✉ Portal Invite (LP Portal Access not enabled)' :
    '✉ Send Portal Invite';

  const dataroomLabel =
    dataroomStatus === 'loading' ? 'Sending...' :
    dataroomStatus === 'success' ? '✓ Data Room invite sent!' :
    dataroomStatus === 'error' ? 'Failed — retry?' :
    noAccess ? '✉ Data Room Invite (access revoked)' :
    !investorDataRoomAccess ? '✉ Data Room Invite (Investor Data Room Access not enabled)' :
    '✉ Send Data Room Invite';

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '4px 0' }}>
      <button
        type="button"
        style={{
          ...btnStyle,
          opacity: portalDisabled || portalStatus === 'loading' ? 0.4 : 1,
          color: portalStatus === 'success' ? '#2e7d32' : portalStatus === 'error' ? '#c62828' : '#4b5563',
        }}
        disabled={portalDisabled || portalStatus === 'loading'}
        onClick={sendPortalInvite}
      >
        {portalLabel}
      </button>
      <button
        type="button"
        style={{
          ...btnStyle,
          opacity: dataroomDisabled || dataroomStatus === 'loading' ? 0.4 : 1,
          color: dataroomStatus === 'success' ? '#2e7d32' : dataroomStatus === 'error' ? '#c62828' : '#4b5563',
        }}
        disabled={dataroomDisabled || dataroomStatus === 'loading'}
        onClick={sendDataroomInvite}
      >
        {dataroomLabel}
      </button>
    </div>
  );
}
