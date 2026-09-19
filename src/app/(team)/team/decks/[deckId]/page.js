import { notFound } from 'next/navigation';
import { loadDeckData } from '@/decks/data/loadDeckData';
import { DECK_IDS } from '@/decks/core/constants';
import { PreviewShell } from '@/decks/canvas/PreviewShell';
import { DeckRenderer } from '@/decks/core/DeckRenderer';

export const metadata = { robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

// Phase 1: reachable only via team.yali.vc (proxy blocks /team/* on the
// main domain — see src/proxy.js). No per-route auth yet; that's Phase 6
// hardening, tracked in DECK_MIGRATION_PLAN.md. Do not treat this as
// safe for anything beyond internal walking-skeleton work until then.
export default async function DeckPreviewPage({ params, searchParams }) {
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
