'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import s from './builder.module.css';

async function api(action, body) {
  const res = await fetch(`/api/deck-builder/${action}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

const fmt = (iso) => new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function BuilderClient({ deckId }) {
  const [st, setSt] = useState(null);
  const [thread, setThread] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(null); // 'edit' | 'publish' | 'pdf' | ...
  const [previewSrc, setPreviewSrc] = useState('');
  const [rev, setRev] = useState(0);
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  const frame = useRef(null);
  const threadEnd = useRef(null);

  // Locally the partners routes live under /partners; on the partners
  // subdomain the proxy serves them at the root.
  const prefix = typeof window !== 'undefined' && window.location.pathname.startsWith('/partners') ? '/partners' : '';

  useEffect(() => {
    setPreviewSrc(`${prefix}/decks/${deckId}/?data=sanity&manifest=draft&r=${rev}`);
  }, [prefix, deckId, rev]);

  const load = useCallback(async () => {
    try {
      setSt(await api('state', { deckId }));
    } catch (e) {
      setThread((t) => [...t, { role: 'error', text: e.message }]);
    }
  }, [deckId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { threadEnd.current?.scrollIntoView({ block: 'end' }); }, [thread]);

  const run = async (label, fn) => {
    setBusy(label);
    try {
      await fn();
    } catch (e) {
      setThread((t) => [...t, { role: 'error', text: e.message }]);
    } finally {
      setBusy(null);
    }
  };

  const send = () => {
    const text = prompt.trim();
    if (!text || busy) return;
    setPrompt('');
    setThread((t) => [...t, { role: 'user', text }]);
    run('edit', async () => {
      const history = thread.filter((m) => m.role !== 'error').map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
      const res = await api('edit', { deckId, prompt: text, history });
      setSt(res);
      setThread((t) => [...t, { role: 'assistant', text: res.reply || (res.changed ? 'Done.' : 'No changes made.') }]);
      if (res.changed) setRev((r) => r + 1);
    });
  };

  const apply = (ops) =>
    run('apply', async () => {
      setSt(await api('apply', { deckId, ops }));
      setRev((r) => r + 1);
    });

  const act = (action, msg) =>
    run(action, async () => {
      setSt(await api(action, { deckId }));
      setRev((r) => r + 1);
      if (msg) setThread((t) => [...t, { role: 'assistant', text: msg }]);
    });

  const exportPdf = (manifest) =>
    run('pdf', async () => {
      const res = await fetch(`/api/decks/${deckId}/pdf/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataSource: 'sanity', manifest }),
      });
      if (!res.ok) throw new Error(res.status === 504 ? 'PDF timed out (60s limit). Try again.' : `PDF export failed (${res.status})`);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${deckId}${manifest === 'draft' ? '-draft' : ''}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    });

  const jump = (id) => frame.current?.contentDocument?.getElementById(id)?.scrollIntoView({ block: 'start' });

  const onDrop = (targetId) => {
    if (dragId && targetId && dragId !== targetId) {
      const pos = st.slides.findIndex((x) => x.id === targetId) + 1;
      apply([{ tool: 'move_slide', input: { id: dragId, position: pos } }]);
    }
    setDragId(null);
    setOverId(null);
  };

  const dirty = st?.hasDraft;

  return (
    <div className={`deck-root ${s.app}`}>
      <header className={s.bar}>
        <span className={s.title}>DECK BUILDER · {deckId}</span>
        <span className={`${s.badge} ${dirty ? s.badgeDraft : ''}`}>{st ? (dirty ? 'UNPUBLISHED CHANGES' : 'PUBLISHED') : '…'}</span>
        <button className={s.btn} disabled={!!busy || !st?.log?.some((l) => l.key)} onClick={() => act('undo', 'Undid the last edit.')}>Undo last</button>
        <button className={s.btn} disabled={!!busy || !dirty} onClick={() => window.confirm('Throw away all unpublished changes?') && act('discard', 'Discarded the draft.')}>Discard draft</button>
        <button className={s.btn} disabled={!!busy} onClick={() => exportPdf('draft')}>{busy === 'pdf' ? 'Exporting… (~30s)' : 'Export PDF (draft)'}</button>
        <button className={`${s.btn} ${s.btnPrimary}`} disabled={!!busy || !dirty} onClick={() => window.confirm('Publish these changes to the live deck?') && act('publish', 'Published.')}>Publish</button>
      </header>

      <aside className={s.left}>
        <div className={s.head}>Ask Claude</div>
        <div className={s.thread}>
          {thread.length === 0 ? (
            <p className={s.hint}>
              Describe a change: “move Fund I before Our Process”, “rename the Thesis divider to Where we invest”, “add a divider called Media before the media slide”.
              <br /><br />
              Claude can reorder, add/remove existing slides and edit slide text. It can’t change layouts, or facts like people and portfolio — and it never publishes.
            </p>
          ) : null}
          {thread.map((m, i) => (
            <div key={i} className={`${s.msg} ${m.role === 'user' ? s.me : `${s.claude} ${m.role === 'error' ? s.err : ''}`}`}>{m.text}</div>
          ))}
          {busy === 'edit' ? <div className={`${s.msg} ${s.claude}`}>Working…</div> : null}
          <div ref={threadEnd} />
        </div>
        <div className={s.compose}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
            placeholder="What should change?  (⌘/Ctrl + Enter to send)"
            aria-label="Describe the change"
            maxLength={2000}
          />
          <button className={s.send} onClick={send} disabled={!!busy || !prompt.trim()}>Send</button>
        </div>
        <div className={s.log}>
          <div className={s.head} style={{ padding: '10px 0 4px' }}>Edit log</div>
          {(st?.log || []).length === 0 ? <div className={s.hint}>No edits yet.</div> : null}
          {(st?.log || []).map((l) => (
            <div key={l.key} className={s.logRow}>
              <b>{fmt(l.at)} · {l.by?.split('@')[0]}</b><br />
              {l.prompt ? `“${l.prompt}” → ` : ''}{l.summary}
            </div>
          ))}
        </div>
      </aside>

      <main className={s.center}>
        {previewSrc ? <iframe ref={frame} src={previewSrc} title="Deck preview (draft)" /> : null}
        {busy && busy !== 'edit' && busy !== 'pdf' ? <div className={s.busy}>Working…</div> : null}
      </main>

      <aside className={s.right}>
        <div className={s.head}>Slides · drag to reorder</div>
        <ul className={s.list}>
          {(st?.slides || []).map((sl, i) => (
            <li
              key={sl.id}
              className={`${s.slideRow} ${overId === sl.id && dragId !== sl.id ? s.over : ''}`}
              draggable
              onDragStart={() => setDragId(sl.id)}
              onDragOver={(e) => { e.preventDefault(); setOverId(sl.id); }}
              onDrop={() => onDrop(sl.id)}
              onDragEnd={() => { setDragId(null); setOverId(null); }}
            >
              <span className={s.num}>{i + 1}</span>
              <button className={s.sid} onClick={() => jump(sl.id)} title={`${sl.type} — click to jump`}>{sl.id}</button>
              {sl.overridden.length ? <span className={s.edited} title={`Edited: ${sl.overridden.join(', ')}`}>edited</span> : null}
              <button className={s.x} aria-label={`Remove ${sl.id}`} disabled={!!busy} onClick={() => apply([{ tool: 'remove_slide', input: { id: sl.id } }])}>×</button>
            </li>
          ))}
        </ul>
        {st?.removed?.length ? (
          <>
            <div className={s.head}>Removed</div>
            {st.removed.map((r) => (
              <div key={r.ref} className={s.addRow}>
                <span>{r.ref}</span>
                <button disabled={!!busy} onClick={() => apply([{ tool: 'add_slide', input: { ref: r.ref } }])}>add back</button>
              </div>
            ))}
          </>
        ) : null}
        <div className={s.addRow} style={{ borderTop: '1px solid #ddd' }}>
          <span>New section divider</span>
          <button disabled={!!busy} onClick={() => apply([{ tool: 'add_slide', input: { ref: 'section-divider' } }])}>+ add</button>
        </div>
        <div className={s.addRow}>
          <button disabled={!!busy} onClick={() => exportPdf('published')}>Export published PDF</button>
        </div>
      </aside>
    </div>
  );
}
