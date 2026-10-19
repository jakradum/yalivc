import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import { getPlaceholderSlots } from '@/lib/graphCalendar';

// Hit on a schedule by cron-job.org (not Vercel Cron, to avoid touching
// vercel.json - see docs/pitch-scheduler-plan.md): hourly 8am-8pm IST, once
// overnight (8pm-8am), every day including weekends. Refreshes the shared
// slot cache that both invitation generation and founder-facing pages read
// from, instead of each hitting Graph directly - see
// pitchSchedulerSlotCache.js for why.

const PLACEHOLDER_TITLE_MATCHERS = ['pitch meeting placeholder', 'additional slots'];
const CACHE_DOC_ID = 'pitchSchedulerSlotCache';
const CRON_SECRET = process.env.PITCH_SCHEDULER_CRON_SECRET;

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

export async function GET(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || request.headers.get('x-cron-secret');
  if (!CRON_SECRET || token !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const windowStart = now.toISOString();
  const windowEnd = new Date(now.getTime() + 46 * 24 * 60 * 60 * 1000).toISOString();

  const events = await getPlaceholderSlots(windowStart, windowEnd, PLACEHOLDER_TITLE_MATCHERS);
  if (events === null) {
    return NextResponse.json({ error: 'Calendar not reachable - not connected, or Graph errored. Cache left unchanged.' }, { status: 502 });
  }

  const slots = events.map((e) => ({ startUTC: e.startUTC, endUTC: e.endUTC }));

  try {
    await writeClient.createOrReplace({
      _id: CACHE_DOC_ID,
      _type: 'pitchSchedulerSlotCache',
      slots,
      updatedAt: now.toISOString(),
    });
  } catch (err) {
    console.error('Failed to write slot cache:', err);
    return NextResponse.json({ error: 'Fetched slots but failed to save the cache' }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: slots.length, updatedAt: now.toISOString() });
}
