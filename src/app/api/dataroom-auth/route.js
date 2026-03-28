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
const COOKIE_NAME = 'dataroom-session';
const OTP_COOKIE = 'dataroom-otp-pending';
const COOKIE_MAX_AGE = 6 * 30 * 24 * 60 * 60; // 6 months
const OTP_EXPIRY = 10 * 60; // 10 minutes in seconds

// Rate limiting: in-memory store (resets on server restart)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5;

function checkRateLimit(email) {
  const now = Date.now();
  const key = email.toLowerCase();
  const record = rateLimitStore.get(key);

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

      const rateLimit = checkRateLimit(normalizedEmail);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: `Too many attempts. Please try again in ${rateLimit.resetInSeconds} seconds.` },
          { status: 429 }
        );
      }

      // @yali.vc addresses always have access — no Sanity lookup needed
      const isYaliEmail = normalizedEmail.endsWith('@yali.vc');

      let user = null;
      if (!isYaliEmail) {
        user = await client.fetch(
          `*[_type == "portalUser" && lower(email) == $email && isActive == true && dataRoomAccess == true][0]{ _id, name }`,
          { email: normalizedEmail }
        );

        // Generic response to prevent email enumeration
        if (!user) {
          await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
          return NextResponse.json({ success: true });
        }
      }

      const otp = generateOTP();
      const timestamp = Date.now().toString();
      const otpSignature = signOTP(normalizedEmail, otp, timestamp);

      const resend = new Resend(RESEND_API_KEY);
      await resend.emails.send({
        from: 'Yali Partners <noreply@yali.vc>',
        to: normalizedEmail,
        subject: 'Your sign-in code for Yali Capital Data Room',
        html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Yali Capital &#8212; Your Sign-In Code</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background-color: #d0d0d0; font-family: 'Inter', sans-serif; color: #363636; padding: 40px 20px; }
  .wrapper { max-width: 600px; margin: 0 auto; background: #efefef; }
  .header { background: #363636; padding: 24px 40px; display: flex; align-items: center; justify-content: space-between; }
  .logo-accent { color: #830d35; }
  .header-tag { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #ebde84; letter-spacing: 0.15em; text-transform: uppercase; }
  .hero { background: #830d35; padding: 48px 40px 40px; position: relative; overflow: hidden; }
  .hero::before { content: ''; position: absolute; top: 0; right: 0; width: 120px; height: 120px; border-left: 1px solid rgba(235,222,132,0.2); border-bottom: 1px solid rgba(235,222,132,0.2); }
  .hero-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: #ebde84; margin-bottom: 16px; }
  .hero-title { font-family: 'JetBrains Mono', monospace; font-size: 28px; font-weight: 700; color: #efefef; line-height: 1.2; max-width: 420px; }
  .hero-title span { color: #ebde84; }
  .body { padding: 40px; }
  .greeting { font-family: 'Inter', sans-serif; font-size: 15px; color: #363636; line-height: 1.7; margin-bottom: 32px; }
  .code-block { background: #363636; padding: 36px 40px; text-align: center; margin: 0 -40px 0; }
  .code-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #ebde84; margin-bottom: 20px; }
  .otp-code { font-family: 'JetBrains Mono', monospace; font-size: 48px; font-weight: 700; color: #efefef; letter-spacing: 0.25em; }
  .expiry-note { margin-top: 16px; font-family: 'Inter', sans-serif; font-size: 12px; color: #999; letter-spacing: 0.05em; }
  .note { padding: 28px 40px; border-left: 3px solid #ebde84; margin: 36px 0 0; background: #e8e8e8; }
  .note p { font-family: 'Inter', sans-serif; font-size: 13px; color: #363636; line-height: 1.7; }
  .footer { padding: 32px 40px; border-top: 1px solid #d0d0d0; }
  .footer-contact { font-family: 'Inter', sans-serif; font-size: 13px; color: #555; line-height: 1.8; margin-bottom: 24px; }
  .footer-contact a { color: #830d35; text-decoration: none; }
  .footer-divider { border: none; border-top: 1px solid #d0d0d0; margin: 24px 0; }
  .footer-meta { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #999; letter-spacing: 0.1em; text-transform: uppercase; }
  @media (max-width: 480px) {
    .otp-code { font-size: 36px; letter-spacing: 0.15em; }
    .hero-title { font-size: 22px; }
    .body, .footer, .header { padding-left: 24px; padding-right: 24px; }
  }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="header-tag">Data Room</div>
  </div>
  <div class="hero">
    <img src="https://yali.vc/yali-logo.png" alt="Yali Capital" style="position: absolute; top: 20px; right: 32px; height: 24px; width: auto; filter: brightness(0) invert(1);" />
    <div class="hero-label">Sign-In Code</div>
    <div class="hero-title">Your one-time <span>access code</span></div>
  </div>
  <div class="body">
    <p class="greeting">Enter the code below to sign in to the Yali Capital Data Room. This code is valid for 10 minutes.</p>
    <div class="code-block">
      <div class="code-label">Your code</div>
      <div class="otp-code">${otp}</div>
      <div class="expiry-note">Expires in 10 minutes</div>
    </div>
    <div class="note">
      <p>If you did not request this code, you can safely ignore this email. Do not share this code with anyone.</p>
    </div>
  </div>
  <div class="footer">
    <div class="footer-contact">
      Questions? Write to us at <a href="mailto:investor-relations@yali.vc">investor-relations@yali.vc</a> or <a href="mailto:sunil@yali.vc">sunil@yali.vc</a>
    </div>
    <hr class="footer-divider">
    <div class="footer-meta">Yali Capital &nbsp;&middot;&nbsp; Confidential &nbsp;&middot;&nbsp; For authorised recipients only</div>
  </div>
</div>
</body>
</html>`,
      });

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

      // --- Path A: standard OTP cookie flow ---
      if (otpCookie) {
        const [storedEmail, storedTimestamp, storedSignature] = otpCookie.split(':');

        const elapsed = Date.now() - parseInt(storedTimestamp, 10);
        if (elapsed > OTP_EXPIRY * 1000) {
          return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 401 });
        }

        const expectedSignature = signOTP(storedEmail, code, storedTimestamp);
        if (!timingSafeEqual(expectedSignature, storedSignature)) {
          return NextResponse.json({ error: 'Invalid code' }, { status: 401 });
        }

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
        response.cookies.delete(OTP_COOKIE);
        return response;
      }

      // --- Path B: invite code flow (no OTP cookie) ---
      if (!email) {
        return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 401 });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await client.fetch(
        `*[_type == "portalUser" && lower(email) == $email && isActive == true && dataRoomAccess == true][0]{
          _id, inviteCode, inviteCodeExpiry
        }`,
        { email: normalizedEmail }
      );

      if (!user?.inviteCode || !user?.inviteCodeExpiry) {
        return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 401 });
      }

      if (new Date(user.inviteCodeExpiry) < new Date()) {
        return NextResponse.json({ error: 'Invite code has expired. Please contact your fund manager.' }, { status: 401 });
      }

      const a = Buffer.from(code.trim().padEnd(32));
      const b = Buffer.from(user.inviteCode.padEnd(32));
      if (!crypto.timingSafeEqual(a, b) || code.trim() !== user.inviteCode) {
        return NextResponse.json({ error: 'Invalid code' }, { status: 401 });
      }

      // Clear the invite code — one-time use only
      const writeClient = createClient({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
        apiVersion: '2024-01-01',
        useCdn: false,
        token: process.env.SANITY_WRITE_TOKEN,
      });
      await writeClient.patch(user._id).unset(['inviteCode', 'inviteCodeExpiry']).commit();

      const sessionTimestamp = Date.now().toString();
      const sessionValue = signSession(normalizedEmail, sessionTimestamp);
      const response = NextResponse.json({ success: true });
      response.cookies.set(COOKIE_NAME, sessionValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
      });
      return response;
    }

    if (action === 'sign-out') {
      const response = NextResponse.json({ success: true });
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Dataroom auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
