'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import styles from './scheduler.module.css';

const IST = 'Asia/Kolkata';

function dayKey(dateObj, timeZone) {
  return new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(dateObj);
}

function dayLabel(dateObj, timeZone) {
  return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short', day: 'numeric', month: 'short' }).format(dateObj);
}

function timeLabel(dateObj, timeZone) {
  return new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit', hour12: true }).format(dateObj);
}

function tzAbbrev(timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }).formatToParts(new Date());
    return parts.find((p) => p.type === 'timeZoneName')?.value || timeZone;
  } catch {
    return timeZone;
  }
}

function groupByDay(slots, timeZone) {
  const groups = new Map();
  for (const slot of slots) {
    const start = new Date(slot.startUTC);
    const end = new Date(slot.endUTC);
    const key = dayKey(start, timeZone);
    if (!groups.has(key)) groups.set(key, { label: dayLabel(start, timeZone), items: [] });
    groups.get(key).items.push({ id: slot.slotId, timeLabel: `${timeLabel(start, timeZone)}–${timeLabel(end, timeZone)}` });
  }
  return Array.from(groups.values());
}

export default function SchedulerPage() {
  const [invite, setInvite] = useState(null);
  const [stage, setStage] = useState('loading'); // loading | code | slots | form | done | invalid
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slots, setSlots] = useState([]);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showOriginalTZ, setShowOriginalTZ] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [company, setCompany] = useState('');
  const [founderEmail, setFounderEmail] = useState('');
  const [teammates, setTeammates] = useState(['']);

  // The invitation ID lives in the URL (?invite=...), emailed or sent over
  // WhatsApp to the founder. Read once, client-side only — no server rendering
  // of this page, so no hydration mismatch from reading window here.
  //
  // Before showing the code screen, check for an existing 48h session cookie
  // (set on a prior successful code entry) - without this, a founder who
  // revisits the link (e.g. after closing the tab, or the page reloading)
  // would be asked for the code again every time even though their session
  // is still valid. A 401 here just means no valid session yet, the normal
  // case on a first visit, not an error.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('invite');
    setInvite(id || null);

    (async () => {
      try {
        const res = await fetch('/api/pitch-scheduler-session');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setSlots(data.slots || []);
            setNeedsEmail(Boolean(data.needsEmail));
            setStage(data.status === 'submitted' ? 'done' : 'slots');
            return;
          }
        }
      } catch {
        // Network hiccup checking the session - fall through to a normal
        // code entry rather than getting stuck on the loading stage.
      }
      setStage(id ? 'code' : 'invalid');
    })();
  }, []);

  const localTZ = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || IST;
    } catch {
      return IST;
    }
  }, []);
  const localIsIST = localTZ === IST;
  const activeTZ = showOriginalTZ ? IST : localTZ;

  // The backend now stores up to 14 slots per invitation (widened from 6 so
  // calendar filtering has enough headroom - see pitch-scheduler-invite-manual
  // route). Reveal the first 6 up front and let "Show more" expand to the
  // rest, all from what's already fetched - no extra request needed.
  const INITIAL_SLOT_COUNT = 6;
  const visibleSlots = showMore ? slots : slots.slice(0, INITIAL_SLOT_COUNT);
  const dayColumns = useMemo(() => groupByDay(visibleSlots, activeTZ), [visibleSlots, activeTZ]);
  const initialDayCount = useMemo(() => groupByDay(slots.slice(0, INITIAL_SLOT_COUNT), activeTZ).length, [slots, activeTZ]);
  const hasMoreSlots = slots.length > INITIAL_SLOT_COUNT;

  // FLIP animation: when elements on the slots screen shift position (a row
  // appearing/disappearing pushes everything below it up or down), animate
  // that shift instead of letting it jump. captureFlipRects() runs synchronously
  // BEFORE the state change that will move things; the layout effect below runs
  // AFTER React has committed the new positions, so it can compute the delta.
  const slotsCardRef = useRef(null);
  const prevRectsRef = useRef(new Map());

  const captureFlipRects = () => {
    const container = slotsCardRef.current;
    if (!container) return;
    const map = new Map();
    container.querySelectorAll('[data-flip-id]').forEach((el) => {
      map.set(el.getAttribute('data-flip-id'), el.getBoundingClientRect());
    });
    prevRectsRef.current = map;
  };

  useLayoutEffect(() => {
    const container = slotsCardRef.current;
    const prev = prevRectsRef.current;
    if (!container || !prev.size) return;
    container.querySelectorAll('[data-flip-id]').forEach((el) => {
      const before = prev.get(el.getAttribute('data-flip-id'));
      if (!before) return;
      const after = el.getBoundingClientRect();
      const dx = before.left - after.left;
      const dy = before.top - after.top;
      if (!dx && !dy) return;
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(() => {
        el.style.transition = 'transform 0.32s ease';
        el.style.transform = '';
      });
    });
    prevRectsRef.current = new Map();
  }, [selectedSlot, dayColumns.length]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6 || !invite) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/pitch-scheduler-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid or expired code');
      setSlots(data.slots || []);
      setNeedsEmail(Boolean(data.needsEmail));
      setStage('slots');
    } catch (err) {
      setError(err.message);
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueFromSlots = () => {
    if (!selectedSlot) return;
    setStage('form');
  };

  const updateTeammate = (index, value) => setTeammates((prev) => prev.map((t, i) => (i === index ? value : t)));
  const addTeammate = () => setTeammates((prev) => [...prev, '']);
  const removeTeammate = (index) => setTeammates((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company.trim() || !selectedSlot) return;
    if (needsEmail && !founderEmail.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/pitch-scheduler-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedSlotId: selectedSlot,
          companyName: company.trim(),
          teammateEmails: teammates.map((t) => t.trim()).filter(Boolean),
          ...(needsEmail ? { founderEmail: founderEmail.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      setStage('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isMinimalStage = stage === 'code' || stage === 'loading';

  return (
    <div className={isMinimalStage ? styles.minimalContainer : styles.container}>
      <div className={isMinimalStage ? styles.minimalContent : `${styles.content} ${styles.calendarBox}`}>
        {stage === 'loading' && (
          <div className={styles.minimalForm}>
            <p className={styles.minimalHint}>Loading…</p>
          </div>
        )}

        {stage === 'invalid' && (
          <div className={styles.minimalForm}>
            <p className={styles.minimalHint}>This link is missing its invitation ID. Please use the link exactly as it was sent to you.</p>
          </div>
        )}

        {stage === 'code' && (
          <form className={styles.minimalForm} onSubmit={handleVerify}>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className={styles.minimalCodeInput}
              placeholder="––––––"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              autoFocus
              required
              disabled={loading}
            />
            <p className={styles.minimalHint}>
              {error || (loading ? 'Verifying…' : code.length === 6 ? 'Press enter to continue' : 'Enter 6-digit code')}
            </p>
          </form>
        )}

        {stage === 'slots' && (
          <div className={`${styles.card} ${styles.fadeIn}`} ref={slotsCardRef}>
            <h1 className={styles.title} data-flip-id="title">Pick a time</h1>
            <p className={styles.helpText} data-flip-id="help">
              Once you select a slot, we&apos;ll confirm with our team and send you a calendar invite. This only tells us your preference, it doesn&apos;t book the meeting yet.
            </p>

            {!localIsIST && (
              <button type="button" className={styles.tzToggle} data-flip-id="tz" onClick={() => setShowOriginalTZ((v) => !v)}>
                {showOriginalTZ
                  ? `Showing times in IST. Show in your local time (${tzAbbrev(localTZ)})`
                  : `Showing times in your local time (${tzAbbrev(localTZ)}). Show in original time zone (IST)`}
              </button>
            )}

            {error && <p className={styles.helpText}>{error}</p>}

            <div className={styles.dayColumns}>
              {dayColumns.map((col, i) => (
                <div
                  key={col.label}
                  data-flip-id={`day-${col.label}`}
                  className={`${styles.dayColumn} ${i >= initialDayCount ? styles.fadeIn : ''}`}
                >
                  <div className={styles.dayColumnHeader}>{col.label}</div>
                  {col.items.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={`${styles.slotCell} ${selectedSlot === item.id ? styles.slotCellSelected : ''}`}
                      onClick={() => {
                        captureFlipRects();
                        setSelectedSlot((prev) => (prev === item.id ? null : item.id));
                      }}
                    >
                      {item.timeLabel}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {!showMore && hasMoreSlots && (
              <button
                type="button"
                className={styles.linkButton}
                data-flip-id="showMore"
                onClick={() => {
                  captureFlipRects();
                  setShowMore(true);
                }}
              >
                Show more slots
              </button>
            )}

            {selectedSlot && (
              <button
                type="button"
                className={`${styles.linkButton} ${styles.fadeIn}`}
                data-flip-id="clear"
                onClick={() => {
                  captureFlipRects();
                  setSelectedSlot(null);
                }}
              >
                Clear selection
              </button>
            )}

            <button type="button" className={styles.submitButton} data-flip-id="continue" onClick={handleContinueFromSlots} disabled={!selectedSlot}>
              Continue
            </button>
          </div>
        )}

        {stage === 'form' && (
          <form className={`${styles.card} ${styles.fadeIn}`} onSubmit={handleSubmit}>
            <h1 className={styles.title}>A few details</h1>
            {error && <p className={styles.helpText}>{error}</p>}
            {needsEmail && (
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="founderEmail">Your email</label>
                <input
                  id="founderEmail"
                  type="email"
                  className={styles.input}
                  placeholder="you@company.com"
                  value={founderEmail}
                  onChange={(e) => setFounderEmail(e.target.value)}
                  required
                />
              </div>
            )}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="company">Company name</label>
              <input
                id="company"
                type="text"
                className={styles.input}
                placeholder="Your startup's name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Teammates joining (optional)</label>
              {teammates.map((email, i) => (
                <div key={i} className={styles.teammateRow}>
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="teammate@company.com"
                    value={email}
                    onChange={(e) => updateTeammate(i, e.target.value)}
                  />
                  {teammates.length > 1 && (
                    <button type="button" className={styles.removeButton} onClick={() => removeTeammate(i)} aria-label="Remove">
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className={styles.linkButton} onClick={addTeammate}>
                + Add another
              </button>
            </div>
            <button type="submit" className={styles.submitButton} disabled={loading || !company.trim() || (needsEmail && !founderEmail.trim())}>
              {loading ? 'Submitting…' : 'Confirm preference'}
            </button>
            <button type="button" className={styles.linkButton} onClick={() => setStage('slots')}>
              Back to slots
            </button>
          </form>
        )}

        {stage === 'done' && (
          <div className={`${styles.card} ${styles.fadeIn}`}>
            <h1 className={styles.title}>You&apos;re all set</h1>
            <p className={styles.subtitle}>We&apos;ve noted your preference. Our team will confirm and send a calendar invite shortly.</p>
          </div>
        )}
      </div>
    </div>
  );
}
