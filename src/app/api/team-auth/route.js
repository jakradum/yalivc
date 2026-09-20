import { NextResponse } from 'next/server';
import { isBuilderHost } from '@/decks/auth';
import { verifyMicrosoftLogin } from '@/lib/microsoftAuth';
import { SESSION_MS, TEAM_COOKIE, signTeamSession } from '@/lib/teamSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Exchanges a Microsoft sign-in for a team session. The browser does the
// Microsoft sign-in (Firebase's microsoft.com provider, as on the leave
// dashboard) and posts the tokens here; we verify them against Microsoft
// ourselves (microsoftAuth.js) and never take an email address on trust.
const notFound = () => new NextResponse('Not found', { status: 404 });
const cookieBase = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/' };

// Light per-instance throttle on top of the cryptographic checks.
const hits = new Map();
function allowed(key, max = 20) {
  const now = Date.now();
  const r = hits.get(key);
  if (!r || now - r.start > 15 * 60 * 1000) {
    hits.set(key, { start: now, n: 1 });
    return true;
  }
  r.n += 1;
  return r.n <= max;
}

export async function POST(request) {
  if (!process.env.PORTAL_AUTH_SECRET) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  if (!isBuilderHost(request.headers.get('host') || '')) return notFound();
  const body = await request.json().catch(() => ({}));

  if (body.action === 'microsoft') {
    const ip = (request.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
    if (!allowed(ip)) return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
    try {
      const { email, via } = await verifyMicrosoftLogin({ idToken: body.idToken, accessToken: body.accessToken });
      console.log('[team-auth] signed in', email, 'via', via);
      const res = NextResponse.json({ success: true, email });
      res.cookies.set(TEAM_COOKIE, signTeamSession(email), { ...cookieBase, maxAge: SESSION_MS / 1000 });
      return res;
    } catch (err) {
      console.error('[team-auth] rejected:', err.message);
      // The reasons are short, contain no secrets, and are what you'd need to fix a misconfiguration.
      return NextResponse.json({ error: 'Could not verify that Microsoft sign-in.', detail: err.message }, { status: 401 });
    }
  }

  if (body.action === 'logout') {
    const res = NextResponse.json({ success: true });
    res.cookies.set(TEAM_COOKIE, '', { ...cookieBase, maxAge: 0 });
    return res;
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
