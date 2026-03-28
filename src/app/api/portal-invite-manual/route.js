import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';

const AUTH_SECRET = process.env.PORTAL_AUTH_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const INVITE_EXPIRY_HOURS = 72; // 3 days for manually-sent invites
const COOKIE_NAME = 'portal-session';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

function buildInviteToken(email, expiry) {
  const payload = Buffer.from(JSON.stringify({ email, expiry })).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyInviteToken(token) {
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  try {
    const { email, expiry } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (Date.now() > expiry) return null;
    return email;
  } catch {
    return null;
  }
}

function signSession(email, timestamp) {
  const data = `${email}:${timestamp}`;
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('hex');
  return `${data}:${signature}`;
}

// POST — called from Sanity Studio action to send a manual portal invite
export async function POST(request) {
  if (!AUTH_SECRET) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { email, name } = body ?? {};
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const expiry = Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000;
  const token = buildInviteToken(normalizedEmail, expiry);
  const magicLink = `https://partners.yali.vc/api/portal-invite-manual/?verify=${token}`;

  const resend = new Resend(RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: 'Yali Partners <noreply@yali.vc>',
      to: normalizedEmail,
      subject: "You've been invited to view the Yali Limited Partners' Report",
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff;">
          <div style="border-bottom: 1px solid #e0e0e0; padding: 24px 0; margin-bottom: 24px;">
            <img src="https://yali.vc/yali-logo.png" alt="Yali Partners" style="height: 36px; width: auto;" />
          </div>

          <p style="color: #363636; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">Hi${name ? ` ${name}` : ''},</p>
          <p style="color: #363636; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">You've been invited to view the Yali Limited Partners' Report.</p>
          <p style="color: #363636; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
            Use the button below to access the portal. This link is valid for ${INVITE_EXPIRY_HOURS} hours.
          </p>

          <div style="text-align: center; margin: 0 0 32px 0;">
            <a href="${magicLink}" style="display: inline-block; background: #830D35; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 14px; font-weight: 600; letter-spacing: 0.04em;">Access Partners Portal</a>
          </div>

          <p style="color: #666; font-size: 13px; line-height: 1.5; margin: 0 0 8px 0;">Or copy this link into your browser:</p>
          <p style="color: #830D35; font-size: 12px; line-height: 1.5; margin: 0 0 32px 0; word-break: break-all;">${magicLink}</p>

          <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 0 0 32px 0;">
            If you were not expecting this invitation, you can safely ignore this email.
          </p>

          <div style="border-top: 1px solid #e0e0e0; padding-top: 16px;">
            <p style="color: #999; font-size: 11px; line-height: 1.4; margin: 0; text-align: center;">This is a system-generated email. Please do not reply.</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send portal invite email:', err);
    return NextResponse.json({ error: 'Failed to send invite email' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// GET — magic link click: validate token, set session cookie, redirect to portal
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('verify');

  if (!AUTH_SECRET || !token) {
    return NextResponse.redirect('https://partners.yali.vc/sign-in');
  }

  const email = verifyInviteToken(token);
  if (!email) {
    return NextResponse.redirect('https://partners.yali.vc/sign-in?expired=1');
  }

  const sessionTimestamp = Date.now().toString();
  const sessionValue = signSession(email, sessionTimestamp);

  const response = NextResponse.redirect('https://partners.yali.vc/');
  response.cookies.set(COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
  return response;
}
