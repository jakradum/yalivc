import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import crypto from 'crypto';
import { Resend } from 'resend';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
});

const AUTH_SECRET = process.env.PORTAL_AUTH_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const COOKIE_NAME = 'portal-session';
const OTP_COOKIE = 'portal-otp-pending';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const OTP_EXPIRY = 10 * 60; // 10 minutes in seconds

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

function signOTP(email, code, timestamp) {
  return crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(`${email}:${code}:${timestamp}`)
    .digest('hex');
}

function signSession(email, timestamp) {
  const data = `${email}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(data)
    .digest('hex');
  return `${data}:${signature}`;
}

export async function POST(request) {
  if (!AUTH_SECRET) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const { action, email, code } = await request.json();

    if (action === 'send-code') {
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }

      const normalizedEmail = email.toLowerCase().trim();

      const user = await client.fetch(
        `*[_type == "portalUser" && lower(email) == $email && isActive == true][0]{ _id, name }`,
        { email: normalizedEmail }
      );

      if (!user) {
        return NextResponse.json(
          { error: 'This email is not registered for portal access' },
          { status: 401 }
        );
      }

      const otp = generateOTP();
      const timestamp = Date.now().toString();
      const otpSignature = signOTP(normalizedEmail, otp, timestamp);

      // Send OTP via Resend
      const resend = new Resend(RESEND_API_KEY);
      await resend.emails.send({
        from: 'YALI Capital <noreply@yali.vc>',
        to: normalizedEmail,
        subject: 'Your LP Portal verification code',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #830D35;">YALI Capital LP Portal</h2>
            <p>Hi${user.name ? ` ${user.name}` : ''},</p>
            <p>Your verification code is:</p>
            <div style="background: #f5f5f5; padding: 1.5rem; text-align: center; margin: 1.5rem 0;">
              <span style="font-size: 2rem; font-weight: 700; letter-spacing: 0.3rem; color: #1a1a1a;">${otp}</span>
            </div>
            <p style="color: #666; font-size: 0.875rem;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
          </div>
        `,
      });

      // Store OTP proof in a short-lived cookie (stateless verification)
      const response = NextResponse.json({ success: true });
      response.cookies.set(OTP_COOKIE, `${normalizedEmail}:${timestamp}:${otpSignature}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: OTP_EXPIRY,
        path: '/',
      });

      return response;
    }

    if (action === 'verify-code') {
      if (!code) {
        return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
      }

      const otpCookie = request.cookies.get(OTP_COOKIE)?.value;
      if (!otpCookie) {
        return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 401 });
      }

      const [storedEmail, storedTimestamp, storedSignature] = otpCookie.split(':');

      // Check expiry
      const elapsed = Date.now() - parseInt(storedTimestamp, 10);
      if (elapsed > OTP_EXPIRY * 1000) {
        return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 401 });
      }

      // Verify the submitted code matches
      const expectedSignature = signOTP(storedEmail, code, storedTimestamp);
      if (expectedSignature !== storedSignature) {
        return NextResponse.json({ error: 'Invalid code' }, { status: 401 });
      }

      // Set long-lived session cookie
      const sessionTimestamp = Date.now().toString();
      const sessionValue = signSession(storedEmail, sessionTimestamp);

      const response = NextResponse.json({ success: true });
      response.cookies.set(COOKIE_NAME, sessionValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
      });
      // Clear the OTP cookie
      response.cookies.delete(OTP_COOKIE);

      return response;
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Portal auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
