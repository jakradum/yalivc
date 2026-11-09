// Builds the synthetic fixture datasets (all names, emails and amounts are fake).
// Usage: node tests/parity/fixtures/build.mjs   -> writes tests/parity/fixtures/<scenario>.json
//
// Each scenario is a complete dataset (an array of published documents). Documents are
// written in DESCENDING _id order on purpose: the hosted API orders unordered results and
// breaks ties by _id ascending, so an implementation that relies on loader order fails.
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const hex = (label, n = 40) => createHash('sha1').update(label).digest('hex').slice(0, n);

// ---------- assets ----------
function fileAsset(label, ext, originalFilename) {
  const sha = hex('file:' + label);
  return {
    _id: `file-${sha}-${ext}`, _type: 'sanity.fileAsset', _createdAt: '2026-01-01T00:00:00Z', _updatedAt: '2026-01-01T00:00:00Z',
    url: `https://cdn.sanity.io/files/nt0wmty3/production/${sha}.${ext}`,
    originalFilename, extension: ext, mimeType: ext === 'pdf' ? 'application/pdf' : 'application/octet-stream',
    sha1hash: sha, size: 1000 + sha.charCodeAt(0), assetId: sha, path: `files/nt0wmty3/production/${sha}.${ext}`,
  };
}
function imageAsset(label, w, h, ext) {
  const hash = hex('image:' + label);
  return {
    _id: `image-${hash}-${w}x${h}-${ext}`, _type: 'sanity.imageAsset', _createdAt: '2026-01-01T00:00:00Z', _updatedAt: '2026-01-01T00:00:00Z',
    url: `https://cdn.sanity.io/images/nt0wmty3/production/${hash}-${w}x${h}.${ext}`,
    originalFilename: `${label}.${ext}`, extension: ext, mimeType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    sha1hash: hash, assetId: hash, metadata: { dimensions: { width: w, height: h, aspectRatio: w / h } },
  };
}
const fileRef = (asset) => ({ _type: 'file', asset: { _type: 'reference', _ref: asset._id } });
const imageRef = (asset) => ({ _type: 'image', asset: { _type: 'reference', _ref: asset._id } });
const danglingFile = (label) => ({ _type: 'file', asset: { _type: 'reference', _ref: `file-${hex('gone:' + label)}-pdf` } });
const danglingImage = (label) => ({ _type: 'image', asset: { _type: 'reference', _ref: `image-${hex('gone:' + label)}-64x64-png` } });
const ref = (id, key) => (key ? { _type: 'reference', _ref: id, _key: key } : { _type: 'reference', _ref: id });
const slug = (s) => ({ _type: 'slug', current: s });
const meta = (id, type) => ({ _id: id, _type: type, _createdAt: '2026-01-01T00:00:00Z', _updatedAt: '2026-02-01T00:00:00Z', _rev: 'rev-' + hex(id, 8) });
const block = (key, text, href) => ({
  _type: 'block', _key: key, style: 'normal', markDefs: href ? [{ _type: 'link', _key: key + 'l', href }] : [],
  children: href
    ? [{ _type: 'span', _key: key + 's1', text: text + ' ', marks: [] }, { _type: 'span', _key: key + 's2', text: 'see link', marks: [key + 'l'] }]
    : [{ _type: 'span', _key: key + 's1', text, marks: [] }],
});

const A = {
  logoAcme: imageAsset('acme-logo', 400, 120, 'png'),
  logoBeta: imageAsset('beta-logo', 300, 300, 'jpg'),
  logoZeta: imageAsset('zeta-logo', 200, 80, 'svg'),
  typefaceAcme: imageAsset('acme-typeface', 640, 160, 'png'),
  invLogo: imageAsset('northwind-logo', 128, 128, 'png'),
  photoJane: imageAsset('jane-photo', 800, 800, 'jpg'),
  photoZoe: imageAsset('zoe-photo', 600, 900, 'webp'),
  fundLogoLight: imageAsset('fund-logo-light', 500, 100, 'png'),
  pdfR1: fileAsset('report-fy26-q2', 'pdf', 'Fake Fund Report FY26 Q2.pdf'),
  pdfR1Fin: fileAsset('fin-fy26-q2', 'pdf', 'Financials FY26 Q2.pdf'),
  pdfR1Gift: fileAsset('gift-fy26-q2', 'pdf', 'GIFT City Financials FY26 Q2.pdf'),
  pdfR4: fileAsset('report-fy25-q4', 'pdf', 'Legacy Report FY25 Q4.pdf'),
  pdfR10: fileAsset('report-fy9-q1', 'pdf', 'Report FY9.pdf'),
  pdfInternal: fileAsset('report-fy26-q3', 'pdf', 'Internal Draft.pdf'),
  drd1: fileAsset('drd-1', 'pdf', 'Pipeline Summary.pdf'),
  drd2: fileAsset('drd-2', 'pdf', 'Pipeline Update (March).pdf'),
  drd3: fileAsset('drd-3', 'pdf', 'Restricted Memo.pdf'),
  drd4: fileAsset('drd-4', 'xlsx', 'Uncategorised, 100% fake.xlsx'),
  drd8: fileAsset('drd-8', 'pdf', 'Präsentation 2026.pdf'),
  drd9: fileAsset('drd-9', 'pdf', 'PPM_v2*final.pdf'),
  slideDeck: fileAsset('fund-i-deck', 'pdf', 'Fund I Deck.pdf'),
  thesis: fileAsset('fund-ii-thesis', 'pdf', 'Fund II Thesis.pdf'),
  rec1: fileAsset('recommendation-1', 'pdf', 'Recommendation Letter.pdf'),
};

// ---------- categories, investors, team, publications, news, pipeline ----------
const categories = [
  { ...meta('cat-robotics', 'category'), name: 'Robotics', slug: slug('robotics'), order: 1 },
  { ...meta('cat-bio', 'category'), name: 'Biotech & Health', slug: slug('biotech') },
  { ...meta('cat-noslug', 'category'), name: 'Ünclassified' },
];
const investors = [
  { ...meta('inv-1', 'investor'), name: 'Northwind Ventures', slug: slug('northwind'), type: 'vc', logo: imageRef(A.invLogo) },
  { ...meta('inv-2', 'investor'), name: 'Ünicorn Angels', type: 'angel' },
  { ...meta('inv-3', 'investor'), name: 'Globex Capital', type: 'family-office', logo: danglingImage('globex-logo') },
];
const team = [
  { ...meta('tm-1', 'teamMember'), name: 'Jane Doe', slug: slug('jane-doe'), role: 'Managing Partner', profileType: 'individual', photo: imageRef(A.photoJane), order: 1 },
  { ...meta('tm-2', 'teamMember'), name: 'Zoë Ångel', slug: slug('zoe-angel'), role: 'Partner', profileType: 'individual', photo: imageRef(A.photoZoe) },
  { ...meta('tm-3', 'teamMember'), name: 'alex lower', slug: slug('alex-lower'), role: 'Associate', profileType: 'individual' },
];
const publications = [{ ...meta('pub-1', 'publication'), name: 'The Daily Planet' }];
const news = [
  { ...meta('news-1', 'news'), headlineEdited: 'Acme Robotics raises a fake round', date: '2026-08-15', url: 'https://news.example/acme', publication: ref('pub-1'), isVideo: false },
  { ...meta('news-2', 'news'), headlineEdited: 'Beta Biotech exits (fictional)', date: '2026-09-01', url: 'https://news.example/beta', publication: ref('pub-gone') },
];
const pipeline = [
  { ...meta('pd-1', 'lpPipelineDeal'), companyName: 'Initrode Labs', sector: ref('cat-robotics'), proposedAmountINR: 50000000, stage: 'diligence', description: 'Fake pipeline deal one.' },
  { ...meta('pd-2', 'lpPipelineDeal'), companyName: 'Quantum Quail', sectorOverride: 'Quantum', stage: 'term-sheet' },
  { ...meta('pd-3', 'lpPipelineDeal'), companyName: 'Both Sector Co', sector: ref('cat-bio'), sectorOverride: 'Ignored Override', proposedAmountINR: 0, stage: 'screening', description: '' },
];

// ---------- companies ----------
const qu = (key, quarter, fiscalYear, flags = {}, extra = {}) => {
  const n = hex(key, 4);
  const v = parseInt(n, 16);
  return {
    _key: key, _type: 'quarterlyUpdate', quarter, fiscalYear,
    currentFMV: 1000000 + v, currentOwnershipPercent: 1 + (v % 20) / 2, amountReturned: v % 3 === 0 ? 0 : 5000 + v,
    multipleOfInvestment: 1 + (v % 50) / 10, revenueINR: 2000000 + v, patINR: -(v % 700), teamSize: 5 + (v % 40),
    roundMoics: [{ _key: key + 'm1', _type: 'roundMoic', roundName: 'Seed', moic: 2.5 }, { _key: key + 'm2', _type: 'roundMoic', roundName: 'Series A', moic: 1.1 }],
    tableFootnotes: [{ _key: key + 'f1', _type: 'footnote', tableType: 'portfolio', text: 'Fake footnote for ' + key }],
    updateNotes: [block(key + 'b1', 'Quarter note for ' + key + '.', 'https://example.com/' + key), block(key + 'b2', 'Second paragraph, no link.')],
    keyMetrics: [{ _key: key + 'k1', label: 'ARR', value: '₹1.2 Cr' }],
    ...flags, ...extra,
  };
};
const ALL_CONF = { currentFMVConfidential: true, currentOwnershipConfidential: true, amountReturnedConfidential: true, moicConfidential: true, revenueConfidential: true, patConfidential: true, teamSizeConfidential: true };
const NO_CONF = { currentFMVConfidential: false, currentOwnershipConfidential: false, amountReturnedConfidential: false, moicConfidential: false, revenueConfidential: false, patConfidential: false, teamSizeConfidential: false };
const round = (key, extra = {}) => ({
  _key: key, _type: 'investmentRound', isInitialRound: false, isYaliLead: false, showEarlyInReport: false,
  roundName: 'Seed', roundLabel: 'Seed', investmentDate: '2024-05-01', preMoneyValuation: 100000000,
  totalRoundSize: 20000000, postMoneyValuation: 120000000, yaliInvestment: 10000000, yaliOwnership: 8.33, ...extra,
});

const companies = [
  {
    ...meta('c-acme', 'company'), name: 'Acme Robotics', entityName: 'Acme Robotics Pvt Ltd (fake)', slug: slug('acme-robotics'),
    oneLiner: 'Fake robots for fake warehouses.', detail: 'Detail text.', aboutCompany: [block('ab1', 'About Acme.')],
    isRevenueMaking: true, logo: imageRef(A.logoAcme), logomarkTypeface: imageRef(A.typefaceAcme), link: 'https://acme.example',
    category: ref('cat-robotics'), investmentStatus: 'active', order: 1, showOnPartnerPortal: true,
    investmentDate: '2023-04-01', fundingRound: 'Seed', preMoneyValuation: 50, totalRoundSize: 10, postMoneyValuation: 60,
    yaliInvestmentAmount: 5, yaliOwnershipPercent: 8, coInvestors: [ref('inv-1', 'lc1'), ref('inv-gone', 'lc2')],
    investmentRounds: [
      round('acme-r2', { roundName: 'Series A', roundLabel: 'Series A', investmentDate: '2025-02-10', isYaliLead: true,
        coInvestors: [
          { _type: 'coInvestorEntry', _key: 'ce1', investor: ref('inv-2'), displayOrder: 2 },
          ref('inv-1', 'ce2'),
          { _type: 'coInvestorEntry', _key: 'ce3', investor: ref('inv-gone'), displayOrder: 1 },
          ref('inv-gone', 'ce4'),
          { _type: 'coInvestorEntry', _key: 'ce5', displayOrder: 3 },
          { _type: 'coInvestorEntry', _key: 'ce6', investor: ref('inv-3') },
        ] }),
      round('acme-r1', { isInitialRound: true, showEarlyInReport: true, investmentDate: '2023-04-01', coInvestors: [ref('inv-3', 'ce7')] }),
    ],
    quarterlyUpdates: [
      qu('acme-fy26q1', 'Q1', 'FY26', NO_CONF),
      qu('acme-fy26q2', 'Q2', 'FY26', ALL_CONF),
      qu('acme-fy25q4', 'Q4', 'FY25', { moicConfidential: true, revenueConfidential: true }),
      qu('acme-fy26q3', 'Q3', 'FY26', { currentFMVConfidential: true, currentOwnershipConfidential: false, teamSizeConfidential: null }),
    ],
  },
  {
    ...meta('c-beta', 'company'), name: 'beta Biotech', slug: slug('beta-biotech'), oneLiner: 'Fake biotech.', isRevenueMaking: false,
    logo: imageRef(A.logoBeta), category: ref('cat-bio'), investmentStatus: 'exited', exitDate: '2026-06-30', order: 2,
    investmentRounds: [
      round('beta-r1', { isInitialRound: true, investmentDate: '2022-11-11' }),
      round('beta-r0', { roundName: 'Bridge', investmentDate: undefined, coInvestors: [] }),
      round('beta-r2', { roundName: 'Series B', investmentDate: '2022-11-11', yaliInvestment: 0 }),
    ],
    quarterlyUpdates: [
      qu('beta-fy26q2', 'Q2', 'FY26', { amountReturnedConfidential: false }, { amountReturned: 99000000 }),
      qu('beta-fy26q1', 'Q1', 'FY26', { patConfidential: true }, { roundMoics: [] }),
    ],
  },
  {
    ...meta('c-gamma', 'company'), name: 'Gamma Grids', slug: slug('gamma-grids'), oneLiner: 'No updates yet.',
    investmentStatus: 'active', order: 2, investmentRounds: [round('gamma-r1', { isInitialRound: true, investmentDate: '2026-07-01' })],
  },
  {
    ...meta('c-delta', 'company'), name: 'Délta Dynamics', slug: slug('delta-dynamics'), oneLiner: 'Unicode name, no order.',
    category: ref('cat-gone'), investmentStatus: 'active', quarterlyUpdates: [],
  },
  {
    ...meta('c-epsilon', 'company'), name: 'epsilon Energy', slug: slug('epsilon-energy'), oneLiner: 'Dangling logo.',
    logo: danglingImage('epsilon-logo'), category: ref('cat-noslug'), investmentStatus: 'exited', showOnPartnerPortal: true,
    quarterlyUpdates: [qu('eps-fy26q2', 'Q2', 'FY26', { revenueConfidential: true }, { roundMoics: null, tableFootnotes: [], updateNotes: [] })],
  },
  {
    ...meta('c-zeta', 'company'), name: 'Zeta Zero', slug: slug('zeta-zero'), oneLiner: 'Hidden from the partner portal.',
    logo: imageRef(A.logoZeta), category: ref('cat-robotics'), investmentStatus: 'active', order: 3, showOnPartnerPortal: false,
    investmentRounds: [round('zeta-r1', { isInitialRound: true })],
    quarterlyUpdates: [qu('zeta-fy26q2', 'Q2', 'FY26', NO_CONF)],
  },
  {
    ...meta('c-eta', 'company'), name: 'Eta Earth', slug: slug('eta-earth'), oneLiner: 'No investment status.', order: 0,
    quarterlyUpdates: [qu('eta-fy26q2', 'Q2', 'FY26')],
  },
  {
    ...meta('c-theta', 'company'), name: 'Theta Thermal', slug: slug('theta-thermal'), oneLiner: 'Written off.',
    investmentStatus: 'written-off', order: 4, quarterlyUpdates: [qu('theta-fy26q2', 'Q2', 'FY26')],
  },
  {
    ...meta('c-iota', 'company'), name: 'Ångström Analytics', slug: slug('angstrom-analytics'), oneLiner: 'String-sorted fiscal years.',
    category: ref('cat-bio'), investmentStatus: 'active', showOnPartnerPortal: null,
    investmentRounds: [round('iota-r1', { investmentDate: '2025-12-31' }), round('iota-r2', { investmentDate: '2025-01-01', isInitialRound: true })],
    quarterlyUpdates: [
      qu('iota-fy27q1', 'Q1', 'FY27', NO_CONF),
      qu('iota-fy9q1', 'Q1', 'FY9', NO_CONF),
      qu('iota-fy26q2a', 'Q2', 'FY26', { moicConfidential: true }),
      qu('iota-fy26q2b', 'Q2', 'FY26', { moicConfidential: false }),
      qu('iota-fy10q4', 'Q4', 'FY10'),
    ],
  },
  {
    ...meta('c-kappa', 'company'), name: 'ACME Robotics Two', slug: slug('acme-robotics-2'), oneLiner: 'Ties with Acme on order.',
    investmentStatus: 'active', order: 1, showOnPartnerPortal: true,
    quarterlyUpdates: [
      qu('kappa-noq', undefined, 'FY26', NO_CONF),
      qu('kappa-nofy', 'Q3', undefined, NO_CONF),
      qu('kappa-fy26q1', 'Q1', 'FY26', NO_CONF),
    ],
  },
  {
    ...meta('c-lambda', 'company'), oneLiner: 'No name and no slug.', investmentStatus: 'active', order: 5,
    quarterlyUpdates: [qu('lambda-fy26q2', 'Q2', 'FY26', ALL_CONF)],
  },
  {
    ...meta('c-mu', 'company'), name: 'Mu Motors', slug: slug('mu-motors'), oneLiner: 'Ties with lambda on order.', investmentStatus: 'active', order: 5,
    category: ref('cat-robotics'), investmentRounds: [],
    quarterlyUpdates: [qu('mu-fy25q4', 'Q4', 'FY25')],
  },
  {
    ...meta('c-nu', 'company'), name: 'Nu Nano', slug: slug('nu-nano'), oneLiner: 'Fractional order.', investmentStatus: 'active', order: 1.5,
    quarterlyUpdates: [qu('nu-fy26q2', 'q2', 'fy26')],
  },
  {
    ...meta('c-xi', 'company'), name: 'Xi Status Case', slug: slug('Xi-Status'), oneLiner: 'Status in wrong case.', investmentStatus: 'Active', order: 6,
    quarterlyUpdates: [qu('xi-fy26q2', 'Q2', 'FY26')],
  },
  {
    ...meta('c-omicron', 'company'), name: 'Omicron Ops', slug: slug('omicron-ops'), oneLiner: 'Same slug as nothing else; dup slug test.', investmentStatus: 'active', order: 7,
    quarterlyUpdates: [qu('omi-fy26q2', 'Q2', 'FY26')],
  },
  {
    ...meta('c-omicron-0', 'company'), name: 'Omicron Duplicate', slug: slug('omicron-ops'), oneLiner: 'Second doc with the same slug.', investmentStatus: 'exited', order: 7,
  },
];
// strip undefined values (JSON would drop them anyway, but keep the source honest)
const clean = (v) => JSON.parse(JSON.stringify(v));

// ---------- reports ----------
const reportBase = (id, sl, quarter, fiscalYear, extra = {}) => ({
  ...meta(id, 'lpQuarterlyReport'), title: `Fake Fund Report ${fiscalYear ?? '?'} ${quarter ?? '?'}`, slug: sl === null ? undefined : slug(sl),
  quarter, fiscalYear, reportingDate: '2026-09-30', publishDate: '2026-10-15', ...extra,
});
const reports = [
  reportBase('r-1', 'fy26-q2', 'Q2', 'FY26', {
    visibility: 'published', subtitle: 'Half-year (fake)', coverNoteGreeting: 'Dear Partners,', coverNoteIntro: [block('ci1', 'Intro.')],
    investmentActivityNotes: [block('ia1', 'Activity.', 'https://example.com/activity')], portfolioHighlightsNotes: [], ecosystemNotes: [block('ec1', 'Eco.')],
    closingNotes: [block('cl1', 'Closing.')], signatory: ref('tm-1'), generatedPdf: fileRef(A.pdfR1), fundFinancialsPdf: fileRef(A.pdfR1Fin),
    giftCityFundFinancialsPdf: fileRef(A.pdfR1Gift), pipelineDeals: [ref('pd-1', 'p1'), ref('pd-2', 'p2'), ref('pd-gone', 'p3'), ref('pd-3', 'p4')],
    pipelineNotes: [block('pn1', 'Pipeline note.')], mediaFromNews: [ref('news-1', 'm1'), ref('news-gone', 'm2'), ref('news-2', 'm3')], mediaNotes: 'Media note.',
    portfolioSummaryFootnotes: [{ _key: 'psf1', text: 'Summary footnote.' }], snapshotData: '{"fake":true}', snapshotTimestamp: '2026-10-01T10:00:00Z',
  }),
  reportBase('r-2', 'fy26-q3', 'Q3', 'FY26', { visibility: 'internal', signatory: ref('tm-gone'), generatedPdf: fileRef(A.pdfInternal) }),
  reportBase('r-3', 'fy26-q4', 'Q4', 'FY26', { visibility: 'draft', generatedPdf: fileRef(A.pdfR1) }),
  reportBase('r-4', 'fy25-q4', 'Q4', 'FY25', { isPublished: true, generatedPdf: fileRef(A.pdfR4), signatory: ref('tm-2') }),
  reportBase('r-5', 'fy25-q3', 'Q3', 'FY25', { isPublished: false }),
  reportBase('r-6', 'fy26-q1', 'Q1', 'FY26', {}),
  reportBase('r-7', 'fy26-q2-reissue', 'Q2', 'FY26', { visibility: 'published', generatedPdf: danglingFile('r7-pdf'), fundFinancialsPdf: { _type: 'file' } }),
  reportBase('r-8', 'fy27-q1', 'Q1', 'FY27', { visibility: 'Published', generatedPdf: fileRef(A.pdfR1) }),
  reportBase('r-9', 'fy25-q2', 'Q2', 'FY25', { visibility: 'published', isPublished: false }),
  reportBase('r-10', 'fy9-q1', 'Q1', 'FY9', { visibility: 'internal', generatedPdf: fileRef(A.pdfR10) }),
  reportBase('r-0dup', 'fy26-q3', 'Q1', 'FY24', { visibility: 'published', title: 'Duplicate slug, lower _id' }),
  reportBase('r-11', null, 'Q2', 'FY24', { visibility: 'internal', title: 'No slug' }),
];

// ---------- portal users ----------
const pu = (id, email, extra = {}) => ({ ...meta(id, 'portalUser'), ...(email === undefined ? {} : { email }), name: 'Fake ' + id, ...extra });
const portalUsers = [
  pu('pu-1', 'lp1@example.com', { lpPortalAccess: true, investorDataRoomAccess: true, isGiftCityLP: false, noAccess: false, source: 'portal' }),
  pu('pu-2', 'LP2@Example.com', { lpPortalAccess: true, isGiftCityLP: true, investorDataRoomAccess: false }),
  pu('pu-2b', 'lp2@example.com', { lpPortalAccess: true, isGiftCityLP: false, investorDataRoomAccess: true }),
  pu('pu-3', 'legacy3@example.com', { isActive: true, dataRoomAccess: true }),
  pu('pu-4', 'blocked4@example.com', { noAccess: true, lpPortalAccess: true, investorDataRoomAccess: true }),
  pu('pu-5', 'dronly5@example.com', { lpPortalAccess: false, investorDataRoomAccess: true }),
  pu('pu-6', 'legacy6@example.com', { isActive: false }),
  pu('pu-7', 'legacy7@example.com', { lpPortalAccess: true, investorDataRoomAccess: false, dataRoomAccess: true }),
  pu('pu-8', 'invited8@example.com', { lpPortalAccess: true, investorDataRoomAccess: true, inviteCode: 'FAKE-1234', inviteCodeExpiry: '2099-01-01T00:00:00.000Z' }),
  pu('pu-9', 'expired9@example.com', { lpPortalAccess: true, inviteCode: 'FAKE-9999', inviteCodeExpiry: '2020-01-01T00:00:00.000Z' }),
  pu('pu-10', 'Åsa.Öberg@example.com', { lpPortalAccess: true, investorDataRoomAccess: true, isGiftCityLP: true }),
  pu('pu-11', 'İLKER@example.com', { lpPortalAccess: true, investorDataRoomAccess: true }),
  pu('pu-12', 'ΟΔΟΣ@example.com', { lpPortalAccess: true }),
  pu('pu-13', undefined, { lpPortalAccess: true }),
  pu('pu-14', 'lp+tag@example.com', { lpPortalAccess: true, dataRoomAccess: true }),
  pu('pu-15', 'under_score@example.com', { lpPortalAccess: true, investorDataRoomAccess: true }),
  pu('pu-16', 'percent%sign@example.com', { lpPortalAccess: true }),
  pu('pu-17', 'trailing17@example.com ', { lpPortalAccess: true }),
  pu('pu-18', 'lp18@example.com', { lpPortalAccess: true, noAccess: false }),
  pu('pu-19', 'domainuser@acme-lp.example', { noAccess: true }),
  pu('pu-20', 'okuser@acme-lp.example', { lpPortalAccess: false }),
  pu('pu-21', 'stringflag@example.com', { lpPortalAccess: 'true', isActive: true }),
  pu('pu-22', 'nullflag@example.com', { lpPortalAccess: null, isActive: true, investorDataRoomAccess: null, dataRoomAccess: true }),
  pu('pu-23', 'lp1@example.com', { lpPortalAccess: true, noAccess: true }),
  pu('pu-0', 'blocked4@example.com', { lpPortalAccess: true, investorDataRoomAccess: true }),
];

// ---------- domain privileges ----------
const dp = (id, domain, extra = {}) => ({ ...meta(id, 'domainPrivilege'), domain, label: 'Fake ' + id, ...extra });
const domains = [
  dp('dp-1', 'acme-lp.example', { lpPortalAccess: true, dataroomAccess: true, isActive: true, requireCode: false }),
  dp('dp-0', 'acme-lp.example', { lpPortalAccess: true, dataroomAccess: false, isActive: true, requireCode: true, inviteCode: 'ACME-SHARED', codeExpiry: '2099-12-31', maxUses: 3, usedCount: 1, redemptionLog: [{ _key: 'rl1', email: 'someone@acme-lp.example', redeemedAt: '2026-05-01T00:00:00Z' }] }),
  dp('dp-2', 'globex.example', { lpPortalAccess: true, dataroomAccess: true, isActive: true, requireCode: true, inviteCode: 'GLOBEX-2026', codeExpiry: '2099-01-01T00:00:00Z', maxUses: 10, usedCount: 3 }),
  dp('dp-3', 'initech.example', { lpPortalAccess: true, dataroomAccess: true, isActive: true, requireCode: true, inviteCode: 'INITECH-OLD', codeExpiry: '2020-01-01', maxUses: 5 }),
  dp('dp-4', 'umbrella.example', { lpPortalAccess: false, dataroomAccess: true, isActive: true, requireCode: true, inviteCode: 'UMB-FULL', codeExpiry: '2099-01-01', maxUses: 5, usedCount: 5 }),
  dp('dp-5', 'hooli.example', { lpPortalAccess: true, dataroomAccess: true, isActive: false, requireCode: true, inviteCode: 'HOOLI', codeExpiry: '2099-01-01', maxUses: 1 }),
  dp('dp-6', 'Mixed-Case.Example', { lpPortalAccess: true, dataroomAccess: true, isActive: true, requireCode: true, inviteCode: 'MIXED', codeExpiry: '2099-01-01', maxUses: 9, usedCount: 0 }),
  dp('dp-7', 'ünïcode.example', { lpPortalAccess: true, dataroomAccess: true, isActive: true, requireCode: false }),
  dp('dp-8', 'wayne.example', { dataroomAccess: true, isActive: true }),
  dp('dp-9', 'under_score.example', { lpPortalAccess: true, dataroomAccess: true, isActive: true, requireCode: true, inviteCode: 'US', codeExpiry: '2099-01-01', maxUses: 2, usedCount: 2 }),
  dp('dp-10', 'stark.example', { lpPortalAccess: 'true', dataroomAccess: true, isActive: true, requireCode: 'true' }),
  dp('dp-11', 'cyberdyne.example', { lpPortalAccess: true, dataroomAccess: true, requireCode: false }),
];

// ---------- data room ----------
const drd = (id, extra) => ({ ...meta(id, 'dataRoomDocument'), title: 'Fake doc ' + id, description: 'Description ' + id, ...extra });
const dataRoomDocs = [
  drd('drd-1', { category: 'pipeline', publishedAt: '2026-01-01', file: fileRef(A.drd1), accessLevel: 'data-room' }),
  drd('drd-2', { category: 'pipeline', publishedAt: '2026-03-01T09:30:00Z', file: fileRef(A.drd2), accessLevel: 'data-room' }),
  drd('drd-3', { category: 'pipeline', publishedAt: '2026-04-01', file: fileRef(A.drd3), accessLevel: 'restricted' }),
  drd('drd-4', { publishedAt: '2026-02-01', file: fileRef(A.drd4), accessLevel: 'data-room' }),
  drd('drd-5', { category: 'team', accessLevel: 'data-room' }),
  drd('drd-6', { category: 'team', publishedAt: '2025-12-01', file: danglingFile('drd-6'), accessLevel: 'data-room' }),
  drd('drd-7', { category: 'team', publishedAt: '2025-12-02', file: fileRef(A.drd1) }),
  drd('drd-8', { category: 'pipeline', publishedAt: '2026-01-01', file: fileRef(A.drd8), accessLevel: 'data-room' }),
  drd('drd-9', { category: 'ppm-agreements', publishedAt: '2024-06-01', file: fileRef(A.drd9), accessLevel: 'data-room', description: undefined }),
  drd('drd-10', { category: 'Pipeline', publishedAt: '2026-01-05', file: fileRef(A.drd2), accessLevel: 'data-room' }),
];
const tr = (id, extra) => ({ ...meta(id, 'trackRecord'), investeeName: 'Investee ' + id, investmentOrg: 'Org ' + id, sector: 'Fake sector',
  amountInvested: { currency: 'USD', value: 1000000 }, status: 'active', irr: '20%', ...extra });
const trackRecords = [
  tr('tr-1', { investor: ref('tm-1'), year: 2015 }),
  tr('tr-2', { investor: ref('tm-1'), year: 2019, status: 'exited', exitYear: 2023, exitAmountOrValuation: { currency: 'USD', value: 5000000 } }),
  tr('tr-3', { investor: ref('tm-2'), year: 2019 }),
  tr('tr-4', { investor: ref('tm-gone'), year: 2020 }),
  tr('tr-5', { year: 2018 }),
  tr('tr-6', { investor: ref('tm-3'), year: 2010 }),
  tr('tr-7', { investor: ref('tm-1') }),
  tr('tr-8', { investor: ref('tm-2'), year: 2019 }),
];

const perf = (quarter, fiscalYear, k) => ({ _key: `qp-${fiscalYear}-${quarter}-${k}`, quarter, fiscalYear, amountDrawnDown: 100 + k, totalInvested: 80 + k,
  fairMarketValue: 120 + k, amountReturned: k, moic: 1.5, tvpi: 1.4, dpi: 0.1 * k, rvpi: 1.3 });
const fundSettingsMain = {
  ...meta('lpFundSettings', 'lpFundSettings'), fundName: 'Fake Fund I', fundManagerName: 'Fake Managers LLP', fundManagerDescriptor: 'Investment Manager',
  tagline: 'Deep tech, fake money.', firstCloseDate: '2022-01-15', finalCloseDate: '2023-06-30', fundSizeAtClose: 5000000000,
  targetFundSizeINR: 6000000000, targetFundSizeUSD: 75000000, investmentStrategy: [block('is1', 'Strategy.')],
  focusSectors: [ref('cat-robotics', 'fs1'), ref('cat-gone', 'fs2'), ref('cat-bio', 'fs3')],
  investorRelationsEmail: 'ir@fakefund.example', additionalContacts: [{ _key: 'ac1', name: 'Ops', email: 'ops@fakefund.example' }],
  website: 'https://fakefund.example', logoLight: imageRef(A.fundLogoLight), logoDark: danglingImage('fund-logo-dark'),
  quarterlyPerformance: [perf('Q4', 'FY9', 1), perf('Q1', 'FY10', 2), perf('Q4', 'FY26', 3), perf('Q2', 'FY27', 4), perf('Q5', 'FY27', 5), perf('Q2', 'FY27', 6), perf('Q1', 'FY27', 7)],
};
const fundContentMain = {
  ...meta('dataroomFundContent', 'dataroomFundContent'), fundISlideDeck: fileRef(A.slideDeck), fundILpReport: ref('r-1'),
  commonTeamMembers: [ref('tm-1', 'ct1'), ref('tm-gone', 'ct2'), ref('tm-2', 'ct3')], commonTrackRecord: danglingFile('track-record'),
  commonRecommendationDocuments: [{ _key: 'rd1', title: 'Recommendation (fake)', file: fileRef(A.rec1) }, { _key: 'rd2', title: 'No file yet' }, { _key: 'rd3', file: fileRef(A.thesis) }],
  exitValueAsOfDate: 'Sept 2026', hiddenFunds: ['fund-ii'],
};

const assets = Object.values(A);
const main = clean([...assets, ...categories, ...investors, ...team, ...publications, ...news, ...pipeline, ...companies, ...reports,
  ...portalUsers, ...domains, ...dataRoomDocs, ...trackRecords, fundSettingsMain, fundContentMain]);

// alt: two lpFundSettings docs (the lower _id has an empty performance array), a sparse fund content doc
const alt = clean([
  { ...meta('lpFundSettings-a', 'lpFundSettings'), fundName: 'Alt Fund A', quarterlyPerformance: [] },
  { ...fundSettingsMain, _id: 'lpFundSettings-b', fundName: 'Alt Fund B' },
  { ...meta('dataroomFundContent', 'dataroomFundContent'), fundILpReport: ref('r-gone'), hiddenFunds: [], commonTeamMembers: [], fundIIThesisPresentation: fileRef(A.thesis) },
  A.thesis,
  reportBase('r-1', 'fy26-q2', 'Q2', 'FY26', { visibility: 'internal' }),
  reportBase('r-2', 'fy27-q1', 'Q1', 'FY27', { visibility: 'published' }),
  // missing quarter/fiscalYear sorts FIRST under order(... desc) on the hosted API, so this wins "latest"
  reportBase('r-12', 'no-period', undefined, undefined, { visibility: 'published', title: 'No quarter or fiscal year' }),
  { ...meta('c-solo', 'company'), name: 'Solo Co', slug: slug('solo'), investmentStatus: 'active' },
]);
// perf-throws: an entry without fiscalYear makes the original getDataRoomFundPerformance throw a TypeError
const perfThrows = clean([
  { ...meta('lpFundSettings', 'lpFundSettings'), fundName: 'Throwing Fund', quarterlyPerformance: [perf('Q1', 'FY26', 1), { _key: 'nofy', quarter: 'Q2', moic: 1 }] },
]);
// perf-single: one entry without fiscalYear (sort never calls the comparator, so no throw), plus a lone unknown quarter
const perfSingle = clean([
  { ...meta('lpFundSettings', 'lpFundSettings'), fundName: 'Single Fund', quarterlyPerformance: [{ _key: 'only', quarter: 'Q9', moic: 2 }] },
]);

// fund-lp-internal: the data room fund content points at an INTERNAL report; its title and PDF must not show
const fundLpInternal = clean([
  { ...meta('dataroomFundContent', 'dataroomFundContent'), fundILpReport: ref('r-2') },
  reportBase('r-2', 'fy26-q3', 'Q3', 'FY26', { visibility: 'internal', generatedPdf: fileRef(A.pdfInternal) }),
  A.pdfInternal,
]);
// fund-lp-legacy: it points at a legacy published report (isPublished true, no visibility), which does show
const fundLpLegacy = clean([
  { ...meta('dataroomFundContent', 'dataroomFundContent'), fundILpReport: ref('r-4') },
  reportBase('r-4', 'fy25-q4', 'Q4', 'FY25', { isPublished: true, generatedPdf: fileRef(A.pdfR4) }),
  A.pdfR4,
]);

const SCENARIOS = { main, empty: [], alt, 'perf-throws': perfThrows, 'perf-single': perfSingle, 'fund-lp-internal': fundLpInternal, 'fund-lp-legacy': fundLpLegacy };
for (const [name, docs] of Object.entries(SCENARIOS)) {
  const ids = docs.map((d) => d._id);
  if (new Set(ids).size !== ids.length) throw new Error(`duplicate _id in ${name}`);
  docs.sort((a, b) => (a._id < b._id ? 1 : a._id > b._id ? -1 : 0)); // descending on purpose
  writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(docs, null, 1) + '\n');
  console.log(`${name}.json: ${docs.length} docs`);
}
