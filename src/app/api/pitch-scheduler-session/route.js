import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import crypto from 'crypto';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
});

const AUTH_SECRET = process.env.PITCH_SCHEDULER_AUTH_SECRET;
const COOKIE_NAME = 'pitch-scheduler-session';
const SESSION_MAX_AGE_MS = 48 * 60 * 60 * 1000;

// Mirrors pitch-scheduler-submit's verifySession exactly - kept local rather
// than shared to avoid coupling these routes' internals; if the two drift,
// a session that submit accepts but this route rejects (or vice versa) will
// surface immediately in testing.
function verifySession(cookieValue) {
  if (!AUTH_SECRET || !cookieValue) return null;
  const parts = cookieValue.split(':');
  if (parts.length !== 3) return null;
  const [invitationId, timestamp, signature] = parts;
  const age = Date.now() - parseInt(timestamp, 10);
  if (isNaN(age) || age < 0 || age > SESSION_MAX_AGE_MS) return null;
  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(`${invitationId}:${timestamp}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return invitationId;
}

// Lets the frontend skip the code-entry screen on a repeat visit within the
// existing 48h session, instead of asking for the code again on every page
// load. GET only, cookie-based - no code or invite id needed in the request,
// since the signed cookie already proves who this is. Called once on mount;
// a 401 here just means "no valid session yet", which is the normal case
// for a first-time visit, not an error to alarm about.
export async function GET(request) {
  const invitationId = verifySession(request.cookies.get(COOKIE_NAME)?.value);
  if (!invitationId) {
    return NextResponse.json({ success: false }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }

  const invitation = await client.fetch(
    `*[_type == "pitchSchedulerInvitation" && invitationId == $invitationId][0]{
      status, slots, contactMethod, founderEmail
    }`,
    { invitationId }
  );

  // Session cookie is still validly signed, but the invitation itself is
  // gone/reset - treat as no session rather than erroring.
  if (!invitation || (invitation.status !== 'invited' && invitation.status !== 'submitted')) {
    return NextResponse.json({ success: false }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }

  return NextResponse.json(
    {
      success: true,
      status: invitation.status,
      slots: invitation.slots || [],
      needsEmail: invitation.contactMethod === 'whatsapp' && !invitation.founderEmail,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
