// POST handler behind /api/portal-auth and /api/dataroom-auth.
//
// Actions:
//   send-code    { email }        → { status: 'issued', resendsLeft }
//                                  | { status: 'limit' | 'locked' | 'busy', until } | { status: 'send_failed' }
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
import { issueCode, checkCode, voidCode, newCode } from './codes.js';
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

// Returns whether Resend accepted the email.
async function send(tag, to, { subject, html }) {
  try {
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: 'Yali Partners <noreply@yali.vc>', to, subject, html,
    });
    if (!error) return true;
    console.error(`[${tag}] Resend error:`, error.name || 'unknown');
  } catch (err) {
    console.error(`[${tag}] Resend error:`, err?.name || 'unknown');
  }
  return false;
}

export function signInHandler({ scope, place, cookieName, legacyOtpCookie, allowSignOut = false }) {
  const tag = `${scope}-auth`;
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // lax, not strict: a link to the portal clicked in an email must arrive signed in.
    // Every sign-in action is a POST, which lax never sends cross-site.
    sameSite: 'lax',
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
        if (allowed) {
          if (!(await send(tag, email, codeEmail(place, code)))) {
            await voidCode(scope, email, code);
            return NextResponse.json({ status: 'send_failed' }, { status: 503 });
          }
        } else {
          await pause();
        }
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
          lockLeft: result.lock_left,
          resend: result.resend,
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

