// Heartbeat from src/app/(portal)/ActivityTracker.js: { seconds } of activity since the
// last beat. The email comes from the session cookie, never from the request body.
import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { pingVisit } from '@/lib/visits';

export async function POST(request) {
  const email = verifySession(request.cookies.get('portal-session')?.value, 'portal');
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let seconds = 0;
  try {
    ({ seconds = 0 } = await request.json());
  } catch {
    // an empty or unreadable body is just a "still here"
  }
  await pingVisit(email, Number.isFinite(Number(seconds)) ? Math.round(Number(seconds)) : 0);
  return new NextResponse(null, { status: 204 });
}
