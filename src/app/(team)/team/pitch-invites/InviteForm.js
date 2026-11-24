'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import s from '../travel/travel.module.css';

// Same three contact methods the Studio button had: email (the app emails the
// link and code), WhatsApp or name only (you relay the link and code yourself).
const METHODS = [['email', 'Email'], ['whatsapp', 'WhatsApp'], ['name', 'Name only']];

export function InviteForm() {
  const router = useRouter();
  const [f, setF] = useState({ companyName: '', contactMethod: 'email', founderEmail: '', whatsappNumber: '', founderName: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { link, code? }
  const [copied, setCopied] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const message = result?.code
    ? `Please use this link to pick a time for the call: ${result.link}\n\nEnter this code when prompted: ${result.code}\n\nLet me know if you face issues, or if none of these work for you. `
    : null;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/pitch-scheduler-invite-manual/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setResult({ link: data.link, code: data.code });
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch { /* clipboard blocked: the text is on screen */ }
  }

  if (result) {
    return (
      <section className={s.card}>
        <h2 className={s.cardTitle}>Invitation created</h2>
        {message ? (
          <>
            <p className={s.hint}>Send this to the founder. The code is shown only now.</p>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, background: '#efefef', padding: 14, margin: '0 0 14px' }}>{message}</pre>
            <div className={s.actions}>
              <button type="button" className={s.btn} onClick={copy}>{copied ? 'Copied' : 'Copy message'}</button>
              <button type="button" className={s.btnGhost} onClick={() => { setResult(null); setF((x) => ({ ...x, companyName: '', founderEmail: '', whatsappNumber: '', founderName: '' })); }}>New invitation</button>
            </div>
          </>
        ) : (
          <>
            <p className={s.hint}>The link and code were emailed to {f.founderEmail}.</p>
            <div className={s.actions}>
              <button type="button" className={s.btnGhost} onClick={() => { setResult(null); setF((x) => ({ ...x, companyName: '', founderEmail: '' })); }}>New invitation</button>
            </div>
          </>
        )}
      </section>
    );
  }

  return (
    <form className={s.card} onSubmit={submit}>
      <h2 className={s.cardTitle}>New invitation</h2>
      <label className={s.label} htmlFor="company">Company</label>
      <input id="company" className={s.input} value={f.companyName} onChange={set('companyName')} placeholder="e.g. Marut Drones" />
      <span className={s.label}>Contact by</span>
      <div className={s.chips}>
        {METHODS.map(([k, l]) => (
          <button key={k} type="button" className={f.contactMethod === k ? s.chipOn : s.chip} onClick={() => setF((x) => ({ ...x, contactMethod: k }))}>{l}</button>
        ))}
      </div>
      {f.contactMethod === 'email' && (<><label className={s.label} htmlFor="email">Founder email</label><input id="email" type="email" className={s.input} value={f.founderEmail} onChange={set('founderEmail')} /></>)}
      {f.contactMethod === 'whatsapp' && (<><label className={s.label} htmlFor="wa">WhatsApp number</label><input id="wa" className={s.input} value={f.whatsappNumber} onChange={set('whatsappNumber')} placeholder="+91..." /></>)}
      {f.contactMethod === 'name' && (<><label className={s.label} htmlFor="name">Contact name</label><input id="name" className={s.input} value={f.founderName} onChange={set('founderName')} /></>)}
      {error ? <p className={s.error}>{error}</p> : null}
      <div className={s.actions}>
        <button type="submit" className={s.btn} disabled={busy}>{busy ? 'Creating...' : 'Create invitation'}</button>
      </div>
    </form>
  );
}
