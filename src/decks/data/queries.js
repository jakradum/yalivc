import 'server-only';
import { client } from '@/sanity/client';
import { listDocs } from '@/lib/private-docs';
import { getFund2Settings } from '@/lib/fund2-settings';

// Explicit projections only — never `{...}` — same rule the rest of the
// codebase follows, so nothing unintended ever reaches a rendered deck.

// Fund II terms, from Supabase (src/lib/fund2-settings.js), in the shape the
// mapper expects: sectors as [{ name }].
export async function fetchFundIISettings() {
  const f = await getFund2Settings();
  if (!f) return null;
  const { location, ...rest } = f;
  return { ...rest, focusSectors: f.focusSectors.map((name) => ({ name })), adjacentSectors: f.adjacentSectors.map((name) => ({ name })) };
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
// Public fields (name, sector, logo) come from Sanity; investment rounds and
// quarterly numbers are confidential and live only in Supabase (moved out of
// Sanity 24 Nov 2026), joined on the document id.
export async function fetchFundIPortfolio() {
  const [companies, privateDocs] = await Promise.all([
    client.fetch(`*[_type == "company"] {
      _id,
      name,
      "sector": category->name,
      investmentStatus,
      "slug": slug.current,
      oneLiner,
      "logoUrl": logo.asset->url
    }`),
    listDocs('company'),
  ]);
  const byId = new Map(privateDocs.map((d) => [d._id, d]));
  return companies.map(({ _id, ...c }) => {
    const rounds = byId.get(_id)?.investmentRounds;
    const updates = byId.get(_id)?.quarterlyUpdates;
    const initial = rounds?.find((r) => r.isInitialRound === true);
    // Latest reported quarter that actually carries an FMV (and isn't flagged
    // confidential); the newest quarter is often an empty placeholder.
    const latest = (updates || [])
      .filter((u) => u.currentFMV != null && u.currentFMVConfidential !== true)
      .sort((a, b) => String(b.fiscalYear).localeCompare(String(a.fiscalYear)) || String(b.quarter).localeCompare(String(a.quarter)))[0];
    return {
      ...c,
      initialRound: initial ? { investmentDate: initial.investmentDate ?? null, yaliInvestment: initial.yaliInvestment ?? null } : null,
      rounds: rounds ? rounds.map((r) => ({ investmentDate: r.investmentDate ?? null, yaliInvestment: r.yaliInvestment ?? null, yaliOwnership: r.yaliOwnership ?? null, roundName: r.roundName ?? null })) : null,
      latestUpdate: latest ? { currentFMV: latest.currentFMV ?? null, multipleOfInvestment: latest.multipleOfInvestment ?? null, currentOwnershipPercent: latest.currentOwnershipPercent ?? null } : null,
    };
  });
}

// Fund I aggregate stats: the latest quarterly report on lpFundSettings, read
// from Supabase (read-only; that document belongs to the LP report). Quarters
// are unordered, so sort by fiscal year then quarter.
export async function fetchFundIStats() {
  const settings = (await listDocs('lpFundSettings'))[0];
  if (!settings) return null;
  const latest = [...(settings.quarterlyPerformance || [])]
    .sort((a, b) => String(b.fiscalYear).localeCompare(String(a.fiscalYear)) || String(b.quarter).localeCompare(String(a.quarter)))[0];
  const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, o?.[k] ?? null]));
  return {
    ...pick(settings, ['firstCloseDate', 'finalCloseDate', 'targetFundSizeINR', 'fundSizeAtClose']),
    latest: latest ? pick(latest, ['quarter', 'fiscalYear', 'amountDrawnDown', 'totalInvested', 'fairMarketValue', 'amountReturned', 'moic', 'tvpi', 'dpi', 'rvpi']) : null,
  };
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
