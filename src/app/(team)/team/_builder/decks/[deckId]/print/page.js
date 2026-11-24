import { notFound } from 'next/navigation';
import { requireDeckUser } from '@/decks/auth';
import { loadDeckData } from '@/decks/data/loadDeckData';
import { DECK_IDS } from '@/decks/core/constants';
import { PrintShell } from '@/decks/canvas/PrintShell';
import { DeckRenderer } from '@/decks/core/DeckRenderer';
import { resolveDeckSlides } from '@/decks/builder/resolve';
import { deckVersion, deckDocTitle } from '@/decks/core/deckVersion';

export const dynamic = 'force-dynamic';

// The page title becomes the PDF's Title metadata; the deck-version meta tag
// is what export/pdf.js reads for the download filename.
export async function generateMetadata({ params, searchParams }) {
  const { deckId } = await params;
  if (!DECK_IDS.includes(deckId)) return { robots: 'noindex, nofollow' };
  const sp = await searchParams;
  const data = await loadDeckData(deckId, { dataSource: sp?.data === 'sanity' ? 'sanity' : 'fixture' });
  const version = deckVersion(data);
  return {
    robots: 'noindex, nofollow',
    title: { absolute: deckDocTitle(deckId, data) },
    ...(version ? { other: { 'deck-version': version } } : {}),
  };
}
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
  // ?manifest=draft shows the deck builder's unpublished edits.
  const manifest = sp?.manifest === 'draft' ? 'draft' : 'published';
  const slides = await resolveDeckSlides(deckId, data, manifest);

  return (
    <PrintShell>
      <DeckRenderer deckId={deckId} data={data} slides={slides} />
    </PrintShell>
  );
}
