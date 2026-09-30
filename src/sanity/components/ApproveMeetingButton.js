import { useMemo, useState } from 'react';
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

const fieldStyle = {
  width: '100%',
  fontFamily: 'inherit',
  fontSize: '13px',
  padding: '8px 10px',
  marginBottom: '10px',
  border: '1px solid #3a3a3a',
  borderRadius: '3px',
  background: '#1a1a1a',
  color: '#fff',
};

const toggleStyle = (active) => ({
  ...btnStyle,
  color: active ? '#fff' : '#888',
  background: active ? '#3a3a3a' : 'transparent',
  marginRight: '8px',
});

// Best-effort "Shobhit" from "shobhit@avataar.vc" - just a starting point for
// the draft body below; Pranav reviews and can edit the wording before
// sending either way.
function guessFirstName(email) {
  if (!email) return '';
  const local = email.split('@')[0].split(/[._+-]/)[0];
  return local ? local[0].toUpperCase() + local.slice(1) : '';
}

// Mirrors the wording Pranav actually uses in his own "Virtual Pitch
// Meeting: ..." / "In-person Meeting: ..." invites - see the two real
// examples this was built from (Avataar Ventures, 13 Oct; Masterkey
// Holdings, 7 Oct).
function buildDraft(format, { companyName, founderEmail, addressLink }) {
  const firstName = guessFirstName(founderEmail);
  const subject = format === 'in-person'
    ? `In-person Meeting: ${companyName} <> Yali`
    : `Virtual Pitch Meeting: ${companyName} <> Yali`;

  const body = format === 'in-person'
    ? `Hi all,\n\nWe are joined by ${firstName ? firstName + ' from ' : ''}${companyName} for an in-person meeting at the Yali office.\nDear ${firstName || 'all'}: please see the address here: ${addressLink || '[address link]'}\n\n`
    : `Hi all,\n\nWe are joined by ${firstName ? firstName + ' from ' : ''}${companyName} for a virtual pitch meeting.\n\n`;

  return { subject, body };
}

export function ApproveMeetingButton() {
  const rawId = useFormValue(['_id']);
  const status = useFormValue(['status']);
  const companyName = useFormValue(['companyName']) || '(company)';
  const founderEmail = useFormValue(['founderEmail']);
  const teammateEmails = useFormValue(['teammateEmails']) || [];
  const calendarEventId = useFormValue(['calendarEventId']);
  const savedFormat = useFormValue(['meetingFormat']);
  const savedAddressLink = useFormValue(['addressLink']);

  const docId = rawId?.replace(/^drafts\./, '');
  const initial = useMemo(
    () => buildDraft(savedFormat || 'virtual', { companyName, founderEmail, addressLink: savedAddressLink }),
    // Only seed once on mount - after that, toggling format regenerates
    // explicitly (see handleToggle) rather than fighting the user's edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [format, setFormat] = useState(savedFormat || 'virtual');
  const [addressLink, setAddressLink] = useState(savedAddressLink || '');
  const [subject, setSubject] = useState(initial.subject);
  const [bodyText, setBodyText] = useState(initial.body);
  const [state, setState] = useState('idle');
  const [result, setResult] = useState(null);

  const attendeesPreview = ['investment-team@yali.vc', founderEmail || '(no contact email)', ...teammateEmails].join(', ');

  const handleToggle = (next) => {
    setFormat(next);
    const draft = buildDraft(next, { companyName, founderEmail, addressLink });
    setSubject(draft.subject);
    setBodyText(draft.body);
  };

  if (status !== 'submitted' && !calendarEventId) {
    return (
      <p style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
        Shows up once a founder has picked a slot (status: submitted).
      </p>
    );
  }

  if (calendarEventId) {
    return (
      <p style={{ fontSize: '13px', color: '#4ade80' }}>
        ✓ Meeting scheduled ({savedFormat || format}). Calendar event already created — see Calendar Event ID below.
      </p>
    );
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yali.vc';

  const approve = async () => {
    if (state === 'loading' || !docId) return;
    setState('loading');
    try {
      const res = await fetch(`${origin}/api/pitch-scheduler-approve-meeting/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId, subject, bodyText, format, addressLink }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setResult(data);
      setState('success');
    } catch (err) {
      console.error('Approve meeting failed:', err);
      setState('error');
      setTimeout(() => setState('idle'), 6000);
    }
  };

  return (
    <div style={{ padding: '4px 0' }}>
      {!docId && (
        <p style={{ fontSize: '12px', color: '#e65100', marginBottom: '10px' }}>Save this document first.</p>
      )}

      <div style={{ marginBottom: '12px' }}>
        <button type="button" style={toggleStyle(format === 'virtual')} onClick={() => handleToggle('virtual')}>Virtual</button>
        <button type="button" style={toggleStyle(format === 'in-person')} onClick={() => handleToggle('in-person')}>In-person</button>
      </div>

      {format === 'in-person' && (
        <input
          type="text"
          placeholder="Google Maps link for the office"
          value={addressLink}
          onChange={(e) => setAddressLink(e.target.value)}
          style={fieldStyle}
        />
      )}

      <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} style={fieldStyle} />
      <textarea rows={6} value={bodyText} onChange={(e) => setBodyText(e.target.value)} style={{ ...fieldStyle, resize: 'vertical' }} />

      <p style={{ fontSize: '11px', color: '#888', marginBottom: '12px' }}>
        Attendees: {attendeesPreview}
      </p>

      {result && (
        <div style={{ marginBottom: '12px', padding: '12px 16px', background: '#1a1a1a', borderRadius: '4px' }}>
          <div style={{ fontSize: '13px', color: '#4ade80', marginBottom: result.joinUrl ? '8px' : 0 }}>✓ Calendar event created and sent.</div>
          {result.joinUrl && <div style={{ fontSize: '12px', color: '#aaa', wordBreak: 'break-all' }}>{result.joinUrl}</div>}
        </div>
      )}

      <button
        type="button"
        style={{
          ...btnStyle,
          opacity: state === 'loading' || !docId ? 0.4 : 1,
          color: state === 'success' ? '#2e7d32' : state === 'error' ? '#c62828' : '#4b5563',
        }}
        disabled={state === 'loading' || !docId || state === 'success'}
        onClick={approve}
      >
        {state === 'loading' ? 'Sending...' : state === 'success' ? '✓ Sent' : state === 'error' ? 'Failed — try again' : 'Approve & Send'}
      </button>

      {result && (
        <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>Reload the page to see the saved fields below.</p>
      )}
    </div>
  );
}
