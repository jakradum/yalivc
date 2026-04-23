// GET /api/generate-pdf/[slug]
// Used on the partners subdomain (middleware skips /api paths; no rewrite needed)
import { handlePdfGet } from '@/lib/pdfRequestHandler';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request, { params }) {
  const { slug } = await params;
  if (slug === 'ping') {
    return NextResponse.json({ ok: true, ts: Date.now() });
  }
  return handlePdfGet(slug);
}
