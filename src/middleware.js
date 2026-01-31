import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define which routes require authentication
const isProtectedRoute = createRouteMatcher([
  '/partners(.*)',
]);

// Define public routes that don't need auth (sign-in page)
const isPublicRoute = createRouteMatcher([
  '/partners/sign-in(.*)',
  '/sign-in(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
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
    // If URL has /partners prefix, redirect to clean URL (strip /partners)
    // This prevents partners.yali.vc/partners/... URLs
    if (url.pathname.startsWith('/partners')) {
      const cleanPath = url.pathname.replace(/^\/partners/, '') || '/';
      url.pathname = cleanPath;
      return NextResponse.redirect(url);
    }

    // Rewrite clean URLs to /partners routes internally
    const rewritePath = `/partners${url.pathname === '/' ? '' : url.pathname}`;
    url.pathname = rewritePath;

    // Check if this is a protected route and user is not signed in
    if (isProtectedRoute(request) && !isPublicRoute(request)) {
      const { userId } = await auth();
      if (!userId) {
        // Redirect to sign-in page on the subdomain
        const signInUrl = new URL('/sign-in', request.url);
        return NextResponse.redirect(signInUrl);
      }
    }

    const response = NextResponse.rewrite(url);
    response.headers.set('x-pathname', rewritePath);
    return response;
  }

  // For main site, block access to /partners routes (but allow in local dev)
  if (url.pathname.startsWith('/partners') && !isLocalDev) {
    // Redirect to home if trying to access partners on main domain
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Protect partner routes in local dev too
  if (url.pathname.startsWith('/partners') && isLocalDev) {
    if (isProtectedRoute(request) && !isPublicRoute(request)) {
      const { userId } = await auth();
      if (!userId) {
        const signInUrl = new URL('/partners/sign-in', request.url);
        return NextResponse.redirect(signInUrl);
      }
    }
  }

  // Block individual company and category pages on production (only allow on staging/dev)
  const isProduction = hostname.includes('yali.vc') && !hostname.includes('staging') && !isLocalDev;
  const isCompanyOrCategoryPage =
    url.pathname.match(/^\/investments\/[^\/]+$/) && // Matches /investments/something but not /investments
    url.pathname !== '/investments';

  if (isCompanyOrCategoryPage && isProduction) {
    // Redirect to investments page on production
    url.pathname = '/investments';
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.set('x-pathname', url.pathname);
  return response;
});

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
