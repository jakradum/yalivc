import { NextResponse } from 'next/server';
import { keepAlive } from '@/lib/supabase/twin';
import { notifyFailure, runBackup } from '@/lib/backup/run';
import { keepAliveAndBackup } from '@/lib/backup/keepalive';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Supabase keep-alive + GitHub backup. A free Supabase project pauses after 7
// days without activity. Called twice a week by two cron-job.org jobs at odd
// times, with its own secret (SUPABASE_SYNC_SECRET, not the shared CRON_SECRET).
// After the ping, backs up the LP data to the private GitHub repo
// (src/lib/backup/run.js, target 'github') when GITHUB_BACKUP_TOKEN is set;
// files not copied within the time box are copied by the next run.
// The copy from Sanity (syncTwin) is OFF since 9 Nov 2026: Sanity is legacy
// until 3 Dec and edits are made in Supabase directly, so a sync would
// overwrite them. Run scripts/sync-sanity-to-supabase.mjs by hand if needed.
export async function GET(request) {
  const secret = process.env.SUPABASE_SYNC_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  try {
    const { status, body } = await keepAliveAndBackup({ keepAlive, runBackup, notifyFailure });
    return NextResponse.json(body, { status });
  } catch (err) {
    console.error('[supabase-sync]', err);
    return NextResponse.json({ ok: false, error: 'Keep-alive failed; see logs.' }, { status: 500 });
  }
}
