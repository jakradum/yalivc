import { Cover } from '../slide-types/cover/Cover';
import { fundIIDeck } from '../decks/fund-ii/manifest';

// slideType -> component. Add here as Phase 3/4 add real slide types.
export const slideComponents = {
  cover: Cover,
};

// deckId -> manifest.
export const decks = {
  'fund-ii': fundIIDeck,
};
