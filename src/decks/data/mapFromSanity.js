import 'server-only';
import { fetchFundIISettings, fetchFundIPortfolio, fetchFundIStats, fetchInvestorLogos, fetchTeamMembers } from './queries';
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
const cr = (n) => `${n.toFixed(2)} Cr`;
const round2 = (n) => Math.round(n * 100) / 100;
// Sanity category names use "and"; the deck's display labels use "&".
const displaySector = (name) => (name || '').replace(/\band\b/gi, '&');

// Per-company facts, derived once and shared by the Fund I table, the sector
// pie and the appendix cards so they can never disagree. Amounts are summed
// across ALL of a company's rounds; FMV/MOIC come from the latest reported
// quarter that carries an FMV; ownership and stage from the latest round.
function factsFor(c) {
  const rounds = [...(c.rounds || [])].sort((a, b) => a.investmentDate.localeCompare(b.investmentDate));
  const first = rounds[0];
  const latest = rounds[rounds.length - 1];
  return {
    invested: rounds.reduce((sum, r) => sum + (r.yaliInvestment || 0), 0),
    fmv: c.latestUpdate?.currentFMV ?? null,
    moic: c.latestUpdate?.multipleOfInvestment ?? null,
    firstDate: first?.investmentDate || null,
    ownership: c.latestUpdate?.currentOwnershipPercent ?? latest?.yaliOwnership ?? null,
    stage: latest?.roundName || null,
  };
}

// FY27 Q1 → "June 2026". Indian fiscal year: FYyy runs Apr (yy-1) – Mar (yy).
function quarterEnd({ fiscalYear, quarter }) {
  const fy = 2000 + parseInt(String(fiscalYear).replace(/\D/g, ''), 10);
  const q = parseInt(String(quarter).replace(/\D/g, ''), 10);
  const month = [5, 8, 11, 2][q - 1]; // Jun, Sep, Dec, Mar
  const year = q === 4 ? fy : fy - 1;
  return new Date(Date.UTC(year, month, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

const shortDate = (iso) => {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })} '${String(d.getUTCFullYear()).slice(2)}`;
};

// One appendix card. Facts come from factsFor; the description is deck
// narrative — hand-written per company in the fixture, keyed by slug,
// falling back to the company's one-liner. A metric with no data is left
// out rather than shown as a dash.
function appendixCard(c) {
  const f = factsFor(c);
  const metrics = [
    f.invested ? { label: 'Invested', value: cr(round2(f.invested)) } : null,
    f.fmv != null ? { label: 'FMV', value: cr(f.fmv) } : null,
    f.moic != null ? { label: 'MOIC', value: `${f.moic.toFixed(2)}x` } : null,
    f.firstDate ? { label: 'First Investment', value: fmtDate(f.firstDate) } : null,
    f.ownership != null ? { label: 'Ownership', value: `${f.ownership.toFixed(1)}%` } : null,
    f.stage ? { label: 'Stage', value: titleCase(f.stage) } : null,
  ].filter(Boolean);
  return {
    name: c.name,
    sector: displaySector(c.sector),
    logoUrl: c.logoUrl,
    investmentStatus: c.investmentStatus,
    description: fundIIFixture.appendixDescriptions[c.slug] || c.oneLiner || '',
    metrics,
  };
}

// Legacy palette, largest slice first.
const PIE_COLORS = ['#830d35', '#bb3e68', '#d65d85', '#db90a9', '#f4c0d4', '#fae3ec'];

function sectorSlices(portfolio) {
  const bySector = new Map();
  for (const c of portfolio) {
    const name = displaySector(c.sector);
    bySector.set(name, (bySector.get(name) || 0) + factsFor(c).invested);
  }
  const total = [...bySector.values()].reduce((a, b) => a + b, 0) || 1;
  return [...bySector.entries()]
    .sort((x, y) => y[1] - x[1])
    .map(([label, amount], i) => ({
      label,
      amount: cr(round2(amount)).replace(' Cr', ''),
      value: amount,
      percent: ((amount / total) * 100).toFixed(2),
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
}

function statsRows(stats, companyCount) {
  const q = stats?.latest;
  if (!q) return null;
  const x = (n, dp = 2) => (n == null ? '—' : n.toFixed(dp));
  return [
    { label: 'First close date', value: stats.firstCloseDate ? shortDate(stats.firstCloseDate) : '—' },
    { label: 'Final close date', value: stats.finalCloseDate ? shortDate(stats.finalCloseDate) : '—' },
    { label: 'Combined fund size', value: x(stats.targetFundSizeINR) },
    { label: 'Amount drawn down', value: x(q.amountDrawnDown) },
    { label: 'Total invested in portfolio', value: x(q.totalInvested) },
    { label: 'Fair Market Value of portfolio investments (incl. realised value)', value: x(q.fairMarketValue) },
    { label: 'Number of portfolio companies', value: String(companyCount) },
    { label: 'Amount returned (incl. passive income)', value: x(q.amountReturned) },
    { label: 'MOIC', value: q.moic == null ? '—' : `${q.moic.toFixed(2)}x` },
    { label: 'TVPI', value: q.tvpi == null ? '—' : `${q.tvpi.toFixed(2)}x` },
    { label: 'RVPI', value: q.rvpi == null ? '—' : `${q.rvpi.toFixed(2)}x` },
    { label: 'DPI', value: q.dpi == null ? '—' : `${q.dpi.toFixed(4)}x` },
  ];
}

export async function loadFundIIFromSanity() {
  const [settings, allCompanies, team, fundIStats, lpLogos] = await Promise.all([
    fetchFundIISettings(),
    fetchFundIPortfolio(),
    fetchTeamMembers(),
    fetchFundIStats(),
    fetchInvestorLogos(fundIIFixture.lpLogos.names),
  ]);

  // The deck's portfolio = every company we've actually invested in (has at
  // least one round), oldest investment first — the order the legacy deck
  // used. Not filtered on showOnMainWebsite: see fetchFundIPortfolio.
  const portfolio = allCompanies
    .filter((c) => c.rounds?.length)
    .sort((a, b) => factsFor(a).firstDate.localeCompare(factsFor(b).firstDate));

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
    fundIPortfolio: portfolio.length
      ? {
          heading: 'Fund I · Portfolio',
          asOf: `As of ${fundIStats?.latest ? quarterEnd(fundIStats.latest) : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · ₹ crores`,
          rows: portfolio.map((c) => {
            const f = factsFor(c);
            return {
              name: c.name,
              sector: displaySector(c.sector),
              logoUrl: c.logoUrl,
              invested: cr(round2(f.invested)),
              moic: f.moic != null ? `${f.moic.toFixed(2)}x` : null,
              fmv: f.fmv != null ? cr(f.fmv) : null,
              firstInvestment: f.firstDate ? fmtDate(f.firstDate) : null,
            };
          }),
        }
      : fundIIFixture.fundIPortfolio,
    appendixPortfolio: portfolio.length
      ? { companies: portfolio.map(appendixCard) }
      : fundIIFixture.appendixPortfolio,
    fundIStats: statsRows(fundIStats, portfolio.length)
      ? {
          heading: `Fund I · As of ${quarterEnd(fundIStats.latest)}`,
          unit: 'Amount in ₹ crores',
          rows: statsRows(fundIStats, portfolio.length),
        }
      : fundIIFixture.fundIStats,
    fundISectors: portfolio.length
      ? { heading: 'Portfolio Investments by Sector', slices: sectorSlices(portfolio) }
      : fundIIFixture.fundISectors,
    // Inbound / evaluated / pipeline counts come from the CRM, not Sanity, so
    // they're code-owned in the fixture; the portfolio count is live.
    fundIDealflow: {
      ...fundIIFixture.fundIDealflow,
      stats: fundIIFixture.fundIDealflow.stats.map((st) =>
        st.label === 'Portfolio investments' && portfolio.length ? { ...st, value: String(portfolio.length) } : st
      ),
    },
    lpLogos: { ...fundIIFixture.lpLogos, logos: lpLogos.length ? lpLogos : fundIIFixture.lpLogos.logos },
    fundINearTerm: fundIIFixture.fundINearTerm,
    fundIIStructureTitle: fundIIFixture.fundIIStructureTitle,
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
