import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { TEAM_COOKIE, canAccess, verifyTeamSession } from '@/lib/teamSession';

// The asset builder and the Letters section live on the team subdomain behind
// a Yali Microsoft sign-in (/team/sign-in → /api/team-auth). The proxy already
// sends anyone without a valid team session to the sign-in page, but `/api/*`
// skips the proxy — so every page and API route re-checks for itself.
export const DECK_SESSION_COOKIE = TEAM_COOKIE;

// → the signed-in user's email if they may use `area`, else null.
export function getTeamUser(cookieValue, area = 'builder') {
  const email = verifyTeamSession(cookieValue);
  return email && canAccess(area, email) ? email : null;
}
export const getDeckUser = (cookieValue) => getTeamUser(cookieValue, 'builder');

const isLocalHost = (host = '') => /^(localhost|127\.0\.0\.1)/.test(host);

// Team pages are served at clean paths on team.yali.vc and under /team locally.
export async function teamPrefix() {
  return isLocalHost((await headers()).get('host') || '') ? '/team' : '';
}

// Pages: no valid session → the sign-in page (and back to `area` afterwards).
export async function requireTeamUser(area = 'builder') {
  const store = await cookies();
  const email = getTeamUser(store.get(TEAM_COOKIE)?.value, area);
  if (email) return email;
  const prefix = await teamPrefix();
  redirect(`${prefix}/sign-in?next=${encodeURIComponent(`${prefix}/${area === 'letters' ? 'letters' : 'builder'}/`)}`);
}
export const requireDeckUser = () => requireTeamUser('builder');

// API routes: only ever served on the team host (or localhost for dev).
// Strict on purpose, not startsWith('team.'): the exporter hands the user's
// session cookie to whatever host it navigates to, so a spoofed
// `team.evil.com` must never pass.
const ALLOWED_HOSTS = [
  /^team\.([a-z0-9-]+\.)*yali\.vc$/,
  /^team-[a-z0-9-]+\.vercel\.app$/, // Vercel preview deployments
  /^(localhost|127\.0\.0\.1)(:\d+)?$/,
];
export function isBuilderHost(host = '') {
  return ALLOWED_HOSTS.some((re) => re.test(host.toLowerCase()));
}
