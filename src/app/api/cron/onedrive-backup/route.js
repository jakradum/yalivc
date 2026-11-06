import { NextResponse } from 'next/server';
import { notifyFailure, runBackup } from '@/lib/backup/run';
import { NotConfiguredError, NotConnectedError } from '@/lib/backup/graph';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Backs up the Supabase LP database to Pranav's OneDrive (src/lib/backup/run.js).
// Same secret as the twin sync (SUPABASE_SYNC_SECRET), but independent of it.
// 200 = complete; 202 = tables done but some new PDFs left for the next run;
// 503 = not connected / not configured (no email); 500 = failed (Pranav is emailed).
export async function GET(request) {
  const secret = process.env.SUPABASE_SYNC_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  try {
    const result = await runBackup();
    return NextResponse.json(result, { status: result.complete ? 200 : 202 });
  } catch (err) {
    if (err instanceof NotConnectedError || err instanceof NotConfiguredError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 503 });
    }
    console.error('[onedrive-backup]', err.message);
    const emailed = await notifyFailure(err.message).catch(() => false);
    return NextResponse.json({ ok: false, error: 'Backup failed; see logs.', emailed }, { status: 500 });
  }
}
