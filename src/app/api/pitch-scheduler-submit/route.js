import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import crypto from 'crypto';
import { Resend } from 'resend';

const readClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
});

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

const AUTH_SECRET = process.env.PITCH_SCHEDULER_AUTH_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const COOKIE_NAME = 'pitch-scheduler-session';
const SESSION_MAX_AGE_MS = 48 * 60 * 60 * 1000;
const PRANAV_EMAIL = 'pranav@yali.vc';
const IST = 'Asia/Kolkata';

const MAX_COMPANY_LEN = 120;
const MAX_TEAMMATES = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// Strip control characters and cap length — this text goes straight into an
// HTML email body, escaped separately below.
function sanitizeText(value, maxLen) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, maxLen);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatSlotIST(startUTC, endUTC) {
  const fmtDay = new Intl.DateTimeFormat('en-US', { timeZone: IST, weekday: 'short', day: 'numeric', month: 'short' });
  const fmtTime = new Intl.DateTimeFormat('en-US', { timeZone: IST, hour: 'numeric', minute: '2-digit', hour12: true });
  const start = new Date(startUTC);
  const end = new Date(endUTC);
  return `${fmtDay.format(start)}, ${fmtTime.format(start)}–${fmtTime.format(end)} IST`;
}

export async function POST(request) {
  if (!AUTH_SECRET) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const invitationId = verifySession(request.cookies.get(COOKIE_NAME)?.value);
  if (!invitationId) {
    return NextResponse.json({ error: 'Session expired. Please use your code again.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { selectedSlotId, founderEmail: submittedEmail } = body || {};
  const companyName = sanitizeText(body?.companyName, MAX_COMPANY_LEN);
  const teammateEmails = Array.isArray(body?.teammateEmails)
    ? body.teammateEmails
        .map((e) => sanitizeText(e, 200))
        .filter((e) => e && EMAIL_RE.test(e))
        .slice(0, MAX_TEAMMATES)
    : [];

  if (!selectedSlotId || !companyName) {
    return NextResponse.json({ error: 'Slot and company name are required' }, { status: 400 });
  }

  const invitation = await readClient.fetch(
    `*[_type == "pitchSchedulerInvitation" && invitationId == $invitationId][0]{
      _id, _rev, invitationId, founderEmail, contactMethod, status, expiresAt, slots
    }`,
    { invitationId }
  );

  if (!invitation || invitation.status !== 'invited') {
    return NextResponse.json({ error: 'This invitation has already been used or is no longer valid' }, { status: 409 });
  }
  if (!invitation.expiresAt || new Date(invitation.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'This invitation has expired' }, { status: 410 });
  }

  const slot = (invitation.slots || []).find((s) => s.slotId === selectedSlotId);
  if (!slot) {
    return NextResponse.json({ error: 'That slot is not part of this invitation' }, { status: 400 });
  }

  // Whatsapp-contact invitations may not have an email yet — collect it now.
  let founderEmail = invitation.founderEmail;
  if (!founderEmail) {
    const candidate = sanitizeText(submittedEmail, 200);
    if (!candidate || !EMAIL_RE.test(candidate)) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }
    founderEmail = candidate;
  }

  // Atomic single-use: this patch only succeeds if the document's revision
  // hasn't changed since we read it above — a concurrent/replayed submit on
  // the same invitation will fail here instead of both succeeding.
  let patched;
  try {
    patched = await writeClient
      .patch(invitation._id)
      .ifRevisionId(invitation._rev)
      .set({
        status: 'submitted',
        selectedSlotId,
        companyName,
        teammateEmails,
        founderEmail,
        notificationStatus: 'pending',
      })
      .commit();
  } catch {
    return NextResponse.json({ error: 'This invitation has already been used' }, { status: 409 });
  }

  // Send the notification to Pranav — best-effort; the state transition above
  // already succeeded regardless of whether this email goes through.
  let notificationStatus = 'failed';
  if (RESEND_API_KEY) {
    try {
      const resend = new Resend(RESEND_API_KEY);
      const teammateList = teammateEmails.length
        ? teammateEmails.map(escapeHtml).join(', ')
        : '(none listed)';
      await resend.emails.send({
        from: 'Yali Capital <scheduling-noreply@yali.vc>',
        to: PRANAV_EMAIL,
        subject: `Virtual Pitch Meeting: ${companyName} <> Yali`,
        html: `<p><strong>${escapeHtml(companyName)}</strong> picked a slot via the pitch scheduler.</p>
<p><strong>Slot:</strong> ${escapeHtml(formatSlotIST(slot.startUTC, slot.endUTC))}<br/>
<strong>Founder email:</strong> ${escapeHtml(founderEmail)}<br/>
<strong>Teammates:</strong> ${teammateList}</p>
<p>Create the calendar invite when ready — this only confirmed their preference.</p>`,
      });
      notificationStatus = 'sent';
    } catch {
      notificationStatus = 'failed';
    }
  }

  await writeClient.patch(invitation._id).set({ notificationStatus }).commit();

  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
