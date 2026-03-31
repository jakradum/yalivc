import { useState } from 'react';

export function GeneratePdfAction(props) {
  const { draft, published } = props;
  const doc = draft || published;

  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [errorMsg, setErrorMsg] = useState('');

  if (!doc) return null;

  const slug = doc.slug?.current;
  if (!slug) {
    return {
      label: '⬇ Generate PDF — save slug first',
      tone: 'default',
      onHandle: () => {},
      disabled: true,
    };
  }

  const label = {
    idle: '⬇ Generate PDF',
    loading: 'Generating…',
    done: 'PDF opened in new tab',
    error: errorMsg || 'Error — are you logged into the portal?',
  }[status];

  const handle = async () => {
    if (status === 'loading') return;
    setStatus('loading');

    try {
      // The endpoint is a GET that streams back a PDF binary.
      // Fetch it, check for auth errors, then trigger a browser download.
      const res = await fetch(`/api/generate-pdf/${encodeURIComponent(slug)}`);

      if (res.status === 401 || res.status === 403) {
        throw new Error('Not authorised — log into the LP Portal (partners.yali.vc) first, then retry.');
      }
      if (!res.ok) {
        const text = await res.text().catch(() => 'Unknown error');
        throw new Error(text || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setStatus('done');
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err) {
      console.error('[GeneratePdfAction]', err);
      setErrorMsg(err.message || 'Unknown error');
      setStatus('error');
      setTimeout(() => { setStatus('idle'); setErrorMsg(''); }, 8000);
    }
  };

  return {
    label,
    tone: status === 'error' ? 'critical' : status === 'done' ? 'positive' : 'default',
    onHandle: handle,
    disabled: status === 'loading',
  };
}
