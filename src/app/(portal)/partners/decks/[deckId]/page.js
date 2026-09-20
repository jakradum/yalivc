import { notFound } from 'next/navigation';
import { requireDeckUser } from '@/decks/auth';
import { loadDeckData } from '@/decks/data/loadDeckData';
import { DECK_IDS } from '@/decks/core/constants';
import { PreviewShell } from '@/decks/canvas/PreviewShell';
import { DeckRenderer } from '@/decks/core/DeckRenderer';

export const metadata = { robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

// Served at partners.yali.vc/decks/<deckId>/ — deliberately linked from
// nowhere. The partners proxy forces a portal session; requireDeckUser()
// additionally restricts it to internal users, because LPs hold the same
// cookie.
export default async function DeckPreviewPage({ params, searchParams }) {
  await requireDeckUser();
  const { deckId } = await params;
  const sp = await searchParams;
  if (!DECK_IDS.includes(deckId)) notFound();

  const dataSource = sp?.data === 'sanity' ? 'sanity' : 'fixture';
  const data = await loadDeckData(deckId, { dataSource });

  return (
    <PreviewShell deckId={deckId} dataSource={dataSource}>
      <DeckRenderer deckId={deckId} data={data} />
    </PreviewShell>
  );
}
