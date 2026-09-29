import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import crypto from 'crypto';
import { getCachedSlots, slotStillCached } from '@/lib/slotCache';

// No `send-code` action here on purpose — see docs/pitch-scheduler-plan.md.
// Codes are only ever minted at invitation-creation time (by the routine via
// its Sanity MCP connector, or by Pranav manually in Studio for WhatsApp-
// originated asks) — never on-demand by a page visitor. This route only
// verifies a code against an invitation that already exists.

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
});

const AUTH_SECRET = process.env.PITCH_SCHEDULER_AUTH_SECRET;
const COOKIE_NAME = 'pitch-scheduler-session';
// Two-clock model (see plan doc): this is the SESSION clock, fresh from the
// moment of successful verification — independent of the invitation's own
// `expiresAt` (48h from creation), which is checked separately below.
const SESSION_MAX_AGE = 48 * 60 * 60; // 48 hours, in seconds

// Rate limiting: in-memory, resets on redeploy — matches the LP portal's
// existing pattern. Flagged in the plan as worth upgrading to something
// durable (Redis/Vercel KV) before this sees real traffic; not blocking a v1.
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 8;

function checkRateLimit(key) {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  if (rateLimitStore.size > 10000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (now - v.windowStart > RATE_LIMIT_WINDOW) rateLimitStore.delete(k);
    }
  }
  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(key, { windowStart: now, attempts: 1 });
    return true;
  }
  if (record.attempts >= RATE_LIMIT_MAX_ATTEMPTS) return false;
  record.attempts++;
  return true;
}

function timingSafeEqualStr(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    // Still run a comparison of equal length to avoid an early-return timing
    // signal on length mismatch.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// No shared secret needed here: a random per-invitation salt plus the rate
// limit above (8 attempts/15min against a 900,000-value code) is what makes
// this safe, not a global pepper. This lets invitation-minting happen from
// anywhere that can write to Sanity (including the routine's sandbox, which
// has no way to hold a secret) without needing to share AUTH_SECRET with it.
function hashCode(codeSalt, code) {
  return crypto.createHash('sha256').update(`${codeSalt}:${code}`).digest('hex');
}

// Signed on invitationId alone, not founderEmail — for whatsapp-contact
// invitations, founderEmail may still be blank at this point (collected later
// in the form on submit). The submit route re-fetches the live document by
// invitationId rather than trusting anything baked into the cookie.
function signSession(invitationId, timestamp) {
  const data = `${invitationId}:${timestamp}`;
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('hex');
  return `${data}:${signature}`;
}

export async function POST(request) {
  if (!AUTH_SECRET) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { invite, code } = body || {};
  if (!invite || !code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Invitation and code are required' }, { status: 400 });
  }

  if (!checkRateLimit(invite)) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }

  const invitation = await client.fetch(
    `*[_type == "pitchSchedulerInvitation" && invitationId == $invite][0]{
      _id, invitationId, founderEmail, contactMethod, codeSalt, codeHash, status, expiresAt, slots
    }`,
    { invite }
  );

  // Generic failure for "doesn't exist", "expired", and "wrong code" alike —
  // never reveal which one, same posture as the LP portal's auth route.
  const genericFailure = () =>
    NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });

  if (!invitation) return genericFailure();
  if (invitation.status !== 'invited') return genericFailure();
  if (!invitation.expiresAt || new Date(invitation.expiresAt) < new Date()) return genericFailure();

  if (!invitation.codeSalt) return genericFailure();
  const expectedHash = hashCode(invitation.codeSalt, code.trim());
  if (!timingSafeEqualStr(expectedHash, invitation.codeHash)) return genericFailure();

  const timestamp = Date.now().toString();
  const sessionValue = signSession(invitation.invitationId, timestamp);

  // Filter the invitation's originally-offered slots against the current
  // slot cache, so a placeholder Pranav deletes after sending disappears
  // from what the founder sees without anyone patching this invitation by
  // hand. If the cache itself is unreachable, fall back to what was
  // originally offered rather than showing nothing.
  const cached = await getCachedSlots();
  const offeredSlots = invitation.slots || [];
  const liveSlots = cached ? offeredSlots.filter((s) => slotStillCached(s.startUTC, s.endUTC, cached)) : offeredSlots;

  const response = NextResponse.json({
    success: true,
    slots: liveSlots,
    // Tells the frontend whether to show an email field in the form — true
    // for whatsapp-contact invitations that don't have one yet.
    needsEmail: invitation.contactMethod === 'whatsapp' && !invitation.founderEmail,
  });
  response.cookies.set(COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
