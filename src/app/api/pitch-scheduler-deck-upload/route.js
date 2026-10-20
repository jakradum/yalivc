import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import crypto from 'crypto';
import { createDeckUploadSession, MAX_DECK_BYTES } from '@/lib/graphDrive';

// Hands the slot-picker a OneDrive upload URL for the founder's (optional)
// pitch deck. The browser then uploads directly to OneDrive - see
// src/lib/graphDrive.js for why. Requires a valid scheduler session.

const readClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
});

const AUTH_SECRET = process.env.PITCH_SCHEDULER_AUTH_SECRET;
const COOKIE_NAME = 'pitch-scheduler-session';
const SESSION_MAX_AGE_MS = 48 * 60 * 60 * 1000;

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

export async function POST(request) {
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
  const { fileName, size, companyName } = body || {};
  if (typeof fileName !== 'string' || !/\.pdf$/i.test(fileName)) {
    return NextResponse.json({ error: 'Please upload a PDF' }, { status: 400 });
  }
  if (typeof size !== 'number' || size <= 0 || size > MAX_DECK_BYTES) {
    return NextResponse.json({ error: 'The deck must be under 25 MB' }, { status: 400 });
  }

  const invitation = await readClient.fetch(
    `*[_type == "pitchSchedulerInvitation" && invitationId == $invitationId][0]{status}`,
    { invitationId }
  );
  if (!invitation || invitation.status !== 'invited') {
    return NextResponse.json({ error: 'This invitation is no longer valid' }, { status: 409 });
  }

  try {
    const uploadUrl = await createDeckUploadSession(companyName, fileName);
    return NextResponse.json({ uploadUrl }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('Deck upload session failed:', err);
    return NextResponse.json({ error: 'Deck upload is unavailable right now. You can submit without it.' }, { status: 503 });
  }
}
