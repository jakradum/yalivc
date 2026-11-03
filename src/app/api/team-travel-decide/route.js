import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isBuilderHost } from '@/decks/auth';
import { TEAM_COOKIE, verifyTeamSession } from '@/lib/teamSession';
import { TRAVEL_APPROVER } from '@/lib/travel/profiles';
import { decideTravelRequest } from '@/lib/travel/store';
import { bookingEmail, rejectedEmail } from '@/lib/travel/emails';
import { sendAll } from '@/lib/travel/send';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Approve or reject a travel request. Only the travel approver's verified Yali
// Microsoft session may decide; /api/* skips the proxy, so the check is here.
// On approval Karthik Sunder is emailed the full booking details (cc requester).
export async function POST(request) {
  if (!isBuilderHost(request.headers.get('host') || '')) return new NextResponse('Not found', { status: 404 });
  const email = verifyTeamSession((await cookies()).get(TEAM_COOKIE)?.value);
  if (!email) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
  if (email !== TRAVEL_APPROVER.email) return NextResponse.json({ error: 'Only Gani can approve travel.' }, { status: 403 });

  const b = await request.json().catch(() => ({}));
  const status = b.action === 'approve' ? 'approved' : b.action === 'reject' ? 'rejected' : null;
  if (!status || typeof b.id !== 'string' || !b.id.startsWith('travel.')) {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }

  let result;
  try { result = await decideTravelRequest(b.id, status, email); } catch (e) {
    console.error('[travel] decide failed:', e.message);
    return NextResponse.json({ error: "Couldn't save. Refresh and try again." }, { status: 409 });
  }
  if (result.error) return NextResponse.json({ error: result.error }, { status: 409 });

  await sendAll([status === 'approved' ? bookingEmail(result.request) : rejectedEmail(result.request)]);
  return NextResponse.json({ ok: true, status });
}
