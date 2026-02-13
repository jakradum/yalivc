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

// Rate limiting: in-memory store (resets on server restart)
// For production, consider using Redis or Vercel KV
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5;

function checkRateLimit(email) {
  const now = Date.now();
  const key = email.toLowerCase();
  const record = rateLimitStore.get(key);

  // Clean up old entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (now - v.windowStart > RATE_LIMIT_WINDOW) {
        rateLimitStore.delete(k);
      }
    }
  }

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(key, { windowStart: now, attempts: 1 });
    return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - 1 };
  }

  if (record.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
    const resetTime = Math.ceil((record.windowStart + RATE_LIMIT_WINDOW - now) / 1000);
    return { allowed: false, resetInSeconds: resetTime };
  }

  record.attempts++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - record.attempts };
}

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

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

      // Check rate limit before processing
      const rateLimit = checkRateLimit(normalizedEmail);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: `Too many attempts. Please try again in ${rateLimit.resetInSeconds} seconds.` },
          { status: 429 }
        );
      }

      const user = await client.fetch(
        `*[_type == "portalUser" && lower(email) == $email && isActive == true][0]{ _id, name }`,
        { email: normalizedEmail }
      );

      // Generic response to prevent email enumeration
      // Always return success message, but only send email if user exists
      if (!user) {
        // Delay to prevent timing-based enumeration
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
        return NextResponse.json({ success: true });
      }

      const otp = generateOTP();
      const timestamp = Date.now().toString();
      const otpSignature = signOTP(normalizedEmail, otp, timestamp);

      // Send OTP via Resend
      const resend = new Resend(RESEND_API_KEY);
      await resend.emails.send({
        from: 'Yali Partners <noreply@yali.vc>',
        to: normalizedEmail,
        subject: 'Your code to log in to the Yali Partners portal',
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff;">
            <!-- Letterhead -->
            <div style="border-bottom: 1px solid #e0e0e0; padding: 24px 0; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
              <img src="https://yali.vc/yali-logo.png" alt="Yali Partners" style="height: 36px; width: auto;" />
              <div style="text-align: right;">
                <div style="font-size: 14px; font-weight: 600; color: #830D35;">Yali Partners LLP</div>
                <div style="font-size: 12px; color: #666;">Limited Partners' Reports</div>
              </div>
            </div>

            <!-- Body -->
            <p style="color: #363636; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">Hi${user.name ? ` ${user.name}` : ''},</p>
            <p style="color: #363636; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">Your verification code is:</p>

            <!-- Code -->
            <div style="background: #f5f5f5; padding: 24px; text-align: center; margin: 0 0 20px 0;">
              <span style="font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', 'Courier New', monospace; font-size: 32px; font-weight: 700; letter-spacing: 0.4em; color: #1a1a1a;">${otp}</span>
            </div>

            <p style="color: #666; font-size: 13px; line-height: 1.5; margin: 0 0 32px 0;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>

            <!-- Footer -->
            <div style="border-top: 1px solid #e0e0e0; padding-top: 16px;">
              <p style="color: #999; font-size: 11px; line-height: 1.4; margin: 0; text-align: center;">This is a system-generated email. Please do not reply.</p>
            </div>
          </div>
        `,
      });

      // Store OTP proof in a short-lived cookie (stateless verification)
      const response = NextResponse.json({ success: true });
      response.cookies.set(OTP_COOKIE, `${normalizedEmail}:${timestamp}:${otpSignature}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
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

      // Verify the submitted code matches using constant-time comparison
      const expectedSignature = signOTP(storedEmail, code, storedTimestamp);
      if (!timingSafeEqual(expectedSignature, storedSignature)) {
        return NextResponse.json({ error: 'Invalid code' }, { status: 401 });
      }

      // Set long-lived session cookie
      const sessionTimestamp = Date.now().toString();
      const sessionValue = signSession(storedEmail, sessionTimestamp);

      const response = NextResponse.json({ success: true });
      response.cookies.set(COOKIE_NAME, sessionValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
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
