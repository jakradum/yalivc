import { notFound } from 'next/navigation';
import { loadDeckData } from '@/decks/data/loadDeckData';
import { DECK_IDS } from '@/decks/core/constants';
import { PrintShell } from '@/decks/canvas/PrintShell';
import { DeckRenderer } from '@/decks/core/DeckRenderer';

export const metadata = { robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

// This is what Puppeteer visits (export/pdf.js). No Puppeteer import
// reachable from this file or anything it imports — verified by grep in
// the Phase 1 acceptance check, see DECK_MIGRATION_PLAN.md.
export default async function DeckPrintPage({ params, searchParams }) {
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
