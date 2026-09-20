import 'server-only';
import { fetchFundIISettings, fetchFundIPortfolio, fetchTeamMembers } from './queries';
import fundIIFixture from './fixtures/fund-ii.json';

// This is the ONLY file that knows both the Sanity shapes and the slide
// props shapes. If a Sanity field renames, this is the one place to fix.
//
// Deliberately partial: team "experience badge" copy and per-person
// employer-history bullets don't exist as populated Sanity content for
// most people yet (previousEmployers is empty for everyone — a real
// Phase 0/4 finding, not a query bug). Falls back to the fixture's
// hand-curated strings for those two fields until that's resolved with
// the owner, rather than showing blank badges or fabricating employers.
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
const titleCase = (slug) => slug.replace(/-/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
const cr = (n) => `${Number.isInteger(n) ? n.toFixed(2) : String(n)} Cr`;

// One appendix card. Facts (amounts, dates, ownership, stage) are derived
// from the company's rounds and latest reported quarter; the description
// is deck narrative — hand-written per company in the fixture, keyed by
// slug, falling back to the company's one-liner. A metric with no data is
// left out rather than shown as a dash.
function appendixCard(c) {
  const rounds = [...(c.rounds || [])].sort((a, b) => a.investmentDate.localeCompare(b.investmentDate));
  const first = rounds[0];
  const latest = rounds[rounds.length - 1];
  const invested = rounds.reduce((sum, r) => sum + (r.yaliInvestment || 0), 0);
  const ownership = c.latestUpdate?.currentOwnershipPercent ?? latest?.yaliOwnership;
  const metrics = [
    invested ? { label: 'Invested', value: cr(Math.round(invested * 100) / 100) } : null,
    c.latestUpdate?.currentFMV != null ? { label: 'FMV', value: cr(c.latestUpdate.currentFMV) } : null,
    c.latestUpdate?.multipleOfInvestment != null ? { label: 'MOIC', value: `${c.latestUpdate.multipleOfInvestment.toFixed(2)}x` } : null,
    first ? { label: 'First Investment', value: fmtDate(first.investmentDate) } : null,
    ownership != null ? { label: 'Ownership', value: `${ownership.toFixed(1)}%` } : null,
    latest?.roundName ? { label: 'Stage', value: titleCase(latest.roundName) } : null,
  ].filter(Boolean);
  return {
    name: c.name,
    sector: c.sector,
    logoUrl: c.logoUrl,
    investmentStatus: c.investmentStatus,
    description: fundIIFixture.appendixDescriptions[c.slug] || c.oneLiner || '',
    metrics,
  };
}

export async function loadFundIIFromSanity() {
  const [settings, portfolio, team] = await Promise.all([
    fetchFundIISettings(),
    fetchFundIPortfolio(),
    fetchTeamMembers(),
  ]);

  const fixtureEmployersByName = Object.fromEntries(
    fundIIFixture.investmentsTeam.people.map((p) => [p.name, p.employers])
  );

  // Sanity names carry quoted nicknames ("Ganapathy 'Gani' Subramaniam")
  // that don't match plain first-name matching — strip them before
  // comparing.
  const stripNickname = (name) => name.replace(/\s*'[^']*'\s*/g, ' ').replace(/\s+/g, ' ').trim();

  // Team Overview is a curated 8, in legacy's exact order and using
  // legacy's exact display names — NOT every live teamMember. A prior
  // version mapped over the full live list (11 people, including 3 who
  // don't belong on this slide at all), which also broke the grid into
  // unreadable columns. Found by Pranav comparing the actual render
  // against the legacy screenshot directly. Badge text stays
  // fixture-owned (it's deck-specific copy, matching the same
  // "facts in Sanity, rhetoric in code" reasoning as the person-slides);
  // only the photo is resolved live, by fuzzy first-name match.
  const teamOverviewPeople = fundIIFixture.teamOverview.people.map((fixturePerson) => {
    const firstName = fixturePerson.name.split(' ')[0];
    const match = team.find((m) => stripNickname(m.name).startsWith(firstName) || m.name.startsWith(firstName));
    return { ...fixturePerson, photoUrl: match?.photoUrl || null };
  });

  // Which real people appear in which person-slide, and with which
  // pattern-bank number (data-pat in the legacy deck) — this selection
  // and pattern assignment is deck-specific styling, not a Sanity fact,
  // so it's code-owned. Name/photo/employers still come live from Sanity.
  const buildPersonGroup = (entries) =>
    entries.map(({ displayName, matchName, patNum }) => {
      const match = team.find((t) => t.name.startsWith(matchName));
      const employers = match?.employers?.length ? match.employers : fixtureEmployersByName[displayName] || [];
      return { name: displayName, photoUrl: match?.photoUrl || null, employers, patNum };
    });

  const gpsAdvisorPeople = buildPersonGroup([
    { displayName: 'Gani', matchName: 'Ganapathy', patNum: 1 },
    { displayName: 'Mathew', matchName: 'Mathew', patNum: 2 },
    { displayName: 'Lip-Bu', matchName: 'Lip-Bu', patNum: 3 },
  ]);
  const investmentsTeamPeople = buildPersonGroup([
    { displayName: 'Karthik', matchName: 'Karthikeyan', patNum: 4 },
    { displayName: 'Sandipan', matchName: 'Sandipan', patNum: 5 },
    { displayName: 'Kaushik', matchName: 'Kaushik', patNum: 6 },
  ]);
  const operationsTeamPeople = buildPersonGroup([
    { displayName: 'Sunil', matchName: 'Sunil', patNum: 7 },
    { displayName: 'Pranav', matchName: 'Pranav', patNum: 1 },
  ]);

  return {
    cover: fundIIFixture.cover,
    contents: fundIIFixture.contents,
    teamOverview: { label: fundIIFixture.teamOverview.label, people: teamOverviewPeople },
    gpsAdvisor: { people: gpsAdvisorPeople },
    investmentsTeam: { people: investmentsTeamPeople },
    operationsTeam: { people: operationsTeamPeople, maxWidth: 660 },
    fundIIKeyTerms: settings
      ? {
          heading: 'Fund II · Key Terms',
          fundSizeLabel: `₹${settings.targetFundSizeINR?.toLocaleString('en-IN')} Crore (~$${settings.targetFundSizeUSD}M)`,
          greenshoeLabel: settings.greenshoeINR ? `Greenshoe ₹${settings.greenshoeINR} Crore` : undefined,
          fundTerm: settings.fundTerm,
          investmentPeriodYears: settings.investmentPeriodYears,
        }
      : fundIIFixture.fundIIKeyTerms,
    fundIIDeployment: settings?.deploymentStageAllocation?.length
      ? { heading: 'Fund II · Deployment Strategy', allocation: settings.deploymentStageAllocation }
      : fundIIFixture.fundIIDeployment,
    fundIPortfolio: portfolio?.length
      ? {
          heading: 'Fund I · Portfolio',
          asOf: `As of ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · ₹ crores`,
          rows: portfolio.map((c) => ({
            name: c.name,
            sector: c.sector,
            logoUrl: c.logoUrl,
            invested: c.initialRound?.yaliInvestment ? `${c.initialRound.yaliInvestment} Cr` : null,
            moic: c.latestUpdate?.multipleOfInvestment ? `${c.latestUpdate.multipleOfInvestment.toFixed(2)}x` : null,
            fmv: c.latestUpdate?.currentFMV ? `${c.latestUpdate.currentFMV} Cr` : null,
            firstInvestment: c.initialRound?.investmentDate
              ? new Date(c.initialRound.investmentDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : null,
          })),
        }
      : fundIIFixture.fundIPortfolio,
    appendixPortfolio: portfolio?.length
      ? { companies: portfolio.map(appendixCard) }
      : fundIIFixture.appendixPortfolio,
    thesis: settings?.focusSectors?.length
      ? {
          heading: 'Our Investment Areas · Fund II Thesis',
          core: settings.focusSectors.map((s) => ({ label: s.name })),
          adjacent: (settings.adjacentSectors || []).map((s) => ({ label: s.name })),
        }
      : fundIIFixture.thesis,
    dealflow: fundIIFixture.dealflow, // no Sanity model for process copy — code-owned narrative
    portfolioSupport: fundIIFixture.portfolioSupport,
    cxoMap: fundIIFixture.cxoMap,
    governance: fundIIFixture.governance,
    media: fundIIFixture.media, // no Sanity `news` wiring yet — out of scope for this pass
    closing: fundIIFixture.closing,
  };
}
