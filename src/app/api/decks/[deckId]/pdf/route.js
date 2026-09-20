import { NextResponse } from 'next/server';
import { exportDeckPdf, ExportCheckError } from '@/decks/export/pdf';
import { DECK_IDS } from '@/decks/core/constants';
import { getDeckUser, isPartnersHost, DECK_SESSION_COOKIE } from '@/decks/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const notFound = () => new NextResponse('Not found', { status: 404 });

// Explicit-request-only, and only ever answers on the partners host for a
// signed-in INTERNAL user. /api/* bypasses the proxy, so nothing else
// protects this route — every denial (wrong host, no session, LP session,
// unknown deck) is the same bare 404, so it doesn't reveal it exists.
export async function POST(request, { params }) {
  const host = request.headers.get('host') || '';
  const sessionCookie = request.cookies.get(DECK_SESSION_COOKIE)?.value;
  if (!isPartnersHost(host) || !getDeckUser(sessionCookie)) return notFound();

  const { deckId } = await params;
  if (!DECK_IDS.includes(deckId)) return notFound();

  const body = await request.json().catch(() => ({}));
  const dataSource = body?.dataSource === 'sanity' ? 'sanity' : 'fixture';
  const allowOverflow = body?.allowOverflow === true;

  // Always the validated request host — never an env override — because
  // the exporter forwards the session cookie to whatever host it visits.
  const baseUrl = `${request.nextUrl.protocol}//${host}`;

  try {
    const { pdfBuffer, manifest } = await exportDeckPdf({ deckId, baseUrl, dataSource, allowOverflow, sessionCookie });
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
