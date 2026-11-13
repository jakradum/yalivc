import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TEAM_COOKIE } from '@/lib/teamSession';
import { getTeamUser } from '@/decks/auth';
import { signTeamDeck } from '@/lib/teamDecks';

export const dynamic = 'force-dynamic';

// /assets/open/<folder>/<file>.pdf → a one-minute signed Supabase URL, for any
// signed-in Yali account. The proxy gates the team site too; this re-checks.
export async function GET(request, { params }) {
  const email = getTeamUser((await cookies()).get(TEAM_COOKIE)?.value, 'assets');
  if (!email) return new NextResponse('Sign in with your Yali account to open Yali Assets.', { status: 401 });
  const { path } = await params;
  const signed = await signTeamDeck(path.map(decodeURIComponent).join('/'));
  if (!signed) return new NextResponse('Not found', { status: 404 });
  return NextResponse.redirect(signed, { headers: { 'Cache-Control': 'no-store' } });
}
