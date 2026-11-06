// The recorded inputs for every function, derived from the fixtures plus hostile strings.
const LONG = 'x'.repeat(2000);
const HOSTILE = ['', '%', '_', '*', '(', ',', 'é', LONG];
const uniq = (arr) => {
  const seen = new Set();
  return arr.filter((a) => { const k = JSON.stringify(a); if (seen.has(k)) return false; seen.add(k); return true; });
};
const normalize = (s) => s.toLowerCase().trim(); // what the routes do before querying

export function inputsFor(name, spec, docs, scenario) {
  const of = (t) => docs.filter((d) => d._type === t);
  const companySlugs = of('company').map((d) => d.slug?.current).filter((s) => typeof s === 'string');
  const reportSlugs = of('lpQuarterlyReport').map((d) => d.slug?.current).filter((s) => typeof s === 'string');
  const emails = of('portalUser').map((d) => d.email).filter((s) => typeof s === 'string');
  const fixtureDomains = of('domainPrivilege').map((d) => d.domain).filter((s) => typeof s === 'string');

  const slugInputs = (slugs) => uniq([
    ...slugs, ...slugs.slice(0, 2).flatMap((s) => [s.toUpperCase(), ` ${s}`, `${s} `]),
    'unknown-slug', 'acme_robotics', 'acme-robotic_', 'acme%', 'acme*', 'acme-robotics,beta-biotech', '(acme-robotics)',
    'xi-status', 'ångström-analytics', 'fy26_q2', 'fy26-q%', ...HOSTILE,
  ]).map((s) => [s]);

  const emailRaw = uniq([
    ...emails, ...emails.map((e) => e.toUpperCase()), ...emails.slice(0, 3).flatMap((e) => [` ${e}`, `${e} `, `\t${e}\n`]),
    'nobody@example.com', 'LP1@EXAMPLE.COM', 'lp_@example.com', 'lp%@example.com', 'lp*@example.com', 'lp?@example.com',
    'lp1@example.com,lp2@example.com', '(lp1@example.com)', 'lp1@example.co_', '%@example.com', '*@example.com',
    'under-score@example.com', 'underXscore@example.com', 'percentXsign@example.com', 'percent%sign@example.com',
    'trailing17@example.com', 'ilker@example.com', 'i̇lker@example.com', 'ılker@example.com',
    'οδοσ@example.com', 'οδος@example.com', 'åsa.öberg@example.com', 'ÅSA.ÖBERG@EXAMPLE.COM', 'lp+tag@example.com', 'lp tag@example.com',
    'domainuser@acme-lp.example', 'DomainUser@Acme-LP.example', ...HOSTILE,
  ]);
  const domainRaw = uniq([
    ...fixtureDomains, ...fixtureDomains.map((d) => d.toUpperCase()), ...fixtureDomains.slice(0, 2).flatMap((d) => [` ${d}`, `${d} `]),
    ...emailRaw.filter((e) => e.includes('@')).map((e) => e.split('@')[1]),
    'unknown.example', 'under-score.example', 'underXscore.example', '%.example', '_.example', '*.example', 'acme-lp.exampl_',
    'acme-lp.example,globex.example', '(acme-lp.example)', 'mixed-case.example', 'ÜNÏCODE.EXAMPLE', 'example.com', 'yali.vc', ...HOSTILE,
  ]);

  if (name === 'getLPInvestmentByCompanySlug') return slugInputs(companySlugs);
  if (name === 'getLPQuarterlyReportBySlug' || name === 'getLPQuarterlyReportBySlugAdmin') return slugInputs(reportSlugs);
  if (name === 'getPortalUserByEmail') return emailRaw.map((e) => [e]);
  if (name === 'getDataroomDomainPrivilege') return domainRaw.map((d) => [d]);
  if (name === 'getLatestLPQuarterlyReport') return [[], [false], [true], [null], [0], [1], ['yes']];
  if (name === 'getLPQuarterUpdates') {
    const qs = ['Q1', 'Q2', 'Q3', 'Q4', 'q2'];
    const fys = ['FY24', 'FY25', 'FY26', 'FY27', 'FY9', 'FY10', 'fy26'];
    return uniq([
      ...qs.flatMap((q) => fys.map((f) => [q, f])),
      ['', ''], ['Q2', ''], ['', 'FY26'], ['Q2 ', 'FY26'], ['Q2', ' FY26'], ['Q2', 'FY2026'], ['Q2', '26'], ['Q9', 'FY26'],
      ['%', '%'], ['_2', 'FY2_'], ['*', '*'], ['(', ','], ['Ü', 'FY26'], ['Q2', LONG], [LONG, 'FY26'],
    ]);
  }
  if (spec.route && spec.kind === 'email') return uniq(emailRaw.map(normalize)).map((e) => [e]);
  if (spec.route && spec.kind === 'domain') {
    const fromEmails = emailRaw.map(normalize).filter((e) => e.includes('@')).map((e) => e.split('@')[1]);
    return uniq([...domainRaw.map(normalize), ...fromEmails]).map((d) => [d]);
  }
  return [[]]; // no-argument functions
}

// Param functions are fully exercised on `main`; on the other scenarios a small sample is enough.
export function sampleForScenario(inputs, scenario) {
  if (scenario === 'main' || inputs.length <= 7) return inputs;
  return inputs.slice(0, 3).concat(inputs.filter((i) => i.length && i[0] === ''));
}
