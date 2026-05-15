import { useState } from 'react';

export function GeneratePdfAction(props) {
  const { draft, published } = props;
  const doc = draft || published;

  const [status, setStatus] = useState('idle'); // idle | snapshotting | generating | done | error
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
    snapshotting: 'Snapshotting data…',
    generating: 'Generating PDF…',
    done: 'PDF downloaded',
    error: errorMsg || 'Error — are you logged into the portal?',
  }[status];

  const handle = async () => {
    if (status !== 'idle') return;

    try {
      // Step 1: snapshot the current portal data so the PDF reflects exactly what LPs see
      setStatus('snapshotting');
      const snapRes = await fetch(`/api/snapshot-report/${encodeURIComponent(slug)}`, { method: 'POST' });
      if (snapRes.status === 401 || snapRes.status === 403) {
        throw new Error('Not authorised — log into the LP Portal (partners.yali.vc) first, then retry.');
      }
      if (!snapRes.ok) {
        const text = await snapRes.text().catch(() => 'Unknown error');
        throw new Error(`Snapshot failed: ${text || `HTTP ${snapRes.status}`}`);
      }

      // Step 2: generate the PDF from the freshly-saved snapshot
      setStatus('generating');
      const pdfRes = await fetch(`/api/generate-pdf/${encodeURIComponent(slug)}`);
      if (pdfRes.status === 401 || pdfRes.status === 403) {
        throw new Error('Not authorised — log into the LP Portal (partners.yali.vc) first, then retry.');
      }
      if (!pdfRes.ok) {
        const text = await pdfRes.text().catch(() => 'Unknown error');
        throw new Error(text || `HTTP ${pdfRes.status}`);
      }

      const blob = await pdfRes.blob();
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
    disabled: status !== 'idle',
  };
}
