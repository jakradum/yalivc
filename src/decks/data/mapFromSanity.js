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
export async function loadFundIIFromSanity() {
  const [settings, portfolio, team] = await Promise.all([
    fetchFundIISettings(),
    fetchFundIPortfolio(),
    fetchTeamMembers(),
  ]);

  const fixtureBadgeByName = Object.fromEntries(
    fundIIFixture.teamOverview.people.map((p) => [p.name, { experienceBadge: p.experienceBadge, badgeTone: p.badgeTone }])
  );
  const fixtureEmployersByName = Object.fromEntries(
    fundIIFixture.investmentsTeam.people.map((p) => [p.name, p.employers])
  );

  // Sanity names carry quoted nicknames ("Ganapathy 'Gani' Subramaniam")
  // that don't match the fixture's plain names — strip them before
  // matching, or the lookup silently misses and falls back to the much
  // longer oneLiner sentence (a real overflow bug, found via the export
  // overflow check).
  const stripNickname = (name) => name.replace(/\s*'[^']*'\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const MAX_FALLBACK_BADGE_LEN = 46;

  const teamOverviewPeople = team.map((t) => {
    const normalized = stripNickname(t.name);
    const fallback = fixtureBadgeByName[t.name] || fixtureBadgeByName[normalized];
    const oneLinerFallback =
      t.oneLiner && t.oneLiner.length > MAX_FALLBACK_BADGE_LEN
        ? `${t.oneLiner.slice(0, MAX_FALLBACK_BADGE_LEN - 1).trimEnd()}…`
        : t.oneLiner;
    return {
      name: t.name,
      photoUrl: t.photoUrl,
      experienceBadge: fallback?.experienceBadge || oneLinerFallback,
      badgeTone: fallback?.badgeTone || 'white',
    };
  });

  const investmentsTeamPeople = fundIIFixture.investmentsTeam.people.map((fixturePerson) => {
    const match = team.find((t) => t.name.startsWith(fixturePerson.name));
    return {
      name: fixturePerson.name,
      photoUrl: match?.photoUrl || null,
      employers: (match?.employers?.length ? match.employers : fixtureEmployersByName[fixturePerson.name]) || [],
    };
  });

  return {
    cover: fundIIFixture.cover,
    contents: fundIIFixture.contents,
    teamOverview: { label: fundIIFixture.teamOverview.label, people: teamOverviewPeople },
    investmentsTeam: { label: fundIIFixture.investmentsTeam.label, people: investmentsTeamPeople },
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
      ? { heading: 'Fund I Portfolio', companies: portfolio }
      : fundIIFixture.fundIPortfolio,
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
