import 'server-only';
import { urlFor } from '@/sanity/client';
import { fetchThesisCategories, fetchDeepTechRows, fetchDeepTechGroup } from './queries';
import thesesFixture from './fixtures/theses.json';

// This is the ONLY file that knows both the `category` Sanity shape and the
// theses deck's slide props shapes — same rule as mapFromSanity.js.
//
// No per-field fixture fallback here (unlike mapFromSanity.js): this deck
// has no legacy hand-authored narrative to fall back to, it is entirely
// Sanity content by design. The fixture exists only to give the
// `dataSource: 'fixture'` preview path (the default, offline-safe one)
// something deterministic to render — it's a snapshot of real Sanity
// content, not hand-curated deck copy, and should be re-taken whenever the
// six core theses change meaningfully rather than maintained by hand.

// `*Name*` marks a Yali portfolio company inside a mapRow's `others`
// string (the schema's own authoring convention — see category.js). Split
// into plain-text/portfolio-name segments so the slide can render the
// portfolio names in a different colour without any markdown parser.
function parseOthers(others) {
  if (!others) return [];
  return others.split(/(\*[^*]+\*)/).filter(Boolean).map((seg) =>
    seg.startsWith('*') && seg.endsWith('*') ? { text: seg.slice(1, -1), portfolio: true } : { text: seg, portfolio: false }
  );
}

function mapRow(r) {
  return {
    segment: r.segment,
    detail: r.detail || '',
    position: r.position,
    decides: r.decides,
    leader: r.leader,
    others: parseOthers(r.others),
  };
}

// Near-square crop for the tests slide's three equal photo columns.
// Cropped server-side so every downstream component just renders a plain
// <img>, matching every other image field in this deck system (TeamCard,
// PortfolioTable, CompanyCard all take a resolved URL string, never a raw
// Sanity image object).
function plateUrl(imageRef) {
  if (!imageRef) return null;
  return urlFor(imageRef).width(640).height(560).fit('crop').auto('format').url();
}

// Tall portrait crop for the map slide's side rail — same source asset as
// the tests slide's lead photo (there's no per-segment imagery, only one
// photo set per sector), just cropped differently for a full-height rail
// instead of a near-square plate.
function railUrl(imageRef) {
  if (!imageRef) return null;
  return urlFor(imageRef).width(480).height(540).fit('crop').auto('format').url();
}

function mapSlideProps(cat) {
  const m = cat.map;
  return {
    eyebrow: `${cat.name} · ${m.kicker} · ${cat.asOf || ''}`,
    title: m.title,
    subtitle: m.subtitle,
    segmentLabel: m.segmentLabel,
    rows: (m.rows || []).map(mapRow),
    footers: m.footers || [],
    // Two distinct photos, not the same one twice: the lead card's inset
    // and the fourth column's inset draw from different tests items when
    // available (index 0 and 2), matching the map/tests slides' "spread
    // the sector's 3 uploaded photos across its slides" convention.
    railImageUrl: railUrl(cat.tests?.items?.[0]?.imageRef),
    railImageUrl2: railUrl(cat.tests?.items?.[2]?.imageRef || cat.tests?.items?.[0]?.imageRef),
  };
}

function dividerProps(cat, index) {
  return {
    index: String(index).padStart(2, '0'),
    name: cat.name,
    subtitle: cat.map?.subtitle || '',
    imageUrl: railUrl(cat.tests?.items?.[0]?.imageRef),
  };
}

function testsSlideProps(cat) {
  const t = cat.tests;
  return {
    eyebrow: `${cat.name} · ${t.kicker} · ${cat.asOf || ''}`,
    title: t.title,
    subtitle: t.subtitle,
    testsLabel: t.testsLabel,
    tests: (t.items || []).map((it) => ({
      title: it.title,
      body: it.body,
      evidence: it.evidence,
      figure: it.figure || null,
      imageUrl: plateUrl(it.imageRef),
    })),
    // Normalized here, not passed through raw: the Sanity query field is
    // `source`, but the fixture snapshot has it as `src` (a naming drift
    // between the two that a content proofread caught — the citation
    // wasn't being rendered anywhere, so the mismatch was invisible).
    // Accept either so both paths produce the same shape downstream.
    whyNow: (t.whyNow || []).map((w) => ({ label: w.label, value: w.value, body: w.body, source: w.source || w.src })),
    notFund: t.notFund,
    changeView: t.changeView,
  };
}

// `group` is the deepTechGroup singleton (may be null if it hasn't been
// authored) — its map-side fields (title/subtitle/notInvesting/footers)
// merge with the 4 sectors' individual `asRow` rows into one map-style
// slide, same shape SectorMapSlide-adjacent components expect.
function otherDeepTechSlideProps(deepTechCats, group) {
  return {
    eyebrow: `Other deep tech · ${group?.kicker || 'Where we also look'} · ${group?.asOf || ''}`,
    title: group?.title || 'Four adjacent frontiers, tracked the same way.',
    subtitle: group?.subtitle,
    rows: deepTechCats.map((cat) => mapRow(cat.asRow)),
    notInvesting: group?.notInvesting ? mapRow(group.notInvesting) : null,
    footers: group?.footers || [],
    railImageUrl: railUrl(group?.imageRef),
  };
}

// Same divider component the six core sectors use, index 7 continuing
// their numbering (see the divider's "SECTOR N OF 06" — read as "one
// more, distinct from the six" for this shared group rather than a 7th
// core sector).
function otherDeepTechDividerProps(group) {
  return {
    index: '07',
    eyebrowLabel: 'OTHER DEEP TECH',
    outlineLabel: '+4',
    name: 'Other Deep Tech',
    subtitle: group?.subtitle || '',
    imageUrl: railUrl(group?.imageRef),
  };
}

// The group's tests-side fields are shaped exactly like a sector's
// `tests` block, so this just re-packages them into the same `cat`
// shape testsSlideProps() already knows how to read — no new mapping
// logic, no new slide component, `sector-tests` renders it as-is.
function deepTechTestsSlideProps(group) {
  if (!group) return null;
  return testsSlideProps({
    name: 'Other Deep Tech',
    asOf: group.asOf,
    tests: {
      kicker: group.testsKicker,
      title: group.testsTitle,
      subtitle: group.testsSubtitle,
      items: group.tests,
      whyNow: group.whyNow,
      notFund: group.notFund,
      changeView: group.changeView,
    },
  });
}

export async function loadThesesFromSanity() {
  const [categories, deepTechCats, deepTechGroup] = await Promise.all([
    fetchThesisCategories(),
    fetchDeepTechRows(),
    fetchDeepTechGroup(),
  ]);
  if (!categories.length) return thesesFixture;

  const complete = categories.filter((cat) => cat.map?.rows?.length && cat.tests?.items?.length);
  const sectors = complete.flatMap((cat, i) => [
    { id: `${cat.slug}-divider`, section: cat.name, divider: dividerProps(cat, i + 1) },
    { id: `${cat.slug}-map`, map: mapSlideProps(cat) },
    { id: `${cat.slug}-tests`, tests: testsSlideProps(cat) },
  ]);

  if (deepTechCats.length) {
    sectors.push({ id: 'other-deep-tech-divider', section: 'Other Deep Tech', divider: otherDeepTechDividerProps(deepTechGroup) });
    sectors.push({ id: 'other-deep-tech', otherDeepTech: otherDeepTechSlideProps(deepTechCats, deepTechGroup) });
    const deepTechTests = deepTechTestsSlideProps(deepTechGroup);
    if (deepTechTests) {
      sectors.push({ id: 'other-deep-tech-tests', tests: deepTechTests });
    }
  }

  return {
    cover: thesesFixture.cover,
    sectors: sectors.length ? sectors : thesesFixture.sectors,
    closing: thesesFixture.closing,
  };
}
