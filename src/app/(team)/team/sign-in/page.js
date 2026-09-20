import { cookies } from 'next/headers';
import { TEAM_COOKIE, verifyTeamSession } from '@/lib/teamSession';
import { SignInClient } from './SignInClient';

export const metadata = { title: 'Sign In — Yali Team', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const AREAS = { assets: 'the asset builder', builder: 'the asset builder', letters: 'Letters' };

export default async function TeamSignInPage({ searchParams }) {
  const sp = await searchParams;
  const denied = AREAS[sp?.denied] ? sp.denied : null;
  // Only meaningful when there IS a valid session but it isn't allowed in.
  const email = denied ? verifyTeamSession((await cookies()).get(TEAM_COOKIE)?.value) : null;
  return <SignInClient deniedArea={email ? AREAS[denied] : null} deniedEmail={email} />;
}
