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

  const teamOverviewPeople = team.map((t) => {
    const shortName = t.name.split(' ')[0]; // fixture keys are first-name-only, e.g. "Karthik"
    const fallback = fixtureBadgeByName[t.name] || fixtureBadgeByName[shortName];
    return {
      name: t.name,
      photoUrl: t.photoUrl,
      experienceBadge: fallback?.experienceBadge || t.oneLiner,
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
    media: fundIIFixture.media, // no Sanity `news` wiring yet — out of scope for this pass
    closing: fundIIFixture.closing,
  };
}
