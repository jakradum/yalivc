import { requireDeckUser } from '@/decks/auth';
import { DECK_IDS } from '@/decks/core/constants';
import { BuilderClient } from './BuilderClient';
import '@/decks/design-system/fonts.css';
import '@/decks/design-system/tokens.css';

export const metadata = { robots: 'noindex, nofollow', title: 'Deck builder' };
export const dynamic = 'force-dynamic';

// Served at partners.yali.vc/deck-builder/ — linked from nowhere, same
// internal-only guard as the deck itself.
export default async function DeckBuilderPage() {
  await requireDeckUser();
  return <BuilderClient deckId={DECK_IDS[0]} />;
}
