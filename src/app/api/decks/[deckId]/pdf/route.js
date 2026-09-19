import { NextResponse } from 'next/server';
import { exportDeckPdf } from '@/decks/export/pdf';
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

  const baseUrl = process.env.DECK_PDF_BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  try {
    const pdfBuffer = await exportDeckPdf({ deckId, baseUrl, dataSource });
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${deckId}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[deck-pdf] export failed:', err);
    return new NextResponse('PDF generation failed', { status: 500 });
  }
}
