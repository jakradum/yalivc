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

export function CreateInvitationButton() {
  const rawId = useFormValue(['_id']);
  const contactMethod = useFormValue(['contactMethod']) || 'email';
  const whatsappNumber = useFormValue(['whatsappNumber']);
  const founderEmail = useFormValue(['founderEmail']);
  const companyName = useFormValue(['companyName']);
  const invitationId = useFormValue(['invitationId']);
  const status = useFormValue(['status']);

  const [state, setState] = useState('idle');
  const [result, setResult] = useState(null); // { link, code? }

  const docId = rawId?.replace(/^drafts\./, '');
  const isUnsaved = !docId;
  const alreadyGenerated = Boolean(invitationId);

  const missingContact =
    contactMethod === 'whatsapp' ? !whatsappNumber : !founderEmail;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yali.vc';

  const generate = async () => {
    if (state === 'loading' || isUnsaved || alreadyGenerated || missingContact) return;
    setState('loading');
    try {
      const res = await fetch(`${origin}/api/pitch-scheduler-invite-manual/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId, contactMethod, whatsappNumber, founderEmail, companyName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setResult({ link: data.link, code: data.code });
      setState('success');
    } catch (err) {
      console.error('Create invitation failed:', err);
      setState('error');
      setTimeout(() => setState('idle'), 6000);
    }
  };

  return (
    <div style={{ padding: '4px 0' }}>
      {isUnsaved && (
        <p style={{ fontSize: '12px', color: '#e65100', marginBottom: '10px' }}>
          Save this document first, then generate.
        </p>
      )}
      {!isUnsaved && missingContact && !alreadyGenerated && (
        <p style={{ fontSize: '12px', color: '#e65100', marginBottom: '10px' }}>
          {contactMethod === 'whatsapp' ? 'Enter a WhatsApp number' : 'Enter a founder email'} above first.
        </p>
      )}
      {alreadyGenerated && !result && (
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '10px', fontStyle: 'italic' }}>
          Already generated ({status}). The code isn&apos;t retrievable again — only stored as a hash. To resend, cancel this invitation and create a new one.
        </p>
      )}

      {result && (
        <div style={{ marginBottom: '16px', padding: '16px 24px', background: '#1a1a1a', borderRadius: '4px' }}>
          <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Link {contactMethod === 'whatsapp' ? '— send both of these over WhatsApp' : '(also emailed to the founder)'}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#fff', wordBreak: 'break-all', marginBottom: result.code ? '14px' : 0 }}>
            {result.link}
          </div>
          {result.code && (
            <>
              <div style={{ fontSize: '11px', color: '#aaa', margin: '10px 0 4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Code (shown once — not stored in plaintext, copy it now)
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '32px', letterSpacing: '0.25em', color: '#fff', fontWeight: 700 }}>
                {result.code}
              </div>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        style={{
          ...btnStyle,
          opacity: state === 'loading' || isUnsaved || alreadyGenerated || missingContact ? 0.4 : 1,
          color: state === 'success' ? '#2e7d32' : state === 'error' ? '#c62828' : '#4b5563',
        }}
        disabled={state === 'loading' || isUnsaved || alreadyGenerated || missingContact}
        onClick={generate}
      >
        {state === 'loading' ? 'Generating...' :
         state === 'success' ? '✓ Generated' :
         state === 'error' ? 'Failed — try again' :
         alreadyGenerated ? 'Already generated' :
         '+ Generate Invitation'}
      </button>

      {result && (
        <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
          Reload the page to see the saved fields below.
        </p>
      )}
    </div>
  );
}
