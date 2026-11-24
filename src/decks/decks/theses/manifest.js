// Standalone "Investment Theses" deck — one map slide + one tests slide per
// core Fund II sector, sourced entirely from Sanity `category.map`/`.tests`
// (see mapFromTheses.js). Sector ids are the real Sanity `slug.current`
// values, not re-derived — see mapFromTheses.js's own note on why.
//
// The four adjacent sectors (Space Tech, Quantum, Energy, Advanced
// Materials) don't get their own divider+map+tests trio — they carry
// just one row each (`asRow`), rendered together on the single
// `otherDeepTechSlide` below.
import { generatedDate } from '@/decks/core/deckVersion';
const CORE_SECTORS = [
  { slug: 'artificial-intelligence', section: 'Artificial Intelligence' },
  { slug: 'aerospace-and-surveillance', section: 'Aerospace and Surveillance' },
  { slug: 'life-sciences', section: 'Life Sciences' },
  { slug: 'robotics', section: 'Robotics' },
  { slug: 'fabless-semiconductor', section: 'Fabless Semiconductor' },
  { slug: 'smart-manufacturing', section: 'Smart Manufacturing' },
];

// `d.sectors` is a flat array of { id, section?, map? } | { id, tests? } —
// see mapFromTheses.js. A sector whose Sanity content is missing/incomplete
// resolves to `null` here, which DeckRenderer/resolve.js both treat as
// "skip this slide" (same convention as the fund-ii appendix page 2).
const find = (d, id, key) => d.sectors?.find((s) => s.id === id)?.[key] ?? null;

// Every section in deck order, for the running-index divider: read from
// the deck's own divider data so the list can never drift from the deck.
const sectionList = (d) => (d.sectors || []).filter((s) => s.divider).map((s) => ({ index: s.divider.index, name: s.divider.name }));
const indexDivider = (d, id) => {
  const div = find(d, id, 'divider');
  return div ? { name: div.name, subtitle: div.subtitle, sections: sectionList(d) } : null;
};

// Q&A layout (Nov 2026): the investment team found the photo/duotone
// version too graphic, so each section is now a running-index divider
// plus two question-and-answer pages. Same data as before; the old
// sector-divider / sector-map / sector-tests types stay registered.
const sectorSlides = CORE_SECTORS.flatMap(({ slug, section }) => [
  { id: `${slug}-divider`, type: 'sector-index', section, build: (d) => indexDivider(d, `${slug}-divider`) },
  { id: `${slug}-map`, type: 'qa-map', build: (d) => find(d, `${slug}-map`, 'map') },
  { id: `${slug}-tests`, type: 'qa-tests', build: (d) => find(d, `${slug}-tests`, 'tests') },
]);

// The four adjacent deep-tech sectors (Space Tech, Quantum, Energy,
// Advanced Materials) don't carry their own divider+map+tests trio of
// their own per sector — but the GROUP gets exactly that trio, once:
// a divider (reusing `sector-divider`, with an eyebrow/outline override
// so it doesn't read as a broken "SECTOR 07 OF 06"), a single map-style
// slide (their 4 rows + the shared not-investing boundary), and a single
// tests-style slide (the group's 3 common tests + why-now, reusing
// `sector-tests` directly since deepTechTestsSlideProps() already
// matches its expected shape).
const otherDeepTechSlides = [
  { id: 'other-deep-tech-divider', type: 'sector-index', section: 'Other Deep Tech', build: (d) => indexDivider(d, 'other-deep-tech-divider') },
  { id: 'other-deep-tech', type: 'qa-map', build: (d) => find(d, 'other-deep-tech', 'otherDeepTech') },
  { id: 'other-deep-tech-tests', type: 'qa-tests', build: (d) => find(d, 'other-deep-tech-tests', 'tests') },
];

export const thesesDeck = {
  id: 'theses',
  title: 'Yali Capital — Investment Theses',
  slides: [
    { id: 'cover', type: 'cover', build: (d) => ({ ...d.cover, stamp: generatedDate() }) },
    ...sectorSlides,
    ...otherDeepTechSlides,
    { id: 'closing', type: 'closing', build: (d) => d.closing },
  ],
};
