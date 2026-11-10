// POST handler behind /api/portal-auth and /api/dataroom-auth.
//
// Actions:
//   send-code    { email }        → { status: 'issued', resendsLeft } | { status: 'limit' | 'locked' | 'busy', until }
//   verify-code  { email, code }  → { success: true } and the session cookie
//                                  | { status: 'wrong' | 'dead' | 'expired' | 'locked', ... }
//   sign-out (data room only)
//
// Every reply is the same whether or not the email has access: addresses without
// access get a recorded "code" that never matches and no email, so nobody can use
// this page to find out who is an LP. Rules and limits: src/lib/sign-in/codes.js.
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { signSessionFor, SESSION_SCOPES } from '@/lib/session';
import { getDomainPrivilegeForSignIn, getBlockedPortalUser, getActiveUserForSignIn } from '@/lib/lp-data';
import { isYaliStaff } from '@/lib/internal-user';
import { issueCode, checkCode, newCode } from './codes.js';
import { codeEmail, lockoutEmail } from './emails.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const pause = () => new Promise((r) => setTimeout(r, 500 + Math.random() * 500));

// The caller's IP as Vercel reports it (x-real-ip), else the first x-forwarded-for hop.
const clientIp = (request) =>
  request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '';

// May this email sign in? Yali staff and open domains always may (unless blocked
// with noAccess); everyone else needs an active user record for this scope.
async function hasAccess(scope, email) {
  const domain = email.split('@')[1];
  const domainPriv = await getDomainPrivilegeForSignIn(scope, domain);
  if (isYaliStaff(email) || (domainPriv && !domainPriv.requireCode)) {
    return !(await getBlockedPortalUser(email));
  }
  return Boolean(await getActiveUserForSignIn(scope, email));
}

async function send(tag, to, { subject, html }) {
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: 'Yali Partners <noreply@yali.vc>', to, subject, html,
  });
  if (error) console.error(`[${tag}] Resend error:`, error.name || 'unknown');
}

export function signInHandler({ scope, place, cookieName, legacyOtpCookie, allowSignOut = false }) {
  const tag = `${scope}-auth`;
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_SCOPES[scope] / 1000,
    path: '/',
  };

  return async function POST(request) {
    if (!process.env.PORTAL_AUTH_SECRET) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    try {
      const { action, email: rawEmail, code: rawCode } = await request.json();

      if (allowSignOut && action === 'sign-out') {
        const response = NextResponse.json({ success: true });
        response.cookies.delete(cookieName);
        return response;
      }

      const email = typeof rawEmail === 'string' ? rawEmail.toLowerCase().trim() : '';
      if (!EMAIL_RE.test(email) || email.length > 254) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
      }

      if (action === 'send-code') {
        const allowed = await hasAccess(scope, email);
        const code = allowed ? newCode() : null;
        const result = await issueCode(scope, email, code, clientIp(request));
        if (result.status !== 'issued') {
          return NextResponse.json({ status: result.status, until: result.until }, { status: 429 });
        }
        if (allowed) await send(tag, email, codeEmail(place, code));
        else await pause();
        return NextResponse.json({ success: true, status: 'issued', resendsLeft: result.resends_left });
      }

      if (action === 'verify-code') {
        const code = typeof rawCode === 'string' ? rawCode.trim() : '';
        if (!/^\d{6}$/.test(code)) {
          return NextResponse.json({ error: 'Please enter the 6-digit code.' }, { status: 400 });
        }
        const result = await checkCode(scope, email, code);
        if (result.status === 'ok') {
          const response = NextResponse.json({ success: true });
          response.cookies.set(cookieName, signSessionFor(scope, email), cookieOptions);
          response.cookies.delete(legacyOtpCookie);
          return response;
        }
        // The guess that locks the email: tell the owner, with the time of each wrong try.
        if (result.status === 'locked' && result.wrong_at && (await hasAccess(scope, email))) {
          await send(tag, email, lockoutEmail(place, result.wrong_at, result.until));
        }
        return NextResponse.json({
          status: result.status,
          until: result.until,
          triesLeft: result.tries_left,
          attemptsLeft: result.attempts_left,
        }, { status: result.status === 'locked' ? 429 : 401 });
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
      console.error(`[${tag}] error:`, error?.message || 'unknown');
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
  };
}

