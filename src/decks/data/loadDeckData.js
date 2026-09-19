import 'server-only';
import fundIIFixture from './fixtures/fund-ii.json';
import { loadFundIIFromSanity } from './mapFromSanity';

const FIXTURES = {
  'fund-ii': fundIIFixture,
};

const SANITY_LOADERS = {
  'fund-ii': loadFundIIFromSanity,
};

// dataSource: 'fixture' (default, offline/deterministic) or 'sanity'
// (Phase 4 — real data, mapped to the exact same shape so components
// never know which one ran).
export async function loadDeckData(deckId, { dataSource = 'fixture' } = {}) {
  if (dataSource === 'sanity') {
    const loader = SANITY_LOADERS[deckId];
    if (!loader) throw new Error(`loadDeckData: no Sanity loader for deckId "${deckId}"`);
    return loader();
  }
  const data = FIXTURES[deckId];
  if (!data) {
    throw new Error(`loadDeckData: no fixture for deckId "${deckId}"`);
  }
  return data;
}
