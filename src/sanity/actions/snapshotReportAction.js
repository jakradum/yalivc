import { useState } from 'react';

export function SnapshotReportAction(props) {
  const { draft, published } = props;
  const doc = draft || published;

  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const [lastSnapshotAt, setLastSnapshotAt] = useState(doc?.snapshotTimestamp || null);

  if (!doc) return null;

  const slug = doc.slug?.current;
  if (!slug) {
    return {
      label: '📸 Snapshot Data — save slug first',
      tone: 'default',
      onHandle: () => {},
      disabled: true,
    };
  }

  const fmtTimestamp = (ts) => {
    if (!ts) return null;
    return new Date(ts).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const label = {
    idle: lastSnapshotAt
      ? `📸 Re-snapshot Data (last: ${fmtTimestamp(lastSnapshotAt)})`
      : '📸 Snapshot Report Data',
    loading: 'Snapshotting…',
    done: 'Snapshot saved — PDF will use this data',
    error: errorMsg || 'Error — are you logged into the portal?',
  }[status];

  const handle = async () => {
    if (status === 'loading') return;
    setStatus('loading');
    try {
      const res = await fetch(`/api/snapshot-report/${encodeURIComponent(slug)}`, { method: 'POST' });
      if (res.status === 401 || res.status === 403) {
        throw new Error('Not authorised — log into the LP Portal first, then retry.');
      }
      if (!res.ok) {
        const text = await res.text().catch(() => 'Unknown error');
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setLastSnapshotAt(data.snapshotTimestamp);
      setStatus('done');
      setTimeout(() => setStatus('idle'), 6000);
    } catch (err) {
      console.error('[SnapshotReportAction]', err);
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
