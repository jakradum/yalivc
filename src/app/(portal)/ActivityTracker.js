'use client';

// Usage tracking for the LP portal (src/lib/visits.js). On load it marks the visit;
// then every 30 seconds, if the tab is visible and the LP moved, scrolled, clicked or
// typed in the last 5 minutes, it reports those 30 seconds as time on the portal.
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const TICK_MS = 30 * 1000;
const IDLE_MS = 5 * 60 * 1000;
const EVENTS = ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel'];

function beat(seconds) {
  fetch('/api/portal-activity/', { // trailing slash: the site redirects without one
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seconds }),
    keepalive: true,
  }).catch(() => {});
}

export default function ActivityTracker() {
  const onSignIn = /\/sign-in(\/|$)/.test(usePathname() || '');

  useEffect(() => {
    if (onSignIn) return undefined;
    let lastInput = Date.now();
    const touch = () => { lastInput = Date.now(); };
    EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    beat(0); // the visit starts now
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - lastInput < IDLE_MS) beat(TICK_MS / 1000);
    }, TICK_MS);
    return () => {
      clearInterval(timer);
      EVENTS.forEach((e) => window.removeEventListener(e, touch));
    };
  }, [onSignIn]);

  return null;
}
