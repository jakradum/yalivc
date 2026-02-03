import { NextResponse } from 'next/server';

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

  // Check if request is coming from partners subdomain
  const isPartnersSubdomain =
    hostname.startsWith('partners.') ||
    hostname.startsWith('partners-'); // Vercel preview domains

  if (isPartnersSubdomain) {
    // If URL has /partners prefix, redirect to clean URL (strip /partners)
    if (url.pathname.startsWith('/partners')) {
      const cleanPath = url.pathname.replace(/^\/partners/, '') || '/';
      url.pathname = cleanPath;
      return NextResponse.redirect(url);
    }

    // Skip sign-in/sign-up pages (no longer needed but keep routing clean)
    if (url.pathname === '/sign-in' || url.pathname.startsWith('/sign-in') ||
        url.pathname === '/sign-up' || url.pathname.startsWith('/sign-up')) {
      // Redirect to portal home since auth is disabled
      const homeUrl = new URL('/', request.url);
      return NextResponse.redirect(homeUrl);
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
