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

// All `company` documents. No fund field exists on this schema (Phase 0/4
// finding) — Fund II has no completed investments yet, so every document
// here is a Fund I holding by construction, not by an explicit filter.
// Revisit this query the day a `company` gets a real fund reference.
export async function fetchFundIPortfolio() {
  return client.fetch(`*[_type == "company" && showOnMainWebsite == true] | order(order asc) {
    name,
    "sector": category->name,
    investmentStatus,
    "logoUrl": logo.asset->url,
    "initialRound": investmentRounds[isInitialRound == true][0]{ investmentDate, yaliInvestment },
    "latestUpdate": quarterlyUpdates[-1]{ currentFMV, multipleOfInvestment }
  }`);
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
