import 'server-only';
import { client } from '@/sanity/client';

// Explicit projections only — never `{...}` — same rule the rest of the
// codebase follows, so nothing unintended ever reaches a rendered deck.

export async function fetchFundIISettings() {
  return client.fetch(`*[_id == "fund2Settings"][0]{
    fundName,
    targetFundSizeINR,
    targetFundSizeUSD,
    greenshoeINR,
    fundTerm,
    investmentPeriodYears,
    deploymentStageAllocation[]{ stage, percent, note },
    "focusSectors": focusSectors[]->{ name },
    "adjacentSectors": adjacentSectors[]->{ name }
  }`);
}

// Every `company` document — deliberately NOT filtered on
// `showOnMainWebsite`. That flag controls the public website only; this deck
// is for LPs, who are entitled to see the whole portfolio, so there's no
// secrecy reason to hide a company here. The deck's portfolio is then the
// subset with at least one investment round (see mapFromSanity), which drops
// pipeline names (e.g. companies not yet invested in) that have no numbers.
// No fund field exists on this schema (Phase 0/4 finding) — Fund II has no
// completed investments yet, so every invested company is a Fund I holding
// by construction. Revisit the day a `company` gets a real fund reference.
export async function fetchFundIPortfolio() {
  return client.fetch(`*[_type == "company"] {
    name,
    "sector": category->name,
    investmentStatus,
    "slug": slug.current,
    oneLiner,
    "logoUrl": logo.asset->url,
    "initialRound": investmentRounds[isInitialRound == true][0]{ investmentDate, yaliInvestment },
    "rounds": investmentRounds[]{ investmentDate, yaliInvestment, yaliOwnership, roundName },
    // Latest reported quarter that actually carries an FMV (and isn't
    // flagged confidential). quarterlyUpdates is unordered and the newest
    // quarter is often an empty placeholder, so [-1] returned no FMV.
    "latestUpdate": quarterlyUpdates[defined(currentFMV) && currentFMVConfidential != true] | order(fiscalYear desc, quarter desc)[0]{
      currentFMV, multipleOfInvestment, currentOwnershipPercent
    }
  }`);
}

// Fund I aggregate stats: the latest quarterly report on lpFundSettings
// (read-only — that document belongs to the LP report and is never written
// from here). Quarters are unordered, so sort by fiscal year then quarter.
export async function fetchFundIStats() {
  return client.fetch(`*[_type == "lpFundSettings"][0]{
    firstCloseDate,
    finalCloseDate,
    targetFundSizeINR,
    fundSizeAtClose,
    "latest": quarterlyPerformance | order(fiscalYear desc, quarter desc)[0]{
      quarter, fiscalYear, amountDrawnDown, totalInvested, fairMarketValue,
      amountReturned, moic, tvpi, dpi, rvpi
    }
  }`);
}

// LP logos on the "Our limited partners" slide. Which LPs to feature is a
// curated, code-owned selection (by name); the logo itself lives in Sanity.
export async function fetchInvestorLogos(names) {
  const rows = await client.fetch(`*[_type == "investor" && name in $names]{ name, "logoUrl": logo.asset->url }`, { names });
  return names.map((n) => rows.find((r) => r.name === n)).filter(Boolean);
}

// Individuals only (excludes the "Yali Team" group-type document).
// oneLiner/previousEmployers exist but don't yet hold deck-ready content
// for everyone — see DECK_MIGRATION_PLAN.md Phase 4 findings.
export async function fetchTeamMembers() {
  return client.fetch(`*[_type == "teamMember" && profileType != "group" && status == true] | order(order asc) {
    name,
    department,
    oneLiner,
    "employers": previousEmployers[].companyName,
    "photoUrl": photo.asset->url
  }`);
}

// The six core Fund II sectors that carry a full map+tests thesis (the
// four adjacent sectors only have `asRow`, no `map`/`tests`, and are
// deliberately excluded by this filter — they belong to a still-undecided
// grouped "Other Deep Tech" slide, out of scope for this deck for now).
// `image` is resolved to a hotspot-aware asset ref string here, not a full
// Sanity image object — mapFromTheses.js turns it into a cropped URL via
// urlFor(), matching every other image field in this deck system.
export async function fetchThesisCategories() {
  return client.fetch(`*[_type == "category" && defined(map) && defined(tests)] | order(order asc) {
    name,
    "slug": slug.current,
    asOf,
    map{
      kicker, title, subtitle, segmentLabel,
      rows[]{ segment, detail, position, decides, leader, others },
      footers[]{ label, text }
    },
    tests{
      kicker, title, subtitle, testsLabel,
      items[]{ title, body, evidence, figure, "imageRef": image.asset._ref },
      whyNow[]{ label, value, source, body },
      notFund, changeView
    }
  }`);
}

// The four adjacent deep-tech sectors (Space Tech, Quantum, Energy,
// Advanced Materials) don't carry their own map/tests — just one
// `asRow` each, meant for a single shared "Other Deep Tech" slide. See
// mapFromTheses.js's otherDeepTechSlideProps().
export async function fetchDeepTechRows() {
  return client.fetch(`*[_type == "category" && defined(asRow) && !defined(map)] | order(order asc) {
    "slug": slug.current,
    asRow{ segment, detail, position, decides, leader, others }
  }`);
}

// The shared group content (three tests, why-now stats, not-investing
// boundary, "what changed/what did not") for those same four sectors —
// see schemas/deepTechGroup.js for why this is one singleton document
// rather than per-sector fields.
export async function fetchDeepTechGroup() {
  return client.fetch(`*[_type == "deepTechGroup"][0]{
    asOf, kicker, title, subtitle,
    "imageRef": image.asset._ref,
    notInvesting{ segment, detail, position, decides, leader, others },
    footers[]{ label, text },
    testsKicker, testsTitle, testsSubtitle,
    tests[]{ title, body, evidence, figure, "imageRef": image.asset._ref },
    whyNow[]{ label, value, source, body },
    notFund, changeView
  }`);
}
