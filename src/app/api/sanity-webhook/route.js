import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { syncTwin } from '@/lib/supabase/twin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Sanity GROQ webhook → incremental twin sync (src/lib/supabase/twin.js), so
// the Supabase twin follows Sanity within seconds instead of twice a week.
//
// Sanity signs each delivery with the webhook's secret (SANITY_WEBHOOK_SECRET):
//   sanity-webhook-signature: t=<unix ms>,v1=<base64url HMAC-SHA256 of "<t>.<raw body>">
// (same scheme as @sanity/webhook / next-sanity/webhook, modelled on Stripe's).
//
// Responses: 503 no secret configured, 401 bad or missing signature,
// 429 another sync holds the lock (Sanity retries 429 and 5xx), 500 sync failed,
// 200 with per-type counts otherwise. The payload itself is not used: the sync
// compares revisions across all twin types, so any change is picked up.
const SIGNATURE_RE = /^t=(\d+)[, ]+v1=([^, ]+)$/;

// A signed delivery older or newer than this is refused, so a captured
// request cannot be replayed later.
const MAX_SKEW_MS = 5 * 60 * 1000;

function validSignature(header, body, secret) {
  const m = (header || '').trim().match(SIGNATURE_RE);
  if (!m) return false;
  if (Math.abs(Date.now() - Number(m[1])) > MAX_SKEW_MS) return false;
  const expected = createHmac('sha256', secret).update(`${m[1]}.${body}`).digest('base64url');
  const a = Buffer.from(m[2]);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request) {
  const secret = process.env.SANITY_WEBHOOK_SECRET?.trim();
  if (!secret) return NextResponse.json({ ok: false, error: 'Webhook not configured.' }, { status: 503 });

  const body = await request.text();
  if (!validSignature(request.headers.get('sanity-webhook-signature'), body, secret)) {
    return NextResponse.json({ ok: false, error: 'Invalid signature.' }, { status: 401 });
  }

  // Give the Content Lake a moment so the query API sees the change (the
  // same 3 s wait next-sanity's parseBody uses).
  await new Promise((resolve) => setTimeout(resolve, 3000));
  try {
    const result = await syncTwin();
    if (result.skipped) return NextResponse.json({ ok: false, skipped: result.skipped }, { status: 429, headers: { 'Retry-After': '30' } });
    return NextResponse.json({ ok: true, docsUpserted: result.docsUpserted, docsDeleted: result.docsDeleted, filesUploaded: result.filesUploaded, counts: result.counts });
  } catch (err) {
    console.error('[sanity-webhook]', err);
    return NextResponse.json({ ok: false, error: 'Sync failed; see logs and the sync_runs table.' }, { status: 500 });
  }
}
