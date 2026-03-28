import { NextResponse } from 'next/server';

const PORTAL_COOKIE_NAME = 'portal-session';
const DATAROOM_COOKIE_NAME = 'dataroom-session';
const AUTH_SECRET = process.env.PORTAL_AUTH_SECRET;

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

async function verifyHMAC(cookieValue, maxSessionAge = THIRTY_DAYS_MS) {
  if (!AUTH_SECRET || !cookieValue) return false;

  const parts = cookieValue.split(':');
  if (parts.length !== 3) return false;

  const [email, timestamp, signature] = parts;
  const data = `${email}:${timestamp}`;

  // Validate session age against the provided max
  const sessionAge = Date.now() - parseInt(timestamp, 10);
  if (isNaN(sessionAge) || sessionAge > maxSessionAge || sessionAge < 0) {
    return false;
  }

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

    // Use constant-time comparison to prevent timing attacks
    return timingSafeEqual(expectedSig, signature);
  } catch {
    return false;
  }
}

export default async function middleware(request) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // Redirect www to non-www for SEO canonicalization
  if (hostname.startsWith('www.')) {
    const newUrl = new URL(request.url);
    newUrl.host = hostname.replace('www.', '');
    return NextResponse.redirect(newUrl, 301);
  }

  // Skip middleware for static files, API routes, and console
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/console') ||
    url.pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // Allow direct access to /partners in local development
  const isLocalDev = hostname.includes('localhost') || hostname.includes('127.0.0.1');

  // ── Partners subdomain ────────────────────────────────────────────────────
  const isPartnersSubdomain =
    hostname.startsWith('partners.') ||
    hostname.startsWith('partners-'); // Vercel preview domains

  if (isPartnersSubdomain) {
    // Strip /partners prefix from URLs if present (redirect to clean URL)
    if (url.pathname.startsWith('/partners')) {
      const cleanPath = url.pathname.replace(/^\/partners/, '') || '/';
      url.pathname = cleanPath;
      return NextResponse.redirect(url);
    }

    // Sign-in page is public
    const isSignInPage = url.pathname === '/sign-in' || url.pathname.startsWith('/sign-in');

    // Redirect sign-up to sign-in
    if (url.pathname === '/sign-up' || url.pathname.startsWith('/sign-up')) {
      const signInUrl = new URL('/sign-in', request.url);
      return NextResponse.redirect(signInUrl);
    }

    // Protect all routes except sign-in (30-day session)
    if (!isSignInPage) {
      const sessionCookie = request.cookies.get(PORTAL_COOKIE_NAME)?.value;
      const isValid = sessionCookie ? await verifyHMAC(sessionCookie, THIRTY_DAYS_MS) : false;

      if (!isValid) {
        const signInUrl = new URL('/sign-in', request.url);
        return NextResponse.redirect(signInUrl);
      }
    }

    // Rewrite clean URLs to /partners routes internally
    const rewritePath = `/partners${url.pathname === '/' ? '' : url.pathname}`;
    url.pathname = rewritePath;

    const response = NextResponse.rewrite(url);
    response.headers.set('x-pathname', rewritePath);
    return response;
  }

  // For main site, block access to /partners routes (but allow in local dev)
  if (url.pathname.startsWith('/partners') && !isLocalDev) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Protect /partners routes in local dev
  if (url.pathname.startsWith('/partners') && isLocalDev) {
    const isSignInPage = url.pathname.startsWith('/partners/sign-in');

    if (!isSignInPage) {
      const sessionCookie = request.cookies.get(PORTAL_COOKIE_NAME)?.value;
      const isValid = sessionCookie ? await verifyHMAC(sessionCookie, THIRTY_DAYS_MS) : false;

      if (!isValid) {
        const signInUrl = new URL('/partners/sign-in', request.url);
        return NextResponse.redirect(signInUrl);
      }
    }
  }

  // ── Dataroom subdomain ─────────────────────────────────────────────────────
  const isDataroomSubdomain =
    hostname.startsWith('dataroom.') ||
    hostname.startsWith('dataroom-'); // Vercel preview domains

  if (isDataroomSubdomain) {
    // Strip /dataroom prefix from URLs if present (redirect to clean URL)
    if (url.pathname.startsWith('/dataroom')) {
      const cleanPath = url.pathname.replace(/^\/dataroom/, '') || '/';
      url.pathname = cleanPath;
      return NextResponse.redirect(url);
    }

    // Sign-in page is public
    const isSignInPage = url.pathname === '/sign-in' || url.pathname.startsWith('/sign-in');

    // Redirect sign-up to sign-in
    if (url.pathname === '/sign-up' || url.pathname.startsWith('/sign-up')) {
      const signInUrl = new URL('/sign-in', request.url);
      return NextResponse.redirect(signInUrl);
    }

    // Protect all routes except sign-in (6-month session)
    if (!isSignInPage) {
      const sessionCookie = request.cookies.get(DATAROOM_COOKIE_NAME)?.value;
      const isValid = sessionCookie ? await verifyHMAC(sessionCookie, SIX_MONTHS_MS) : false;

      if (!isValid) {
        const signInUrl = new URL('/sign-in', request.url);
        return NextResponse.redirect(signInUrl);
      }
    }

    // Rewrite clean URLs to /dataroom routes internally
    const rewritePath = `/dataroom${url.pathname === '/' ? '' : url.pathname}`;
    url.pathname = rewritePath;

    const response = NextResponse.rewrite(url);
    response.headers.set('x-pathname', rewritePath);
    return response;
  }

  // For main site, block access to /dataroom routes (but allow in local dev)
  if (url.pathname.startsWith('/dataroom') && !isLocalDev) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Protect /dataroom routes in local dev
  if (url.pathname.startsWith('/dataroom') && isLocalDev) {
    const isSignInPage = url.pathname.startsWith('/dataroom/sign-in');

    if (!isSignInPage) {
      const sessionCookie = request.cookies.get(DATAROOM_COOKIE_NAME)?.value;
      const isValid = sessionCookie ? await verifyHMAC(sessionCookie, SIX_MONTHS_MS) : false;

      if (!isValid) {
        const signInUrl = new URL('/dataroom/sign-in', request.url);
        return NextResponse.redirect(signInUrl);
      }
    }
  }

  // Block individual company and category pages on production (only allow on staging/dev)
  const isProduction = hostname.includes('yali.vc') && !hostname.includes('staging') && !isLocalDev;
  const isCompanyOrCategoryPage =
    url.pathname.match(/^\/investments\/[^\/]+$/) &&
    url.pathname !== '/investments';

  if (isCompanyOrCategoryPage && isProduction) {
    url.pathname = '/investments';
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.set('x-pathname', url.pathname);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|console).*)',
  ],
};
