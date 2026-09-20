import crypto from 'crypto';

// Session for the team subdomain (team.yali.vc): the asset builder and the
// Letters section. Issued only after a Yali Microsoft sign-in has been
// verified server-side (see microsoftAuth.js / /api/team-auth). Its own
// cookie, and signatures are domain-separated ("team:") so a cookie from the
// LP portal or the data room can never be replayed here even though they
// share PORTAL_AUTH_SECRET.
export const TEAM_COOKIE = 'team-session';
export const SESSION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Only accounts on Yali's own Microsoft tenant can hold a session.
export const YALI_DOMAIN = '@yali.vc';

// Per-area allow-lists. `null` = any Yali account. To restrict an area, list
// the lowercase emails allowed, e.g. LETTERS_ALLOWED = ['sunil@yali.vc'].
export const ACCESS = {
  builder: null,
  letters: null,
};

const secret = () => process.env.PORTAL_AUTH_SECRET;
const hmac = (s) => crypto.createHmac('sha256', secret()).update(s).digest('hex');

export const isYaliEmail = (email) => String(email || '').toLowerCase().endsWith(YALI_DOMAIN);

export function canAccess(area, email) {
  if (!isYaliEmail(email)) return false;
  const list = ACCESS[area];
  return !list || list.includes(String(email).toLowerCase());
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function signTeamSession(email, ts = Date.now()) {
  const e = String(email).toLowerCase();
  return `${e}:${ts}:${hmac(`team:${e}:${ts}`)}`;
}

// → the email if the cookie is genuine and fresh, else null.
export function verifyTeamSession(value) {
  if (!value || !secret()) return null;
  const last = value.lastIndexOf(':');
  const mid = value.lastIndexOf(':', last - 1);
  if (last < 0 || mid < 0) return null;
  const email = value.slice(0, mid);
  const ts = value.slice(mid + 1, last);
  const sig = value.slice(last + 1);
  const age = Date.now() - parseInt(ts, 10);
  if (!email || Number.isNaN(age) || age < 0 || age > SESSION_MS) return null;
  return safeEqual(sig, hmac(`team:${email}:${ts}`)) ? email : null;
}
