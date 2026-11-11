import { NextResponse } from 'next/server';
import { createPortalFeedback } from '@/lib/lp-data';
import { markVisit } from '@/lib/visits';


const AUTH_SECRET = process.env.PORTAL_AUTH_SECRET;
const COOKIE_NAME = 'portal-session';

// Verify session cookie and extract email
async function verifySession(request) {
  const cookieValue = request.cookies.get(COOKIE_NAME)?.value;
  if (!cookieValue || !AUTH_SECRET) return null;

  const parts = cookieValue.split(':');
  if (parts.length !== 3) return null;

  const [email, timestamp, signature] = parts;
  const data = `portal:${email}:${timestamp}`; // scoped: see src/lib/session.js

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(AUTH_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    const expectedSig = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (expectedSig === signature) {
      return email;
    }
  } catch {
    return null;
  }
  return null;
}

export async function POST(request) {
  try {
    // Verify authenticated user
    const email = await verifySession(request);
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { npsScore, reportQuarter, feedbackDetails } = await request.json();

    if (npsScore === undefined || npsScore === null) {
      return NextResponse.json({ error: 'NPS score is required' }, { status: 400 });
    }

    const score = parseInt(npsScore, 10);
    if (isNaN(score) || score < 0 || score > 10) {
      return NextResponse.json({ error: 'NPS score must be between 0 and 10' }, { status: 400 });
    }

    // Create feedback record in Sanity
    const doc = await createPortalFeedback({
      email,
      npsScore: score,
      reportQuarter: reportQuarter || null,
      feedbackDetails: feedbackDetails || null,
      submittedAt: new Date().toISOString(),
    });
    await markVisit(email, { rating: score });

    return NextResponse.json({ success: true, id: doc._id });
  } catch (error) {
    console.error('Portal feedback error:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
