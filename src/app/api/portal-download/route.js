import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

const AUTH_SECRET = process.env.PORTAL_AUTH_SECRET;
const COOKIE_NAME = 'portal-session';

// Verify session cookie and extract email
async function verifySession(request) {
  const cookieValue = request.cookies.get(COOKIE_NAME)?.value;
  if (!cookieValue || !AUTH_SECRET) return null;

  const parts = cookieValue.split(':');
  if (parts.length !== 3) return null;

  const [email, timestamp, signature] = parts;
  const data = `${email}:${timestamp}`;

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
    const doc = await client.create({
      _type: 'lpDownloadConsent',
      email,
      downloadType,
      reportQuarter: reportQuarter || null,
      fileName: fileName || null,
      consentedAt: new Date().toISOString(),
      ipAddress,
    });

    return NextResponse.json({ success: true, id: doc._id });
  } catch (error) {
    console.error('Portal download consent error:', error);
    return NextResponse.json({ error: 'Failed to log consent' }, { status: 500 });
  }
}
