import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.redirect(new URL('/partners/sign-in', process.env.NEXT_PUBLIC_SITE_URL || 'https://yali.vc'));
  response.cookies.set('portal-session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  return response;
}
