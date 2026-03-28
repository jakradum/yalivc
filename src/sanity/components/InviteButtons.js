import { useState } from 'react';
import { Button, Flex, Text, Box } from '@sanity/ui';
import { useFormValue } from 'sanity';

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
    <Box padding={1}>
      <Flex gap={3} wrap="wrap">
        <Button
          text={portalLabel}
          tone={portalStatus === 'error' ? 'critical' : portalStatus === 'success' ? 'positive' : 'default'}
          mode="ghost"
          disabled={!isActive || portalStatus === 'loading'}
          onClick={sendPortalInvite}
        />
        <Button
          text={dataroomLabel}
          tone={dataroomStatus === 'error' ? 'critical' : dataroomStatus === 'success' ? 'positive' : 'default'}
          mode="ghost"
          disabled={!isActive || !dataRoomAccess || dataroomStatus === 'loading'}
          onClick={sendDataroomInvite}
        />
      </Flex>
    </Box>
  );
}
