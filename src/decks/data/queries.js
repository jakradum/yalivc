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
