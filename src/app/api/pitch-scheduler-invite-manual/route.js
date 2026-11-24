import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';
import { getCachedSlots } from '@/lib/slotCache';
import { getTeamUser } from '@/decks/auth';
import { TEAM_COOKIE } from '@/lib/teamSession';
import { createInvitation, updateInvitation } from '@/lib/pitch-invitations';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const INVITE_EXPIRY_HOURS = 48;
const IST = 'Asia/Kolkata';

// Called from team.yali.vc/pitch-invites (same origin) by a signed-in team member
// with the 'pitch' area (src/lib/teamSession.js ACCESS). Invitations are stored in
// Supabase since 24 Nov 2026 (src/lib/pitch-invitations.js).
const NO_STORE = { 'Cache-Control': 'no-store' };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Must match pitch-scheduler-auth/route.js's hashCode exactly. No shared
// secret needed - a random per-invitation salt plus that route's rate limit
// is what makes this safe.
function hashCode(codeSalt, code) {
  return crypto.createHash('sha256').update(`${codeSalt}:${code}`).digest('hex');
}

// Offered slots are NOT a hardcoded time pattern checked against busy/free -
// Pranav maintains specifically-titled placeholder events on his own
// calendar ("Pitch meeting placeholder" on Tue/Fri, "Weekly Pitch Meeting:
// Additional slots" on Mon/Wed, added later when Gani asked for more
// availability). A placeholder's mere existence at a given time IS the
// availability signal; deleting an occurrence (holiday, travel, a real
// meeting got booked there instead) is how he marks that date as not
// offered.
//
// Reads from the shared slot cache (refreshed hourly by cron, see
// src/lib/slotCache.js) rather than calling Graph directly on every
// generation - keeps Graph traffic to one scheduled job instead of one call
// per invitation created.
const MIN_LEAD_DAYS = 2;
const MAX_SLOTS = 14;

async function computeCandidateSlots() {
  const cached = await getCachedSlots();
  if (!cached) return [];

  const now = new Date();
  const minStart = new Date(now.getTime() + MIN_LEAD_DAYS * 24 * 60 * 60 * 1000);
  return cached
    .filter((e) => new Date(e.startUTC) >= minStart)
    .slice(0, MAX_SLOTS)
    .map((e) => ({ slotId: crypto.randomBytes(4).toString('hex'), startUTC: e.startUTC, endUTC: e.endUTC }));
}

function inviteEmailHtml(link, code) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@700&family=Inter:wght@400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background-color: #d0d0d0; font-family: 'Inter', sans-serif; color: #363636; padding: 40px 20px; }
  .wrapper { max-width: 520px; margin: 0 auto; background: #efefef; }
  .hero { background: #830d35; padding: 40px; }
  .hero-title { font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 700; color: #efefef; }
  .body { padding: 32px 40px; }
  .greeting { font-size: 14px; line-height: 1.7; margin-bottom: 24px; }
  .code-box { background: #ffffff; border: 1px solid rgba(54,54,54,0.15); padding: 16px 20px; margin-bottom: 24px; }
  .code-label { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #666; margin-bottom: 6px; }
  .code-value { font-family: 'JetBrains Mono', monospace; font-size: 28px; font-weight: 700; letter-spacing: 0.2em; }
  .cta-button { display: inline-block; background: #830d35; color: #efefef !important; font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; padding: 16px 36px; }
  .note { font-size: 12px; color: #666; margin-top: 20px; }
</style></head>
<body><div class="wrapper">
<div class="hero"><div class="hero-title">Pick a time for your pitch</div></div>
<div class="body">
<p class="greeting">We'd like to schedule a pitch meeting. Use the code below and the link to pick a slot that works for you.</p>
<div class="code-box"><div class="code-label">Your one-time code</div><div class="code-value">${code}</div></div>
<a href="${link}" class="cta-button">Pick a slot</a>
<p class="note">This link and code are valid for 48 hours and are for single use.</p>
</div>
</div></body></html>`;
}

export async function POST(request) {
  const createdBy = getTeamUser(request.cookies.get(TEAM_COOKIE)?.value, 'pitch');
  if (!createdBy) {
    return NextResponse.json({ error: 'Sign in to team.yali.vc first' }, { status: 401, headers: NO_STORE });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: NO_STORE });
  }

  const { contactMethod, whatsappNumber, founderName, founderEmail, companyName } = body || {};

  // Three contact methods: email (this app sends the OTP directly), whatsapp
  // or name-only (Pranav relays the link+code himself - the only difference
  // between those two is which identifier is on file to remember who it's
  // for; neither triggers an automated email).
  const method = ['email', 'whatsapp', 'name'].includes(contactMethod) ? contactMethod : 'email';
  const isEmail = method === 'email';
  const isWhatsapp = method === 'whatsapp';
  const isNameOnly = method === 'name';
  const normalizedEmail = founderEmail ? founderEmail.toLowerCase().trim() : '';

  if (isWhatsapp && !whatsappNumber) {
    return NextResponse.json({ error: 'WhatsApp number is required' }, { status: 400, headers: NO_STORE });
  }
  if (isNameOnly && !founderName) {
    return NextResponse.json({ error: 'A contact name is required' }, { status: 400, headers: NO_STORE });
  }
  if (isEmail && (!normalizedEmail || !EMAIL_RE.test(normalizedEmail))) {
    return NextResponse.json({ error: 'A valid contact email is required' }, { status: 400, headers: NO_STORE });
  }

  const slots = await computeCandidateSlots();
  if (slots.length === 0) {
    return NextResponse.json(
      { error: 'No pitch-slot placeholders in the cache right now (either none exist in the next ~6.5 weeks, or the cache has never been refreshed - check the hourly slot refresh cron).' },
      { status: 409, headers: NO_STORE }
    );
  }

  const invitationId = crypto.randomBytes(12).toString('hex');
  const code = crypto.randomInt(100000, 1000000).toString(); // full 6-digit range
  const codeSalt = crypto.randomBytes(8).toString('hex');
  const codeHash = hashCode(codeSalt, code);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000);
  const link = `https://yali.vc/pitch/scheduler?invite=${invitationId}`;

  const fields = {
    contactMethod: method,
    whatsappNumber: isWhatsapp ? whatsappNumber : undefined,
    founderName: isNameOnly ? founderName : undefined,
    founderEmail: isEmail ? normalizedEmail : (normalizedEmail || undefined),
    companyName: companyName || undefined,
    invitationId,
    codeSalt,
    codeHash,
    slots,
    status: 'invited',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    source: 'manual',
    createdBy,
  };
  Object.keys(fields).forEach((k) => fields[k] === undefined && delete fields[k]);

  let doc;
  try {
    doc = await createInvitation(fields);
  } catch (err) {
    console.error('Failed to save invitation:', err.message);
    return NextResponse.json({ error: 'Failed to save invitation' }, { status: 500, headers: NO_STORE });
  }

  if (isEmail) {
    // Email path: OTP + link both go to the contact. The code is never
    // returned in this response — it only ever exists in the email.
    if (RESEND_API_KEY) {
      try {
        const resend = new Resend(RESEND_API_KEY);
        await resend.emails.send({
          from: 'Yali Capital <scheduling-noreply@yali.vc>',
          to: normalizedEmail,
          subject: 'Your one-time code and scheduling link',
          html: inviteEmailHtml(link, code),
        });
        await updateInvitation(doc._id, { notificationStatus: 'sent' });
      } catch (err) {
        console.error('Failed to send invite email:', err.message);
        await updateInvitation(doc._id, { notificationStatus: 'failed' }).catch(() => {});
        return NextResponse.json({ error: 'Saved, but failed to send the email' }, { status: 500, headers: NO_STORE });
      }
    }
    return NextResponse.json({ success: true, link }, { headers: NO_STORE });
  }

  // WhatsApp / name-only path: nothing emailed. Return both link and
  // plaintext code once — this is the only time the code exists outside the
  // hash — for Pranav to relay however he's actually reaching this contact.
  return NextResponse.json({ success: true, link, code }, { headers: NO_STORE });
}
