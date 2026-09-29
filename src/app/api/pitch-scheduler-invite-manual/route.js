import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import crypto from 'crypto';
import { Resend } from 'resend';
import { getPlaceholderSlots } from '@/lib/graphCalendar';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const INVITE_EXPIRY_HOURS = 48;
const IST = 'Asia/Kolkata';

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://yali.vc',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Must match pitch-scheduler-auth/route.js's hashCode exactly. No shared
// secret needed - a random per-invitation salt plus that route's rate limit
// is what makes this safe, which is what lets the routine (which can't hold
// a secret) mint invitations the same way this route does.
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
// offered. So we read those titled events directly off the calendar and use
// their real start/end times - no hardcoded pattern, no busy/free check.
//
// If calendar access isn't connected or Graph errors, we genuinely have no
// way to know what's offered (there's no pattern to fall back to anymore) -
// the caller treats a null/empty result as "no slots available" rather than
// fabricating times, unlike the old fail-open behaviour this replaced.
const PLACEHOLDER_TITLE_MATCHERS = ['pitch meeting placeholder', 'additional slots'];
const MIN_LEAD_DAYS = 2;
const MAX_SLOTS = 14;

async function computeCandidateSlots() {
  const now = new Date();
  const windowStart = now.toISOString();
  const windowEnd = new Date(now.getTime() + 46 * 24 * 60 * 60 * 1000).toISOString();

  const events = await getPlaceholderSlots(windowStart, windowEnd, PLACEHOLDER_TITLE_MATCHERS);
  if (!events) return [];

  const minStart = new Date(now.getTime() + MIN_LEAD_DAYS * 24 * 60 * 60 * 1000);
  return events
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
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS });
  }

  const { docId, contactMethod, whatsappNumber, founderEmail, companyName } = body || {};
  if (!docId) {
    return NextResponse.json({ error: 'Save the document first' }, { status: 400, headers: CORS_HEADERS });
  }

  const isWhatsapp = contactMethod === 'whatsapp';
  const normalizedEmail = founderEmail ? founderEmail.toLowerCase().trim() : '';

  if (isWhatsapp && !whatsappNumber) {
    return NextResponse.json({ error: 'WhatsApp number is required' }, { status: 400, headers: CORS_HEADERS });
  }
  if (!isWhatsapp && (!normalizedEmail || !EMAIL_RE.test(normalizedEmail))) {
    return NextResponse.json({ error: 'A valid founder email is required' }, { status: 400, headers: CORS_HEADERS });
  }

  const slots = await computeCandidateSlots();
  if (slots.length === 0) {
    return NextResponse.json(
      { error: 'No pitch-slot placeholders found on the calendar in the next ~6.5 weeks (or the calendar connection needs reconnecting). Add some placeholder events, or check /api/pitch-scheduler-calendar-connect.' },
      { status: 409, headers: CORS_HEADERS }
    );
  }

  const invitationId = crypto.randomBytes(12).toString('hex');
  const code = crypto.randomInt(100000, 1000000).toString(); // full 6-digit range
  const codeSalt = crypto.randomBytes(8).toString('hex');
  const codeHash = hashCode(codeSalt, code);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000);
  const link = `https://yali.vc/pitch/scheduler?invite=${invitationId}`;

  const patch = {
    contactMethod: isWhatsapp ? 'whatsapp' : 'email',
    whatsappNumber: isWhatsapp ? whatsappNumber : undefined,
    founderEmail: isWhatsapp ? (normalizedEmail || undefined) : normalizedEmail,
    companyName: companyName || undefined,
    invitationId,
    codeSalt,
    codeHash,
    slots,
    status: 'invited',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    source: 'manual',
  };
  // Sanity's patch.set ignores undefined-valued keys at the JSON layer isn't
  // guaranteed — strip them explicitly.
  Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k]);

  // Studio saves new documents as drafts (id "drafts.<docId>") until
  // explicitly published. A plain `.patch(docId)` fails if only the draft
  // exists yet, AND even if it succeeded, the public/unauthenticated client
  // in pitch-scheduler-auth can't see drafts at all - the founder's code
  // would never verify. So we write straight to the PUBLISHED id via
  // createOrReplace (using the fields already in `body`, not re-reading from
  // Sanity - the draft may hold newer unsaved values than the published doc)
  // and clean up any leftover draft so Studio doesn't show a stale one.
  try {
    await writeClient.createOrReplace({ _id: docId, _type: 'pitchSchedulerInvitation', ...patch });
    await writeClient.delete(`drafts.${docId}`).catch(() => {}); // no draft to clean up is fine
  } catch (err) {
    console.error('Failed to save invitation:', err);
    return NextResponse.json({ error: 'Failed to save invitation' }, { status: 500, headers: CORS_HEADERS });
  }

  if (!isWhatsapp) {
    // Email path: OTP + link both go to the founder. The code is never
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
        await writeClient.patch(docId).set({ notificationStatus: 'sent' }).commit();
      } catch (err) {
        console.error('Failed to send invite email:', err);
        await writeClient.patch(docId).set({ notificationStatus: 'failed' }).commit();
        return NextResponse.json({ error: 'Saved, but failed to email the founder' }, { status: 500, headers: CORS_HEADERS });
      }
    }
    return NextResponse.json({ success: true, link }, { headers: CORS_HEADERS });
  }

  // WhatsApp path: nothing emailed. Return both link and plaintext code once
  // — this is the only time the code exists outside the hash.
  return NextResponse.json({ success: true, link, code }, { headers: CORS_HEADERS });
}
