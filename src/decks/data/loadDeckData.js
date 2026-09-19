import 'server-only';
import fundIIFixture from './fixtures/fund-ii.json';

const FIXTURES = {
  'fund-ii': fundIIFixture,
};

// Phase 1: fixture-only. Phase 5 adds the real Sanity path (GROQ ->
// validate -> mapper -> this same DeckData shape) behind
// DECK_DATA_SOURCE=sanity — components never know which one ran.
export async function loadDeckData(deckId, { dataSource = 'fixture' } = {}) {
  if (dataSource !== 'fixture') {
    throw new Error(
      `loadDeckData: dataSource "${dataSource}" not implemented yet — Phase 1 is fixture-only by design (see DECK_MIGRATION_PLAN.md, Phase 5).`
    );
  }
  const data = FIXTURES[deckId];
  if (!data) {
    throw new Error(`loadDeckData: no fixture for deckId "${deckId}"`);
  }
  return data;
}
