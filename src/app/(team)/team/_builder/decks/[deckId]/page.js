import { notFound } from 'next/navigation';
import { requireDeckUser } from '@/decks/auth';
import { loadDeckData } from '@/decks/data/loadDeckData';
import { DECK_IDS } from '@/decks/core/constants';
import { PreviewShell } from '@/decks/canvas/PreviewShell';
import { DeckRenderer } from '@/decks/core/DeckRenderer';
import { resolveDeckSlides } from '@/decks/builder/resolve';

export const metadata = { robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

// Served at team.yali.vc/builder/decks/<deckId>/ behind the Yali Microsoft
// sign-in (the proxy checks the session; requireDeckUser() checks again).
export default async function DeckPreviewPage({ params, searchParams }) {
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
    <PreviewShell deckId={deckId} dataSource={dataSource}>
      <DeckRenderer deckId={deckId} data={data} slides={slides} />
    </PreviewShell>
  );
}
