// Heartbeat from src/app/(portal)/ActivityTracker.js: { seconds } of activity since the
// last beat, or { company } when a company page opens. The email comes from the session
// cookie, never from the request body.
import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { pingVisit, viewVisit } from '@/lib/visits';

const SLUG = /^[a-z0-9-]{1,80}$/;

export async function POST(request) {
  const email = verifySession(request.cookies.get('portal-session')?.value, 'portal');
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let seconds = 0;
  let company;
  try {
    ({ seconds = 0, company } = await request.json());
  } catch {
    // an empty or unreadable body is just a "still here"
  }
  if (typeof company === 'string' && SLUG.test(company)) {
    await viewVisit(email, company);
    return new NextResponse(null, { status: 204 });
  }
  await pingVisit(email, Number.isFinite(Number(seconds)) ? Math.round(Number(seconds)) : 0);
  return new NextResponse(null, { status: 204 });
}
