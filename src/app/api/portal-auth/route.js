import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import crypto from 'crypto';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
});

const AUTH_SECRET = process.env.PORTAL_AUTH_SECRET;
const COOKIE_NAME = 'portal-session';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

function signCookie(email, timestamp) {
  const data = `${email}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(data)
    .digest('hex');
  return `${data}:${signature}`;
}

export async function POST(request) {
  if (!AUTH_SECRET) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    const { email, accessCode } = await request.json();

    if (!email || !accessCode) {
      return NextResponse.json(
        { error: 'Email and access code are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await client.fetch(
      `*[_type == "portalUser" && lower(email) == $email && accessCode == $accessCode && isActive == true][0]{
        _id, email, name
      }`,
      { email: normalizedEmail, accessCode }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials or account inactive' },
        { status: 401 }
      );
    }

    const timestamp = Date.now().toString();
    const cookieValue = signCookie(normalizedEmail, timestamp);

    const response = NextResponse.json({
      success: true,
      name: user.name || null,
    });

    response.cookies.set(COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Portal auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
