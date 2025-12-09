import { NextResponse } from 'next/server';

export function middleware(request) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

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

  // Check if request is coming from partners subdomain
  const isPartnersSubdomain =
    hostname.startsWith('partners.') ||
    hostname.startsWith('partners-'); // Vercel preview domains

  if (isPartnersSubdomain) {
    // If already on /partners path, continue
    if (url.pathname.startsWith('/partners')) {
      return NextResponse.next();
    }

    // Rewrite to /partners routes
    url.pathname = `/partners${url.pathname === '/' ? '' : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // For main site, block access to /partners routes (but allow in local dev)
  if (url.pathname.startsWith('/partners') && !isLocalDev) {
    // Redirect to home if trying to access partners on main domain
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
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
