// A deck's version lives in one place: `cover.version` in its data file
// (fixtures/<deck>.json; the Sanity loaders reuse the fixture cover). From
// there it reaches the cover footer, the PDF's Title metadata (Chrome copies
// document.title) and the download filename. Bump rules and the version log
// are in src/decks/VERSIONS.md.
const DECK_NAMES = {
  'fund-ii': 'Yali Capital Fund II',
  theses: 'Yali Capital Investment Theses',
};

// The day the deck is generated, for the cover stamp.
export const generatedDate = () =>
  new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

export const deckVersion = (data) => data?.cover?.version || null;

export const deckDocTitle = (deckId, data) => [DECK_NAMES[deckId] || deckId, deckVersion(data)].filter(Boolean).join(' · ');
