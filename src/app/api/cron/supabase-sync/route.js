import { NextResponse } from 'next/server';
import { syncTwin } from '@/lib/supabase/twin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Keeps the Supabase twin in step with Sanity (see src/lib/supabase/twin.js),
// and doubles as its keep-alive: a free Supabase project pauses after 7 days
// without activity. Called twice a week by two cron-job.org jobs at odd times,
// with its own secret (SUPABASE_SYNC_SECRET, not the shared CRON_SECRET). Only
// changed documents and not-yet-copied PDFs are written, so a run is seconds.
export async function GET(request) {
  const secret = process.env.SUPABASE_SYNC_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  try {
    const result = await syncTwin();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[supabase-sync]', err);
    return NextResponse.json({ ok: false, error: 'Sync failed; see logs and the sync_runs table.' }, { status: 500 });
  }
}
