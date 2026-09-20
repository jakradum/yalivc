'use client';

import { useMemo, useState } from 'react';
import { FORMATS } from '@/creative/formats';
import { FIXTURES } from '@/creative/fixtures';
import { validateAsset } from '@/creative/validate';
import { compileEmail } from '@/creative/email/compile';
import { AssetPage } from '@/creative/render/AssetRenderer';
import s from './creative.module.css';

const PREVIEW_W = 460;

function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function CreativeClient() {
  const [format, setFormat] = useState('linkedin-square');
  const [doc, setDoc] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [thread, setThread] = useState([]);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState('preview'); // preview | email | json

  const check = useMemo(() => (doc ? validateAsset(doc) : null), [doc]);
  const isEmail = doc && FORMATS[doc.format].kind === 'email';
  const emailHtml = useMemo(() => (isEmail && check?.ok ? compileEmail(doc, { baseUrl: typeof window !== 'undefined' ? window.location.origin : '' }) : ''), [doc, isEmail, check]);

  const loadExample = (key) => {
    const ex = structuredClone(FIXTURES[key]);
    setDoc(ex);
    setFormat(ex.format);
    setThread([{ role: 'assistant', text: `Loaded the example ${key}. Ask for changes, or start fresh.` }]);
    setView('preview');
  };

  async function send() {
    const text = prompt.trim();
    if (!text || busy) return;
    setPrompt('');
    setBusy(true);
    setThread((t) => [...t, { role: 'user', text }]);
    try {
      const history = thread.filter((m) => m.role !== 'error').map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
      const res = await fetch('/api/builder/creative/generate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, doc, prompt: text, history }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
      setDoc(json.doc);
      setThread((t) => [...t, { role: 'assistant', text: json.reply || 'Done.' }]);
    } catch (e) {
      setThread((t) => [...t, { role: 'error', text: e.message }]);
    } finally {
      setBusy(false);
    }
  }

  const f = doc ? FORMATS[doc.format] : FORMATS[format];
  const scale = PREVIEW_W / f.w;

  return (
    <div className={`deck-root ${s.app}`}>
      <header className={s.bar}>
        <a className={s.back} href="../">← Builder</a>
        <span className={s.title}>CREATIVE STUDIO</span>
        <span className={s.beta}>BETA · not saved — download to keep</span>
      </header>

      <aside className={s.left}>
        <div className={s.head}>Format</div>
        <div className={s.pad}>
          <select className={s.select} value={format} disabled={!!doc} onChange={(e) => setFormat(e.target.value)} aria-label="Format">
            {Object.entries(FORMATS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          {doc ? <button className={s.link} onClick={() => { setDoc(null); setThread([]); }}>New asset</button> : null}
          <div className={s.examples}>
            Examples: <button className={s.link} onClick={() => loadExample('carousel')}>carousel</button> · <button className={s.link} onClick={() => loadExample('emailer')}>emailer</button>
          </div>
        </div>

        <div className={s.head}>Ask Claude</div>
        <div className={s.thread}>
          {thread.length === 0 ? (
            <p className={s.hint}>
              Describe the asset: “A 5-card carousel introducing Fund II’s six sectors, ending with a call to action.”
              <br /><br />
              Claude composes it freely from blocks, but only with brand colours, type roles and spacing steps, allowed
              images and links, readable contrast, and sourced numbers. It won’t invent figures.
            </p>
          ) : null}
          {thread.map((m, i) => (
            <div key={i} className={`${s.msg} ${m.role === 'user' ? s.me : `${s.claude} ${m.role === 'error' ? s.err : ''}`}`}>{m.text}</div>
          ))}
          {busy ? <div className={`${s.msg} ${s.claude}`}>Composing… (up to a minute)</div> : null}
        </div>
        <div className={s.compose}>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }} placeholder="What should it be?  (⌘/Ctrl + Enter)" aria-label="Describe the asset" maxLength={2000} />
          <button className={s.send} onClick={send} disabled={busy || !prompt.trim()}>{doc ? 'Refine' : 'Create'}</button>
        </div>
      </aside>

      <main className={s.center}>
        {!doc ? (
          <div className={s.empty}>Nothing yet — describe an asset, or load an example.</div>
        ) : (
          <>
            <div className={s.tabs} role="tablist">
              {[['preview', 'Preview'], ...(isEmail ? [['email', 'Email HTML']] : []), ['json', 'Asset JSON']].map(([k, label]) => (
                <button key={k} role="tab" aria-selected={view === k} className={`${s.tab} ${view === k ? s.tabOn : ''}`} onClick={() => setView(k)}>{label}</button>
              ))}
              <span className={s.spacer} />
              <span className={`${s.status} ${check?.ok ? s.statusOk : s.statusBad}`}>{check?.ok ? 'VALID' : `${check?.errors.length} ISSUE(S)`}{check?.warnings.length ? ` · ${check.warnings.length} note(s)` : ''}</span>
              <button className={s.dl} onClick={() => download(`${doc.id}.json`, JSON.stringify(doc, null, 2), 'application/json')}>Download JSON</button>
              {isEmail && emailHtml ? <button className={s.dl} onClick={() => download(`${doc.id}.html`, emailHtml, 'text/html')}>Download HTML</button> : null}
            </div>

            {view === 'preview' ? (
              <div className={s.pages}>
                {doc.pages.map((p, i) => (
                  <figure key={p.id} className={s.figure}>
                    <div className={s.frame} style={{ width: f.w * scale, ...(f.h ? { height: f.h * scale } : {}) }}>
                      <div style={{ zoom: scale, width: f.w }}>
                        <AssetPage doc={doc} page={p} />
                      </div>
                    </div>
                    <figcaption className={s.cap}>{i + 1} / {doc.pages.length} · {p.id}</figcaption>
                  </figure>
                ))}
              </div>
            ) : null}
            {view === 'email' ? <iframe className={s.mail} title="Email preview" srcDoc={emailHtml} /> : null}
            {view === 'json' ? <pre className={s.json}>{JSON.stringify(doc, null, 2)}</pre> : null}

            {check && (check.errors.length || check.warnings.length) ? (
              <ul className={s.issues}>
                {check.errors.map((e, i) => <li key={`e${i}`} className={s.bad}><code>{e.path}</code> {e.msg}</li>)}
                {check.warnings.map((e, i) => <li key={`w${i}`}><code>{e.path}</code> {e.msg}</li>)}
              </ul>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
