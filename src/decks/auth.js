import 'server-only';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { verifySession } from '@/lib/session';

// The deck lives behind the partners portal. The proxy already forces a
// valid `portal-session` on every page route there, but that cookie is
// also issued to Fund I LPs, and `/api/*` skips the proxy entirely — so
// every deck route re-checks for itself, and additionally requires an
// INTERNAL user. Same internal rule as src/lib/pdfRequestHandler.js
// (duplicated deliberately: that file is the LP report and stays untouched).
const COOKIE_NAME = 'portal-session';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isInternalEmail(email) {
  return (
    email.endsWith('@yali.vc') ||
    email.endsWith('@florintree.com') ||
    email === 'pranavkarnad@gmail.com'
  );
}

// Returns the internal user's email, or null. verifySession() checks the
// signature only, so the 30-day age limit is enforced here too.
export function getDeckUser(cookieValue) {
  const email = verifySession(cookieValue);
  if (!email) return null;
  const timestamp = parseInt(cookieValue.split(':').slice(-2, -1)[0], 10);
  const age = Date.now() - timestamp;
  if (Number.isNaN(age) || age < 0 || age > THIRTY_DAYS_MS) return null;
  return isInternalEmail(email) ? email : null;
}

// Pages: anything short of an internal user gets a plain 404, so a
// signed-in LP can't even tell the route exists.
export async function requireDeckUser() {
  const store = await cookies();
  const email = getDeckUser(store.get(COOKIE_NAME)?.value);
  if (!email) notFound();
  return email;
}

// API route: only ever served on the partners host (or localhost for dev).
// Strict on purpose, not startsWith('partners.'): the exporter hands the
// user's session cookie to whatever host it navigates to, so a spoofed
// `partners.evil.com` must never pass.
const ALLOWED_HOSTS = [
  /^partners\.([a-z0-9-]+\.)*yali\.vc$/,
  /^partners-[a-z0-9-]+\.vercel\.app$/, // Vercel preview deployments
  /^(localhost|127\.0\.0\.1)(:\d+)?$/,
];
export function isPartnersHost(host = '') {
  return ALLOWED_HOSTS.some((re) => re.test(host.toLowerCase()));
}

export const DECK_SESSION_COOKIE = COOKIE_NAME;
