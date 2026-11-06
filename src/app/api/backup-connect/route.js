import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TEAM_COOKIE, verifyTeamSession } from '@/lib/teamSession';
import { BACKUP_OWNER } from '@/lib/backup/graph';
import { authorizeUrl, page } from '@/lib/backup/connect';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Starts the one-time Microsoft consent for the OneDrive backup (see
// src/lib/backup/connect.js). Open it on team.yali.vc, where the team-session
// cookie lives: https://team.yali.vc/api/backup-connect. Only the backup
// owner's team session is accepted; the callback also checks that the
// Microsoft account that consents is the same one.
export async function GET() {
  const email = verifyTeamSession((await cookies()).get(TEAM_COOKIE)?.value);
  if (!email) return page('Sign in first', 'Sign in at https://team.yali.vc/sign-in with your Yali Microsoft account, then open https://team.yali.vc/api/backup-connect again.', 401);
  if (email !== BACKUP_OWNER) return page('Not allowed', `Only ${BACKUP_OWNER} can connect the OneDrive backup.`, 403);
  try {
    return NextResponse.redirect(authorizeUrl(email));
  } catch (err) {
    return page('Not configured', err.message, 500);
  }
}
