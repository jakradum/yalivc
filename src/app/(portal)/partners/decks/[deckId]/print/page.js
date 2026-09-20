import { notFound } from 'next/navigation';
import { requireDeckUser } from '@/decks/auth';
import { loadDeckData } from '@/decks/data/loadDeckData';
import { DECK_IDS } from '@/decks/core/constants';
import { PrintShell } from '@/decks/canvas/PrintShell';
import { DeckRenderer } from '@/decks/core/DeckRenderer';

export const metadata = { robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

// What Puppeteer visits (export/pdf.js), carrying the requesting user's
// portal session — so this is guarded exactly like the preview page.
// No Puppeteer import is reachable from this file or anything it imports.
export default async function DeckPrintPage({ params, searchParams }) {
  await requireDeckUser();
  const { deckId } = await params;
  const sp = await searchParams;
  if (!DECK_IDS.includes(deckId)) notFound();

  const dataSource = sp?.data === 'sanity' ? 'sanity' : 'fixture';
  const data = await loadDeckData(deckId, { dataSource });

  return (
    <PrintShell>
      <DeckRenderer deckId={deckId} data={data} />
    </PrintShell>
  );
}
