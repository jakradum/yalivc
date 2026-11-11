import { NextResponse } from 'next/server';
import { createDownloadConsent } from '@/lib/lp-data';
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

    const { downloadType, reportQuarter, fileName } = await request.json();

    if (!downloadType) {
      return NextResponse.json({ error: 'Download type is required' }, { status: 400 });
    }

    // Get IP address (optional)
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || null;

    // Create consent record in Sanity
    const doc = await createDownloadConsent({
      email,
      downloadType,
      reportQuarter: reportQuarter || null,
      fileName: fileName || null,
      consentedAt: new Date().toISOString(),
      ipAddress,
    });
    await markVisit(email, { downloaded: true });

    return NextResponse.json({ success: true, id: doc._id });
  } catch (error) {
    console.error('Portal download consent error:', error);
    return NextResponse.json({ error: 'Failed to log consent' }, { status: 500 });
  }
}
