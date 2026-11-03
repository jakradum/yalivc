'use client';

import { useEffect, useState } from 'react';
import s from './travel.module.css';

const API = '/api/team-travel-request/';
const BLANK = { requester: '', from: '', to: '', depDate: '', retDate: '', purpose: '', prefTiming: '', prefFlight: '', notes: '' };

// Shrinks a screenshot to a JPEG that comfortably fits a request body
// (Vercel caps bodies at 4.5 MB; phone screenshots are often bigger).
function compressImage(file, maxSide = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Could not read that image.'));
    img.src = URL.createObjectURL(file);
  });
}

export function TravelForm() {
  const [lists, setLists] = useState(null);
  const [f, setF] = useState(BLANK);
  const [travellers, setTravellers] = useState([]);
  const [cab, setCab] = useState(false);
  const [hotel, setHotel] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setLists(d);
        // Signed in as one person: they are the requester, no choice to make.
        if (d.requesters?.length === 1) setF((cur) => ({ ...cur, requester: d.requesters[0] }));
        else if (!d.requesters?.length) setError("Your account isn't in the team directory. Ask Pranav to add you.");
      })
      .catch((e) => setError(e.message || "Couldn't load the traveller list. Refresh the page."));
  }, []);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggleTraveller = (name) =>
    setTravellers((t) => (t.includes(name) ? t.filter((x) => x !== name) : [...t, name]));

  async function onScreenshot(e) {
    const file = e.target.files?.[0];
    if (!file) { setScreenshot(null); return; }
    try { setScreenshot(await compressImage(file)); } catch (err) { setError(err.message); }
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!f.requester) return setError('Pick your name.');
    if (!travellers.length) return setError('Pick at least one traveller.');
    if (!f.from || !f.to || !f.depDate) return setError('Fill in From, To and the departure date.');
    if (f.retDate && f.retDate < f.depDate) return setError('Return date must be on or after departure.');
    setBusy(true);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, travellers, cab, hotel, screenshot }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "Couldn't send the request.");
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setF({ ...BLANK, requester: lists?.requesters.length === 1 ? lists.requesters[0] : '' }); setTravellers([]); setCab(false); setHotel(false); setScreenshot(null); setDone(false);
  }

  if (done) {
    return (
      <div className={s.card}>
        <div className={s.done}>
          <div className={s.h1}>Sent for approval</div>
          <p>Gani has been emailed to approve it. Once he does, Karthik Sunder books it with the travel desk. You'll get an email either way.</p>
          <button type="button" className={s.btnGhost} onClick={reset}>New request</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className={s.card}>
        <div className={s.cardTitle}>1. Who's travelling</div>
        {lists?.requesters.length > 1 ? (
          <>
            <label className={s.label} htmlFor="requester">Requesting for</label>
            <select id="requester" className={s.select} value={f.requester} onChange={set('requester')}>
              <option value="">Select a name</option>
              {lists.requesters.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </>
        ) : (
          <div className={s.hint} style={{ marginTop: 0 }}>Requesting as <b>{f.requester || '…'}</b></div>
        )}

        <span className={s.label}>Travellers</span>
        <div className={s.chips}>
          {lists ? lists.travellers.map((t) => (
            <button
              key={t.name} type="button" aria-pressed={travellers.includes(t.name)}
              className={`${s.chip} ${travellers.includes(t.name) ? s.chipOn : ''}`}
              onClick={() => toggleTraveller(t.name)}
            >
              <b>{t.name}</b>
              <span>{[t.cls, t.seat, t.meal].filter(Boolean).join(' · ')}</span>
            </button>
          )) : <span className={s.hint}>Loading…</span>}
        </div>
        <div className={s.hint}>Seat, meal and frequent-flyer details are on file and go to the travel desk once approved.</div>
      </div>

      <div className={s.card}>
        <div className={s.cardTitle}>2. Trip</div>
        <div className={s.row}>
          <div><label className={s.label} htmlFor="from">From</label><input id="from" className={s.input} placeholder="e.g. Bengaluru" value={f.from} onChange={set('from')} /></div>
          <div><label className={s.label} htmlFor="to">To</label><input id="to" className={s.input} placeholder="e.g. Delhi" value={f.to} onChange={set('to')} /></div>
        </div>
        <div className={s.row}>
          <div><label className={s.label} htmlFor="dep">Departure date</label><input id="dep" type="date" className={s.input} value={f.depDate} onChange={set('depDate')} /></div>
          <div><label className={s.label} htmlFor="ret">Return date (optional)</label><input id="ret" type="date" className={s.input} min={f.depDate || undefined} value={f.retDate} onChange={set('retDate')} /></div>
        </div>
        <label className={s.label} htmlFor="purpose">Purpose</label>
        <input id="purpose" className={s.input} placeholder="e.g. Portfolio board meeting" value={f.purpose} onChange={set('purpose')} />
        <div className={s.row}>
          <div><label className={s.label} htmlFor="timing">Preferred timing</label><input id="timing" className={s.input} placeholder="e.g. Morning, after 5 PM" value={f.prefTiming} onChange={set('prefTiming')} /></div>
          <div><label className={s.label} htmlFor="flight">Preferred flight (optional)</label><input id="flight" className={s.input} placeholder="e.g. IndiGo 6E-204, 7:30 AM" value={f.prefFlight} onChange={set('prefFlight')} /></div>
        </div>

        <span className={s.label}>Also needed</span>
        <div className={s.toggles}>
          <button type="button" aria-pressed={cab} className={`${s.toggle} ${cab ? s.toggleOn : ''}`} onClick={() => setCab(!cab)}>Cab</button>
          <button type="button" aria-pressed={hotel} className={`${s.toggle} ${hotel ? s.toggleOn : ''}`} onClick={() => setHotel(!hotel)}>Hotel room</button>
        </div>

        <label className={s.label} htmlFor="shot">Flight screenshot (optional)</label>
        <input id="shot" type="file" accept="image/png,image/jpeg,image/webp" onChange={onScreenshot} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {screenshot && <img src={screenshot} alt="Flight screenshot preview" className={s.thumb} />}

        <label className={s.label} htmlFor="notes">Notes</label>
        <textarea id="notes" className={s.textarea} placeholder="Project code, timing constraints, anything else" value={f.notes} onChange={set('notes')} />
      </div>

      <button type="submit" className={s.btn} disabled={busy || !lists}>{busy ? 'Sending…' : 'Send to Gani for approval'}</button>
      {error && <div className={s.error} role="alert">{error}</div>}
    </form>
  );
}
