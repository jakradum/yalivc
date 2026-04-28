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

export function GenerateCodeButton() {
  const rawId = useFormValue(['_id']);
  const storedCode = useFormValue(['inviteCode']);
  const storedExpiry = useFormValue(['codeExpiry']);
  const usedCount = useFormValue(['usedCount']);

  const [status, setStatus] = useState('idle');
  const [liveCode, setLiveCode] = useState(null);
  const [liveExpiry, setLiveExpiry] = useState(null);

  const docId = rawId?.replace(/^drafts\./, '');
  const isUnsaved = !docId;

  const displayCode = liveCode ?? storedCode;
  const displayExpiry = liveExpiry ?? storedExpiry;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yali.vc';

  const generate = async () => {
    if (status === 'loading' || isUnsaved) return;
    setStatus('loading');
    try {
      const res = await fetch(`${origin}/api/domain-privilege-generate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setLiveCode(data.code);
      setLiveExpiry(data.expiry);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err) {
      console.error('Generate code failed:', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  return (
    <div style={{ padding: '4px 0' }}>
      {displayCode ? (
        <div style={{
          marginBottom: '16px',
          padding: '16px 24px',
          background: '#1a1a1a',
          borderRadius: '4px',
          display: 'inline-block',
          minWidth: '200px',
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: '36px', letterSpacing: '0.25em', color: '#fff', fontWeight: 700 }}>
            {displayCode}
          </div>
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '8px', lineHeight: 1.6 }}>
            {displayExpiry
              ? `Expires ${new Date(displayExpiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
              : 'No expiry set'}
            {typeof usedCount === 'number' && !liveCode
              ? ` · ${usedCount} use${usedCount !== 1 ? 's' : ''} so far`
              : liveCode ? ' · 0 uses so far (just generated)' : ''}
          </div>
        </div>
      ) : (
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '12px', fontStyle: 'italic' }}>
          No code generated yet.
        </p>
      )}

      {isUnsaved && (
        <p style={{ fontSize: '12px', color: '#e65100', marginBottom: '10px' }}>
          Save this document first, then generate a code.
        </p>
      )}

      <button
        type="button"
        style={{
          ...btnStyle,
          opacity: status === 'loading' || isUnsaved ? 0.4 : 1,
          color: status === 'success' ? '#2e7d32' : status === 'error' ? '#c62828' : '#4b5563',
        }}
        disabled={status === 'loading' || isUnsaved}
        onClick={generate}
      >
        {status === 'loading' ? 'Generating...' :
         status === 'success' ? '✓ Code generated!' :
         status === 'error' ? 'Failed — try again' :
         displayCode ? '⟳ Regenerate Code' : '+ Generate Code'}
      </button>

      {liveCode && (
        <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
          Reload the page to confirm the code is saved.
        </p>
      )}
    </div>
  );
}
