import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import crypto from 'crypto';
import { Resend } from 'resend';

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

// Same recurring-slot shape as the Outlook routine offers (Tue 10-11, Tue
// 11-12, Fri 10-11 IST), computed for the next ~2 weeks. This is a snapshot
// at creation time, not a live calendar check — same as the automated path.
function computeCandidateSlots() {
  const slots = [];
  const now = new Date();
  for (let dayOffset = 2; dayOffset <= 16 && slots.length < 6; dayOffset++) {
    const d = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const istWeekday = new Intl.DateTimeFormat('en-US', { timeZone: IST, weekday: 'short' }).format(d);
    const isTue = istWeekday === 'Tue';
    const isFri = istWeekday === 'Fri';
    if (!isTue && !isFri) continue;
    const y = new Intl.DateTimeFormat('en-CA', { timeZone: IST, year: 'numeric' }).format(d);
    const m = new Intl.DateTimeFormat('en-CA', { timeZone: IST, month: '2-digit' }).format(d);
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: IST, day: '2-digit' }).format(d);
    // 10:00-11:00 IST == 04:30-05:30 UTC; 11:00-12:00 IST == 05:30-06:30 UTC
    slots.push({
      slotId: crypto.randomBytes(4).toString('hex'),
      startUTC: `${y}-${m}-${day}T04:30:00.000Z`,
      endUTC: `${y}-${m}-${day}T05:30:00.000Z`,
    });
    if (isTue) {
      slots.push({
        slotId: crypto.randomBytes(4).toString('hex'),
        startUTC: `${y}-${m}-${day}T05:30:00.000Z`,
        endUTC: `${y}-${m}-${day}T06:30:00.000Z`,
      });
    }
  }
  return slots.slice(0, 6);
}

function inviteEmailHtml(link) {
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
  .cta-button { display: inline-block; background: #830d35; color: #efefef !important; font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; padding: 16px 36px; }
  .note { font-size: 12px; color: #666; margin-top: 20px; }
</style></head>
<body><div class="wrapper">
<div class="hero"><div class="hero-title">Pick a time for your pitch</div></div>
<div class="body">
<p class="greeting">We'd like to schedule a pitch meeting. Use the link below and the one-time code we've sent to pick a slot that works for you.</p>
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
    slots: computeCandidateSlots(),
    status: 'invited',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    source: 'manual',
  };
  // Sanity's patch.set ignores undefined-valued keys at the JSON layer isn't
  // guaranteed — strip them explicitly.
  Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k]);

  try {
    await writeClient.patch(docId).set(patch).commit();
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
          html: `<p>Your one-time code: <strong style="font-size:20px;letter-spacing:0.2em;">${code}</strong></p>${inviteEmailHtml(link)}`,
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
