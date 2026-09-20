'use client';

import { useMemo, useRef, useState } from 'react';
import { FORMATS } from '@/creative/formats';
import { FIXTURES } from '@/creative/fixtures';
import { validateAsset } from '@/creative/validate';
import { compileEmail } from '@/creative/email/compile';
import { AssetPage } from '@/creative/render/AssetRenderer';
import s from './creative.module.css';

const PREVIEW_W = 460;
const MAX_SIDE = 2400;

// Keeps uploads under the ~4MB request limit: large pictures are redrawn at
// up to 2400px on the long side (WebP keeps transparency for logos).
async function shrink(file) {
  if (file.size <= 3.5 * 1024 * 1024) return file;
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise((res) => c.toBlob(res, 'image/webp', 0.9));
  return new File([blob], file.name.replace(/\.\w+$/, '.webp'), { type: 'image/webp' });
}

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
  const [library, setLibrary] = useState({});
  const [pending, setPending] = useState(null); // file awaiting its details
  const [meta, setMeta] = useState({ kind: 'photo', alt: '', description: '', noCrop: false, people: false, ground: 'any' });
  const [uploading, setUploading] = useState(false);
  const [upError, setUpError] = useState('');
  const picker = useRef(null);

  // The library lives with the asset: it's rendered, validated and downloaded together.
  const withLib = useMemo(() => (doc ? { ...doc, assets: library } : null), [doc, library]);
  const check = useMemo(() => (withLib ? validateAsset(withLib) : null), [withLib]);
  const isEmail = doc && FORMATS[doc.format].kind === 'email';
  const hasContent = !!doc?.pages.some((pg) => (pg.root.children || []).length > 0);
  const emailHtml = useMemo(() => (isEmail && check?.ok ? compileEmail(withLib, { baseUrl: typeof window !== 'undefined' ? window.location.origin : '' }) : ''), [withLib, isEmail, check]);

  const loadExample = (key) => {
    const ex = structuredClone(FIXTURES[key]);
    setDoc(ex);
    setLibrary(ex.assets || {});
    setFormat(ex.format);
    setThread([{ role: 'assistant', text: `Loaded the example ${key}. Ask for changes, or start fresh.` }]);
    setView('preview');
  };

  function loadFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    file.text().then((txt) => {
      try {
        const parsed = JSON.parse(txt);
        const v = validateAsset(parsed);
        if (!v.ok) throw new Error(`${v.errors[0].path}: ${v.errors[0].msg}`);
        setDoc(parsed);
        setLibrary(parsed.assets || {});
        setFormat(parsed.format);
        setThread([{ role: 'assistant', text: `Loaded “${parsed.title}”.` }]);
        setView('preview');
      } catch (err) {
        setThread((t) => [...t, { role: 'error', text: `Couldn’t load that file: ${err.message}` }]);
      }
    });
  }

  async function pickFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    setUpError('');
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setUpError('Use a PNG, JPEG or WebP image.');
    setPending(file);
    setMeta({ kind: /logo/i.test(file.name) ? 'logo' : 'photo', alt: '', description: '', noCrop: false, people: false, ground: 'any' });
  }

  // → { id, asset } when the picture was added, else null.
  async function doUpload() {
    if (!pending || uploading) return null;
    if (!meta.alt.trim()) {
      setUpError('Alt text is required: describe the picture in a few words.');
      return null;
    }
    setUploading(true);
    setUpError('');
    try {
      const file = await shrink(pending);
      const fd = new FormData();
      fd.append('file', file);
      Object.entries(meta).forEach(([k, v]) => fd.append(k, String(v)));
      const res = await fetch('/api/builder/creative/upload/', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Upload failed (${res.status})`);
      setLibrary((l) => ({ ...l, [json.id]: json.asset }));
      setPending(null);
      return { id: json.id, asset: json.asset };
    } catch (err) {
      setUpError(err.message);
      return null;
    } finally {
      setUploading(false);
    }
  }

  function removeAsset(id) {
    const rest = { ...library };
    delete rest[id];
    if (doc && !validateAsset({ ...doc, assets: rest }).ok) return setUpError('That picture is used in the asset — remove it from the design first.');
    setLibrary(rest);
  }

  async function send() {
    const text = prompt.trim();
    if (!text || busy) return;
    // A picture that's been picked but not added would never reach Claude. Add it
    // now if it's ready; otherwise stop and say what's missing.
    let sendLibrary = library;
    if (pending) {
      const added = await doUpload();
      if (!added) {
        setUpError((e) => e || 'Finish adding your picture first: give it alt text, then send again.');
        return;
      }
      sendLibrary = { ...library, [added.id]: added.asset };
    }
    setPrompt('');
    setBusy(true);
    setThread((t) => [...t, { role: 'user', text }]);
    try {
      let history = thread.filter((m) => m.role !== 'error').map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
      let current = doc ? { ...doc, assets: sendLibrary } : null;
      let lib = sendLibrary;
      let ask = text;
      const allTrace = [];
      // Generation is resumable: the server returns a valid partial asset when it
      // runs out of time, and we ask it to carry on (up to 5 rounds).
      for (let round = 1; round <= 5; round += 1) {
        const res = await fetch('/api/builder/creative/generate/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format, doc: current, library: lib, prompt: ask, history }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(res.status === 504 ? 'Timed out — nothing was lost; press Refine to continue.' : json.error || `Request failed (${res.status})`);
        current = json.doc;
        lib = json.doc.assets || {};
        setDoc(json.doc);
        setLibrary(lib);
        allTrace.push(...(json.trace || []));
        if (!json.unfinished) {
          setThread((t) => [...t, { role: 'assistant', text: json.reply || 'Done.', trace: allTrace }]);
          break;
        }
        setThread((t) => [...t.filter((m) => m.role !== 'progress'), { role: 'progress', text: `Still building… (step ${round + 1})` }]);
        history = [...history, { role: 'user', content: ask }, { role: 'assistant', content: json.reply || 'Working on it.' }];
        ask = 'Continue: call get_asset, then finish whatever is missing from my original request.';
        if (round === 5) setThread((t) => [...t.filter((m) => m.role !== 'progress'), { role: 'assistant', text: 'Built as far as it got — ask it to continue if something is missing.' }]);
      }
      setThread((t) => t.filter((m) => m.role !== 'progress'));
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
        <a className={s.back} href="gallery/">Gallery of every format →</a>
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
            <br />
            <label className={s.link}>Load asset JSON<input type="file" accept="application/json,.json" onChange={loadFile} hidden /></label>
          </div>
        </div>

        <div className={s.head}>Images</div>
        <div className={s.pad}>
          {Object.entries(library).map(([id, a]) => (
            <div key={id} className={s.asset}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${a.url}?w=96&h=96&fit=crop&auto=format`} alt="" width={40} height={40} className={s.thumb} />
              <span className={s.assetText}><b>{a.kind}</b> {a.alt}</span>
              <button className={s.x} onClick={() => removeAsset(id)} aria-label={`Remove ${a.alt}`}>×</button>
            </div>
          ))}
          {!pending ? (
            <>
              <button className={s.link} onClick={() => picker.current?.click()}>+ Upload a picture</button>
              <input ref={picker} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickFile} hidden />
            </>
          ) : (
            <div className={s.form}>
              <div className={s.fname}>{pending.name}</div>
              <div className={s.notAdded}>Not attached yet. Add alt text and press Add to library (or just send: it will be added).</div>
              <label className={s.lab}>What is it?
                <select className={s.select} value={meta.kind} onChange={(e) => setMeta({ ...meta, kind: e.target.value })}>
                  <option value="photo">Photo</option>
                  <option value="logo">Logo</option>
                  <option value="graphic">Graphic / diagram</option>
                </select>
              </label>
              <label className={s.lab}>Alt text (required)
                <input className={s.input} value={meta.alt} maxLength={160} onChange={(e) => setMeta({ ...meta, alt: e.target.value })} placeholder="e.g. The team at the C2i tape-out" />
              </label>
              <label className={s.lab}>Notes for the designer (optional)
                <input className={s.input} value={meta.description} maxLength={300} onChange={(e) => setMeta({ ...meta, description: e.target.value })} placeholder="e.g. Best for cover cards; subject on the left" />
              </label>
              <label className={s.check}><input type="checkbox" checked={meta.noCrop} onChange={(e) => setMeta({ ...meta, noCrop: e.target.checked })} /> Never crop it</label>
              <label className={s.check}><input type="checkbox" checked={meta.people} onChange={(e) => setMeta({ ...meta, people: e.target.checked })} /> Shows people</label>
              {meta.kind === 'logo' ? (
                <label className={s.lab}>Works on
                  <select className={s.select} value={meta.ground} onChange={(e) => setMeta({ ...meta, ground: e.target.value })}>
                    <option value="any">Any background</option>
                    <option value="light">Light backgrounds only</option>
                    <option value="dark">Dark backgrounds only</option>
                  </select>
                </label>
              ) : null}
              <div className={s.formActions}>
                <button className={s.send} onClick={doUpload} disabled={uploading}>{uploading ? 'Uploading…' : 'Add to library'}</button>
                <button className={s.link} onClick={() => { setPending(null); setUpError(''); }}>Cancel</button>
              </div>
            </div>
          )}
          {upError ? <div className={s.upErr} role="alert">{upError}</div> : null}
          <div className={s.small}>Claude can only use pictures listed here, and follows the rules you set (no cropping, logo grounds, text over photos needs a scrim).</div>
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
            <div key={i} className={`${s.msg} ${m.role === 'user' ? s.me : `${s.claude} ${m.role === 'error' ? s.err : ''}`}`}>
              {m.text}
              {m.trace?.length ? (
                <details className={s.trace}>
                  <summary>What Claude did ({m.trace.length} steps{m.trace.some((x) => !x.ok) ? `, ${m.trace.filter((x) => !x.ok).length} rejected` : ''})</summary>
                  {m.trace.map((x, j) => (
                    <div key={j} className={x.ok ? '' : s.traceBad}><b>{x.tool}</b> {x.ok ? '✓' : '✗'} {x.note}</div>
                  ))}
                </details>
              ) : null}
            </div>
          ))}
          {busy ? <div className={`${s.msg} ${s.claude}`}>Composing… (up to a minute)</div> : null}
        </div>
        <div className={s.compose}>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }} placeholder="What should it be? Mention your picture if you want it used. (⌘/Ctrl + Enter)" aria-label="Describe the asset" maxLength={2000} />
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
              <button className={s.dl} onClick={() => download(`${doc.id}.json`, JSON.stringify(withLib, null, 2), 'application/json')}>Download JSON</button>
              {isEmail && emailHtml ? <button className={s.dl} onClick={() => download(`${doc.id}.html`, emailHtml, 'text/html')}>Download HTML</button> : null}
            </div>

            {view === 'preview' && !hasContent ? (
              <div className={s.emptyNote}>Nothing has been built yet. Read Claude's message on the left: it may need something from you (like a picture added to Images).</div>
            ) : null}
            {view === 'preview' && hasContent ? (
              <div className={s.pages}>
                {doc.pages.map((p, i) => (
                  <figure key={p.id} className={s.figure}>
                    <div className={s.frame} style={{ width: f.w * scale, ...(f.h ? { height: f.h * scale } : {}) }}>
                      <div style={{ zoom: scale, width: f.w }}>
                        <AssetPage doc={withLib} page={p} />
                      </div>
                    </div>
                    <figcaption className={s.cap}>{i + 1} / {doc.pages.length} · {p.id}</figcaption>
                  </figure>
                ))}
              </div>
            ) : null}
            {view === 'email' ? <iframe className={s.mail} title="Email preview" srcDoc={emailHtml} /> : null}
            {view === 'json' ? <pre className={s.json}>{JSON.stringify(withLib, null, 2)}</pre> : null}

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
