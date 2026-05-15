/**
 * snapshotRequestHandler.js
 * POST handler for /api/snapshot-report/[slug].
 * Computes a data snapshot of the current portal view for a given quarterly report
 * and writes it back to the Sanity document.
 * Internal access only (@yali.vc / @florintree.com).
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getLPFundSettings,
  getLPQuarterlyReportBySlugAdmin,
  getLPInvestmentsForPdf,
  updateLPReportSnapshot,
} from '@/lib/sanity-queries';
import { buildReportData } from '@/lib/quarterly-utils';

const AUTH_SECRET = process.env.PORTAL_AUTH_SECRET;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

async function verifyPortalSession(cookieValue) {
  if (!AUTH_SECRET || !cookieValue) return null;
  const parts = cookieValue.split(':');
  if (parts.length !== 3) return null;
  const [email, timestamp, signature] = parts;
  const sessionAge = Date.now() - parseInt(timestamp, 10);
  if (isNaN(sessionAge) || sessionAge > THIRTY_DAYS_MS || sessionAge < 0) return null;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(AUTH_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`${email}:${timestamp}`));
    const expectedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (expectedSig.length !== signature.length) return null;
    let diff = 0;
    for (let i = 0; i < expectedSig.length; i++) diff |= expectedSig.charCodeAt(i) ^ signature.charCodeAt(i);
    return diff === 0 ? email : null;
  } catch { return null; }
}

export async function handleSnapshotPost(slug) {
  // ── Auth ────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('portal-session')?.value;
  const email = await verifyPortalSession(sessionCookie);

  if (!email) return new NextResponse('Unauthorized', { status: 401 });

  const isInternal = email.endsWith('@yali.vc') || email.endsWith('@florintree.com') || email === 'pranavkarnad@gmail.com';
  if (!isInternal) return new NextResponse('Forbidden — internal access only', { status: 403 });

  if (!slug || typeof slug !== 'string') return new NextResponse('Missing slug', { status: 400 });

  // ── Fetch data ───────────────────────────────────────────────
  const [fundSettings, report, investments] = await Promise.all([
    getLPFundSettings(),
    getLPQuarterlyReportBySlugAdmin(slug),
    getLPInvestmentsForPdf(),
  ]);

  if (!report) return new NextResponse('Report not found', { status: 404 });

  const { _id, quarter, fiscalYear } = report;

  // ── Compute snapshot ─────────────────────────────────────────
  // buildReportData applies quarter-scoping, round filtering, and FMV fallback —
  // producing exactly what the portal renders for this quarter.
  const { portfolioCompanies, fundMetrics } = buildReportData({
    quarter,
    fiscalYear,
    fundSettings,
    investments,
    news: [],
    socialUpdates: [],
  });

  const snapshotTimestamp = new Date().toISOString();
  const snapshot = {
    snapshotTimestamp,
    quarter,
    fiscalYear,
    fundMetrics,
    portfolioCompanies,
  };

  // ── Write to Sanity ──────────────────────────────────────────
  await updateLPReportSnapshot(_id, JSON.stringify(snapshot), snapshotTimestamp);

  return NextResponse.json({
    ok: true,
    slug,
    quarter,
    fiscalYear,
    snapshotTimestamp,
    companiesCount: portfolioCompanies.length,
  });
}
