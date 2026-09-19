import { NextResponse } from 'next/server';
import { exportDeckPdf, ExportCheckError } from '@/decks/export/pdf';
import { DECK_IDS } from '@/decks/core/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Explicit-request-only. Nothing else in this codebase calls this route —
// no webhook, no build step, no page-load side effect. Verified by grep
// during Phase 1 acceptance check.
export async function POST(request, { params }) {
  const { deckId } = await params;
  if (!DECK_IDS.includes(deckId)) {
    return new NextResponse('Unknown deck', { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const dataSource = body?.dataSource === 'sanity' ? 'sanity' : 'fixture';
  const allowOverflow = body?.allowOverflow === true;

  const baseUrl = process.env.DECK_PDF_BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  try {
    const { pdfBuffer, manifest } = await exportDeckPdf({ deckId, baseUrl, dataSource, allowOverflow });
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${deckId}.pdf"`,
        'Cache-Control': 'no-store',
        'X-Deck-Manifest': encodeURIComponent(JSON.stringify(manifest)),
      },
    });
  } catch (err) {
    if (err instanceof ExportCheckError) {
      return NextResponse.json({ error: err.message, problems: err.problems }, { status: 422 });
    }
    console.error('[deck-pdf] export failed:', err);
    return new NextResponse('PDF generation failed', { status: 500 });
  }
}
