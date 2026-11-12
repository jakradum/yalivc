import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isBuilderHost } from '@/decks/auth';
import { TEAM_COOKIE, verifyTeamSession } from '@/lib/teamSession';
import { APPROVER, LOGS_FOR_OTHERS } from '@/lib/leaveEmail/directory';
import { decideLeave, isRequestId } from '@/lib/leaveEmail/upcoming';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Called by the leave dashboard (src/app/(team)/team/_apps/dashboard.html) right after
// a pending request is approved or rejected in Firebase, so the Monday digest's copy
// in Supabase follows: approved -> marked approved, rejected -> removed. Only the
// approver and the people who manage leave for others may call it.
export async function POST(request) {
  const host = request.headers.get('host') || '';
  if (!isBuilderHost(host)) return new NextResponse('Not found', { status: 404 });
  const email = verifyTeamSession((await cookies()).get(TEAM_COOKIE)?.value);
  if (!email) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
  if (email !== APPROVER.email && !LOGS_FOR_OTHERS.includes(email)) {
    return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!isRequestId(body?.requestId) || !['approved', 'rejected'].includes(body?.decision)) {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }
  try {
    await decideLeave(body.requestId, body.decision);
  } catch (err) {
    console.error('[leave-status] Supabase update failed:', err?.status || err?.message);
    return NextResponse.json({ error: 'Could not update.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
