// Supabase versions of the LP portal and data room reads. Each one reproduces the
// GROQ query of the same name in src/lib/sanity-queries.js (or the route query it
// replaces) field for field; the GROQ is quoted above each function. Documents
// come only from the doc loader (see loader.js); semantics helpers in groq.js.
import {
  attr, raw, eq, inList, lower, unlessTrue, coalesce, defined, order, arr, mapProj, count, needParam, isObj,
} from './groq.js';
import { Ctx } from './context.js';

const PORTAL = 'partners';
const DATAROOM = 'dataroom';

const first = (list) => (list.length ? list[0] : null);
const slugOf = (v) => attr(v, 'slug', 'current');

// ── shared filters ──────────────────────────────────────────────────────────

// investmentStatus in ["active", "exited"] && showOnPartnerPortal != false
const onPortal = (c) => inList(c.investmentStatus, ['active', 'exited']) && c.showOnPartnerPortal !== false;

// visibility in ["internal", "published"] || (isPublished == true && !defined(visibility))
const visAny = (r) => inList(r.visibility, ['internal', 'published']) || (r.isPublished === true && !defined(r.visibility));
// visibility == "published" || (isPublished == true && !defined(visibility))
const visPublished = (r) => eq(r.visibility, 'published') || (r.isPublished === true && !defined(r.visibility));
// coalesce(visibility, select(isPublished == true => "published", "draft"))
const visibilityOf = (r) => coalesce(r.visibility, r.isPublished === true ? 'published' : 'draft');

// order(fiscalYear desc, quarter desc)
const byPeriodDesc = (list) => order(list, [[(x) => attr(x, 'fiscalYear'), 'desc'], [(x) => attr(x, 'quarter'), 'desc']]);
// order(investmentDate asc)
const byInvestmentDate = (list) => order(list, [[(x) => attr(x, 'investmentDate'), 'asc']]);
// order(order asc)
const byOrder = (list) => order(list, [[(x) => x.order, 'asc']]);

// ── quarterly update projections ───────────────────────────────────────────

// Confidential flags null the value: "x": select(xConfidential == true => null, x)
const QU_SELECT = {
  currentFMV: 'currentFMVConfidential',
  currentOwnershipPercent: 'currentOwnershipConfidential',
  amountReturned: 'amountReturnedConfidential',
  multipleOfInvestment: 'moicConfidential',
  roundMoics: 'moicConfidential',
  revenueINR: 'revenueConfidential',
  patINR: 'patConfidential',
  teamSize: 'teamSizeConfidential',
};
const quProj = (keys) => (u) => {
  const o = {};
  for (const k of keys) o[k] = QU_SELECT[k] ? unlessTrue(u[QU_SELECT[k]], u[k]) : raw(u[k]);
  return o;
};

const QU_FULL = quProj([
  'quarter', 'fiscalYear', 'currentFMV', 'currentFMVConfidential', 'currentOwnershipPercent', 'currentOwnershipConfidential',
  'amountReturned', 'amountReturnedConfidential', 'multipleOfInvestment', 'moicConfidential', 'roundMoics', 'tableFootnotes',
  'updateNotes', 'revenueINR', 'revenueConfidential', 'patINR', 'patConfidential', 'teamSize', 'teamSizeConfidential', 'keyMetrics',
]);
const QU_PDF = quProj([
  'quarter', 'fiscalYear', 'currentFMV', 'currentFMVConfidential', 'currentOwnershipPercent', 'currentOwnershipConfidential',
  'amountReturned', 'amountReturnedConfidential', 'multipleOfInvestment', 'moicConfidential', 'tableFootnotes', 'updateNotes',
  'revenueINR', 'revenueConfidential', 'patINR', 'patConfidential', 'teamSize', 'teamSizeConfidential', 'keyMetrics', 'roundMoics',
]);
const QU_PDF_LATEST = quProj([
  'quarter', 'fiscalYear', 'currentFMV', 'currentOwnershipPercent', 'amountReturned', 'multipleOfInvestment', 'tableFootnotes',
  'updateNotes', 'revenueINR', 'patINR', 'teamSize', 'teamSizeConfidential', 'keyMetrics', 'roundMoics',
]);
const QU_QUARTER = quProj([
  'quarter', 'fiscalYear', 'currentFMV', 'currentFMVConfidential', 'currentOwnershipPercent', 'currentOwnershipConfidential',
  'amountReturned', 'amountReturnedConfidential', 'multipleOfInvestment', 'moicConfidential', 'updateNotes', 'revenueINR',
  'revenueConfidential', 'patINR', 'patConfidential', 'teamSize', 'teamSizeConfidential', 'keyMetrics',
]);
const QU_DATAROOM = quProj([
  'quarter', 'fiscalYear', 'currentFMV', 'currentFMVConfidential', 'multipleOfInvestment', 'moicConfidential',
  'revenueINR', 'revenueConfidential', 'teamSize', 'teamSizeConfidential',
]);

// "quarterlyUpdates": quarterlyUpdates[] | order(fiscalYear desc, quarter desc) {...}
const updatesSorted = (c, proj) => {
  const a = arr(c.quarterlyUpdates);
  return a ? byPeriodDesc(a).map((u) => (isObj(u) ? proj(u) : null)) : null;
};
// "latestQuarter": quarterlyUpdates[] | order(fiscalYear desc, quarter desc)[0] {...}
const latestUpdate = (c, proj) => {
  const a = arr(c.quarterlyUpdates);
  if (!a || !a.length) return null;
  const u = byPeriodDesc(a)[0];
  return isObj(u) ? proj(u) : null;
};

// ── investment rounds ──────────────────────────────────────────────────────

// select(_type == "reference" => @->X, investor->X): the co-investor document
const coInvestorDoc = (ctx, e) => (e._type === 'reference' ? ctx.deref(e) : ctx.deref(e.investor));

const ROUND_KEYS = [
  'isInitialRound', 'isYaliLead', 'showEarlyInReport', 'roundName', 'roundLabel', 'investmentDate',
  'preMoneyValuation', 'totalRoundSize', 'postMoneyValuation', 'yaliInvestment', 'yaliOwnership',
];
const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, raw(o[k])]));

// "coInvestors": coInvestors[]{ "displayOrder": displayOrder, "_id": ..., "name": ..., "type": ... }
const roundListProj = (ctx) => (r) => ({
  ...pick(r, ROUND_KEYS),
  coInvestors: mapProj(r.coInvestors, (e) => {
    const inv = coInvestorDoc(ctx, e);
    return { displayOrder: raw(e.displayOrder), _id: attr(inv, '_id'), name: attr(inv, 'name'), type: attr(inv, 'type') };
  }),
});

// company page variant: adds logo, displayOrder only for coInvestorEntry
const roundDetailProj = (ctx) => (r) => ({
  ...pick(r, ROUND_KEYS),
  coInvestors: mapProj(r.coInvestors, (e) => {
    const inv = coInvestorDoc(ctx, e);
    return {
      _id: attr(inv, '_id'),
      name: attr(inv, 'name'),
      type: attr(inv, 'type'),
      logo: ctx.assetUrl(attr(inv, 'logo', 'asset')),
      displayOrder: e._type === 'coInvestorEntry' ? raw(e.displayOrder) : null,
    };
  }),
});

// "investmentRounds": investmentRounds[] | order(investmentDate asc) {...}
const roundsSorted = (c, proj) => {
  const a = arr(c.investmentRounds);
  return a ? byInvestmentDate(a).map((r) => (isObj(r) ? proj(r) : null)) : null;
};

// Load what company projections dereference: category, logo, co-investors
// (depth 2 also reaches the co-investors' logo assets).
const loadCompanyRefs = (ctx, companies, depth = 1) =>
  ctx.load(companies.map((c) => [c.category, c.logo, c.logomarkTypeface, arr(c.investmentRounds)?.map((r) => attr(r, 'coInvestors'))]), depth);

// ── portal reads ───────────────────────────────────────────────────────────

/* *[_type == "lpFundSettings"][0]{ fundName, ..., focusSectors[]->{_id, name, "slug": slug.current},
   ..., "logoLight": logoLight.asset->url, "logoDark": logoDark.asset->url, quarterlyPerformance[] {...} } */
const PERF_KEYS = ['quarter', 'fiscalYear', 'amountDrawnDown', 'totalInvested', 'fairMarketValue', 'amountReturned', 'moic', 'tvpi', 'dpi', 'rvpi'];
const perfProj = (s) => mapProj(s.quarterlyPerformance, (p) => pick(p, PERF_KEYS));

export async function getLPFundSettings() {
  const ctx = new Ctx(PORTAL);
  const s = first(await ctx.type('lpFundSettings'));
  if (!s) return null;
  await ctx.load([s.focusSectors, s.logoLight, s.logoDark]);
  return {
    ...pick(s, ['fundName', 'fundManagerName', 'fundManagerDescriptor', 'tagline', 'firstCloseDate', 'finalCloseDate',
      'fundSizeAtClose', 'targetFundSizeINR', 'targetFundSizeUSD', 'investmentStrategy']),
    focusSectors: arr(s.focusSectors)
      ? s.focusSectors.map((ref) => {
        const d = ctx.deref(ref);
        return d ? { _id: raw(d._id), name: raw(d.name), slug: slugOf(d) } : null;
      })
      : null,
    investorRelationsEmail: raw(s.investorRelationsEmail),
    additionalContacts: raw(s.additionalContacts),
    website: raw(s.website),
    logoLight: ctx.assetUrl(attr(s, 'logoLight', 'asset')),
    logoDark: ctx.assetUrl(attr(s, 'logoDark', 'asset')),
    quarterlyPerformance: perfProj(s),
  };
}

const companyListHead = (ctx, c) => ({
  _id: raw(c._id),
  name: raw(c.name),
  entityName: raw(c.entityName),
  slug: slugOf(c),
  oneLiner: raw(c.oneLiner),
  detail: raw(c.detail),
  aboutCompany: raw(c.aboutCompany),
  isRevenueMaking: raw(c.isRevenueMaking),
  logo: ctx.assetUrl(attr(c, 'logo', 'asset')),
  link: raw(c.link),
  sector: attr(ctx.deref(c.category), 'name'),
  sectorSlug: attr(ctx.deref(c.category), 'slug', 'current'),
  investmentStatus: raw(c.investmentStatus),
  exitDate: raw(c.exitDate),
  showExitEarlyInReport: raw(c.showExitEarlyInReport),
  order: raw(c.order),
});

/* *[_type == "company" && investmentStatus in ["active", "exited"] && showOnPartnerPortal != false] | order(order asc) {...} */
export async function getLPInvestments() {
  const ctx = new Ctx(PORTAL);
  const companies = byOrder((await ctx.type('company')).filter(onPortal));
  await loadCompanyRefs(ctx, companies);
  return companies.map((c) => ({
    ...companyListHead(ctx, c),
    investmentRounds: roundsSorted(c, roundListProj(ctx)),
    quarterlyUpdates: updatesSorted(c, QU_FULL),
    latestQuarter: latestUpdate(c, QU_FULL),
  }));
}

export async function getLPInvestmentsForPdf() {
  const ctx = new Ctx(PORTAL);
  const companies = byOrder((await ctx.type('company')).filter(onPortal));
  await loadCompanyRefs(ctx, companies);
  return companies.map((c) => ({
    ...companyListHead(ctx, c),
    investmentRounds: roundsSorted(c, roundListProj(ctx)),
    quarterlyUpdates: updatesSorted(c, QU_PDF),
    latestQuarter: latestUpdate(c, QU_PDF_LATEST),
  }));
}

/* *[_type == "company" && slug.current == $companySlug && <onPortal>][0]{...} */
export async function getLPInvestmentByCompanySlug(companySlug) {
  needParam('companySlug', companySlug);
  const ctx = new Ctx(PORTAL);
  const c = first((await ctx.type('company')).filter((d) => eq(slugOf(d), companySlug) && onPortal(d)));
  if (!c) return null;
  await loadCompanyRefs(ctx, [c], 2);
  return {
    _id: raw(c._id),
    name: raw(c.name),
    entityName: raw(c.entityName),
    slug: slugOf(c),
    oneLiner: raw(c.oneLiner),
    detail: raw(c.detail),
    aboutCompany: raw(c.aboutCompany),
    isRevenueMaking: raw(c.isRevenueMaking),
    logo: ctx.assetUrl(attr(c, 'logo', 'asset')),
    logomarkTypeface: ctx.assetUrl(attr(c, 'logomarkTypeface', 'asset')),
    link: raw(c.link),
    sector: attr(ctx.deref(c.category), 'name'),
    ...pick(c, ['investmentDate', 'fundingRound', 'preMoneyValuation', 'totalRoundSize', 'postMoneyValuation',
      'yaliInvestmentAmount', 'yaliOwnershipPercent', 'coInvestors', 'investmentStatus', 'exitDate', 'showExitEarlyInReport']),
    investmentRounds: roundsSorted(c, roundDetailProj(ctx)),
    quarterlyUpdates: updatesSorted(c, QU_FULL),
    latestQuarter: latestUpdate(c, QU_FULL),
  };
}

/* *[_type == "company" && <onPortal> && count(quarterlyUpdates[quarter == $quarter && fiscalYear == $fiscalYear]) > 0] | order(order asc) {...} */
export async function getLPQuarterUpdates(quarter, fiscalYear) {
  needParam('quarter', quarter);
  needParam('fiscalYear', fiscalYear);
  const ctx = new Ctx(PORTAL);
  const matches = (c) => (arr(c.quarterlyUpdates) || []).filter((u) => eq(attr(u, 'quarter'), quarter) && eq(attr(u, 'fiscalYear'), fiscalYear));
  const companies = byOrder((await ctx.type('company')).filter((c) => onPortal(c) && count(arr(c.quarterlyUpdates) && matches(c)) > 0));
  await ctx.load(companies.map((c) => [c.category, c.logo]));
  return companies.map((c) => {
    const u = first(matches(c));
    return {
      _id: raw(c._id),
      name: raw(c.name),
      slug: slugOf(c),
      logo: ctx.assetUrl(attr(c, 'logo', 'asset')),
      sector: attr(ctx.deref(c.category), 'name'),
      ...pick(c, ['investmentDate', 'fundingRound', 'yaliInvestmentAmount', 'yaliOwnershipPercent', 'coInvestors']),
      quarterUpdate: isObj(u) ? QU_QUARTER(u) : null,
    };
  });
}

/* *[_type == "company" && <onPortal>] | order(order asc, name asc) { "slug": slug.current, name, investmentStatus, exitDate,
   "investmentRounds": investmentRounds[] | order(investmentDate asc) { isInitialRound, investmentDate },
   "quarterlyUpdates": quarterlyUpdates[]{ quarter, fiscalYear } } */
export async function getAllLPInvestmentSlugs() {
  const ctx = new Ctx(PORTAL);
  const companies = order((await ctx.type('company')).filter(onPortal), [[(c) => c.order, 'asc'], [(c) => c.name, 'asc']]);
  await ctx.load(companies.map((c) => c.logo));
  return companies.map((c) => ({
    slug: slugOf(c),
    name: raw(c.name),
    logo: ctx.assetUrl(attr(c, 'logo', 'asset')),
    investmentStatus: raw(c.investmentStatus),
    exitDate: raw(c.exitDate),
    showExitEarlyInReport: raw(c.showExitEarlyInReport),
    investmentRounds: roundsSorted(c, (r) => pick(r, ['isInitialRound', 'investmentDate'])),
    quarterlyUpdates: mapProj(c.quarterlyUpdates, (u) => pick(u, ['quarter', 'fiscalYear'])),
  }));
}

// signatory->{ _id, name, slug, role, profileType, "photo": photo.asset->url }
const signatoryProj = (ctx, r) => {
  const d = ctx.deref(r.signatory);
  return d ? { ...pick(d, ['_id', 'name', 'slug', 'role', 'profileType']), photo: ctx.assetUrl(attr(d, 'photo', 'asset')) } : null;
};
// pipelineDeals[]->{ _id, companyName, "sector": coalesce(sector->name, sectorOverride), proposedAmountINR, stage, description }
const pipelineProj = (ctx, r) => (arr(r.pipelineDeals)
  ? r.pipelineDeals.map((ref) => {
    const d = ctx.deref(ref);
    return d ? {
      _id: raw(d._id), companyName: raw(d.companyName), sector: coalesce(attr(ctx.deref(d.sector), 'name'), d.sectorOverride),
      proposedAmountINR: raw(d.proposedAmountINR), stage: raw(d.stage), description: raw(d.description),
    } : null;
  })
  : null);
// mediaFromNews[]->{ _id, headlineEdited, date, url, "publicationName": publication->name }
const mediaProj = (ctx, r) => (arr(r.mediaFromNews)
  ? r.mediaFromNews.map((ref) => {
    const d = ctx.deref(ref);
    return d ? { ...pick(d, ['_id', 'headlineEdited', 'date', 'url']), publicationName: attr(ctx.deref(d.publication), 'name') } : null;
  })
  : null);
const loadReportRefs = (ctx, r) => ctx.load([r.signatory, r.pipelineDeals, r.mediaFromNews, r.generatedPdf, r.fundFinancialsPdf, r.giftCityFundFinancialsPdf], 2);

const NOTES = ['coverNoteGreeting', 'coverNoteIntro', 'investmentActivityNotes', 'portfolioHighlightsNotes', 'ecosystemNotes', 'closingNotes'];

/* *[_type == "lpQuarterlyReport" && slug.current == $slug && <visAny>][0]{...} */
export async function getLPQuarterlyReportBySlug(slug) {
  needParam('slug', slug);
  const ctx = new Ctx(PORTAL);
  const r = first((await ctx.type('lpQuarterlyReport')).filter((d) => eq(slugOf(d), slug) && visAny(d)));
  if (!r) return null;
  await loadReportRefs(ctx, r);
  return {
    _id: raw(r._id),
    title: raw(r.title),
    slug: slugOf(r),
    ...pick(r, ['quarter', 'fiscalYear', 'reportingDate', 'publishDate']),
    visibility: visibilityOf(r),
    ...pick(r, NOTES),
    signatory: signatoryProj(ctx, r),
    pdfUrl: ctx.assetUrl(attr(r, 'generatedPdf', 'asset')),
    fundFinancialsPdfUrl: ctx.assetUrl(attr(r, 'fundFinancialsPdf', 'asset')),
    giftCityFundFinancialsPdfUrl: ctx.assetUrl(attr(r, 'giftCityFundFinancialsPdf', 'asset')),
    pipelineDeals: pipelineProj(ctx, r),
    pipelineNotes: raw(r.pipelineNotes),
    mediaFromNews: mediaProj(ctx, r),
    mediaNotes: raw(r.mediaNotes),
    mediaFeature: raw(r.mediaFeature),
    portfolioSummaryFootnotes: raw(r.portfolioSummaryFootnotes),
    fundSummaryFootnotes: raw(r.fundSummaryFootnotes),
  };
}

/* *[_type == "lpQuarterlyReport" && slug.current == $slug][0]{...} (no visibility filter) */
export async function getLPQuarterlyReportBySlugAdmin(slug) {
  needParam('slug', slug);
  const ctx = new Ctx(PORTAL);
  const r = first((await ctx.type('lpQuarterlyReport')).filter((d) => eq(slugOf(d), slug)));
  if (!r) return null;
  await loadReportRefs(ctx, r);
  return {
    _id: raw(r._id),
    title: raw(r.title),
    subtitle: raw(r.subtitle),
    slug: slugOf(r),
    ...pick(r, ['quarter', 'fiscalYear', 'reportingDate', 'publishDate']),
    ...pick(r, NOTES),
    signatory: signatoryProj(ctx, r),
    pipelineDeals: pipelineProj(ctx, r),
    pipelineNotes: raw(r.pipelineNotes),
    mediaFromNews: mediaProj(ctx, r),
    mediaNotes: raw(r.mediaNotes),
    mediaFeature: raw(r.mediaFeature),
    portfolioSummaryFootnotes: raw(r.portfolioSummaryFootnotes),
    fundSummaryFootnotes: raw(r.fundSummaryFootnotes),
    snapshotData: raw(r.snapshotData),
    snapshotTimestamp: raw(r.snapshotTimestamp),
  };
}

/* *[_type == "lpQuarterlyReport" && <visAny or visPublished>] | order(fiscalYear desc, quarter desc)[0] {...} */
export async function getLatestLPQuarterlyReport(includeInternal = false) {
  const ctx = new Ctx(PORTAL);
  const r = first(byPeriodDesc((await ctx.type('lpQuarterlyReport')).filter(includeInternal ? visAny : visPublished)));
  if (!r) return null;
  await ctx.load([r.generatedPdf]);
  return {
    _id: raw(r._id),
    title: raw(r.title),
    slug: slugOf(r),
    ...pick(r, ['quarter', 'fiscalYear', 'reportingDate', 'publishDate']),
    visibility: visibilityOf(r),
    pdfUrl: ctx.assetUrl(attr(r, 'generatedPdf', 'asset')),
  };
}

/* *[_type == "lpQuarterlyReport" && <visAny>] | order(fiscalYear desc, quarter desc) {...} */
export async function getAvailableLPQuarters() {
  const ctx = new Ctx(PORTAL);
  const reports = byPeriodDesc((await ctx.type('lpQuarterlyReport')).filter(visAny));
  await ctx.load(reports.map((r) => r.generatedPdf));
  return reports.map((r) => ({
    _id: raw(r._id),
    title: raw(r.title),
    slug: slugOf(r),
    ...pick(r, ['quarter', 'fiscalYear', 'publishDate']),
    visibility: visibilityOf(r),
    pdfUrl: ctx.assetUrl(attr(r, 'generatedPdf', 'asset')),
  }));
}

/* *[_type == "portalUser" && lower(email) == $email && noAccess != true && (lpPortalAccess == true || (!defined(lpPortalAccess) && isActive == true))][0]{...} */
const lpPortalActive = (u) => u.noAccess !== true && (u.lpPortalAccess === true || (!defined(u.lpPortalAccess) && u.isActive === true));
const dataroomActive = (u) => u.noAccess !== true && (u.investorDataRoomAccess === true || (u.dataRoomAccess === true && !defined(u.investorDataRoomAccess)));

async function findUser(email, pred) {
  needParam('email', email);
  const ctx = new Ctx(PORTAL);
  return first((await ctx.type('portalUser')).filter((u) => eq(lower(u.email), email) && pred(u)));
}

export async function getPortalUserByEmail(email) {
  if (!email) return null;
  const u = await findUser(email.toLowerCase(), lpPortalActive);
  return u ? pick(u, ['_id', 'email', 'name', 'isGiftCityLP', 'lpPortalAccess', 'investorDataRoomAccess']) : null;
}

// ── data room reads ────────────────────────────────────────────────────────

/* *[_type == "lpQuarterlyReport" && <visPublished>] | order(fiscalYear desc, quarter desc)[0] { _id, title, quarter, fiscalYear, "pdfUrl": generatedPdf.asset->url } */
export async function getLatestLPReportForDataRoom() {
  const ctx = new Ctx(DATAROOM);
  const r = first(byPeriodDesc((await ctx.type('lpQuarterlyReport')).filter(visPublished)));
  if (!r) return null;
  await ctx.load([r.generatedPdf]);
  return { ...pick(r, ['_id', 'title', 'quarter', 'fiscalYear']), pdfUrl: ctx.assetUrl(attr(r, 'generatedPdf', 'asset')) };
}

/* *[_type == "domainPrivilege" && domain == $domain && dataroomAccess == true && isActive == true][0]{ _id } */
export async function getDataroomDomainPrivilege(domain) {
  if (!domain) return null;
  const ctx = new Ctx(DATAROOM);
  const d = first((await ctx.type('domainPrivilege')).filter((p) => eq(p.domain, domain) && p.dataroomAccess === true && p.isActive === true));
  return d ? { _id: raw(d._id) } : null;
}

/* *[_type == "dataroomFundContent"][0] {..., "fundILpReport": *[_id == ^.fundILpReport._ref && <visPublished>][0]{...}, ...} */
export async function getDataroomFundContent() {
  const ctx = new Ctx(DATAROOM);
  const f = first(await ctx.type('dataroomFundContent'));
  if (!f) return null;
  await ctx.load([f.fundISlideDeck, f.fundILpReport, f.fundIIThesisPresentation, f.commonTeamMembers, f.commonTrackRecord,
    arr(f.commonRecommendationDocuments)?.map((d) => attr(d, 'file'))], 2);
  // Only a published report (an internal one's title and PDF must not reach the data room).
  const lp = ctx.deref(f.fundILpReport);
  const lpOk = lp && visPublished(lp);
  return {
    fundISlideDeckUrl: ctx.assetUrl(attr(f, 'fundISlideDeck', 'asset')),
    fundILpReport: lpOk
      ? { ...pick(lp, ['_id', 'title', 'quarter', 'fiscalYear']), pdfUrl: ctx.assetUrl(attr(lp, 'generatedPdf', 'asset')) }
      : null,
    fundIIThesisPresentationUrl: ctx.assetUrl(attr(f, 'fundIIThesisPresentation', 'asset')),
    commonTeamMembers: arr(f.commonTeamMembers)
      ? f.commonTeamMembers.map((ref) => {
        const d = ctx.deref(ref);
        return d ? { _id: raw(d._id), name: raw(d.name), slug: slugOf(d) } : null;
      })
      : null,
    commonTrackRecordUrl: ctx.assetUrl(attr(f, 'commonTrackRecord', 'asset')),
    commonRecommendationDocuments: mapProj(f.commonRecommendationDocuments, (d) => ({
      title: raw(d.title),
      fileUrl: ctx.assetUrl(attr(d, 'file', 'asset')),
    })),
    exitValueAsOfDate: raw(f.exitValueAsOfDate),
    hiddenFunds: raw(f.hiddenFunds),
  };
}

/* *[_type == "dataRoomDocument" && accessLevel == "data-room"] | order(category asc, publishedAt desc) {...} */
export async function getDataRoomDocuments() {
  const ctx = new Ctx(DATAROOM);
  const docs = order((await ctx.type('dataRoomDocument')).filter((d) => eq(d.accessLevel, 'data-room')),
    [[(d) => d.category, 'asc'], [(d) => d.publishedAt, 'desc']]);
  await ctx.load(docs.map((d) => d.file));
  return docs.map((d) => ({
    ...pick(d, ['_id', 'title', 'category', 'description', 'publishedAt']),
    fileUrl: ctx.assetUrl(attr(d, 'file', 'asset')),
    fileName: ctx.assetFilename(attr(d, 'file', 'asset')),
  }));
}

/* *[_type == "trackRecord"] | order(investor->name asc, year desc) {..., "investorName": investor->name} */
export async function getDataRoomTrackRecords() {
  const ctx = new Ctx(DATAROOM);
  const all = await ctx.type('trackRecord');
  await ctx.load(all.map((t) => t.investor));
  const rows = order(all, [[(t) => attr(ctx.deref(t.investor), 'name'), 'asc'], [(t) => t.year, 'desc']]);
  return rows.map((t) => ({
    ...pick(t, ['_id', 'investeeName', 'investmentOrg', 'year', 'sector', 'amountInvested', 'status', 'exitYear', 'exitAmountOrValuation', 'irr']),
    investorName: attr(ctx.deref(t.investor), 'name'),
  }));
}

/* *[_type == "lpFundSettings"][0]{ quarterlyPerformance[] {...} } — the same projection the Sanity
   version sorts in JS (the sort itself is shared, in lp-data.js). */
export async function getDataRoomFundPerformanceSettings() {
  const ctx = new Ctx(DATAROOM);
  const s = first(await ctx.type('lpFundSettings'));
  return s ? { quarterlyPerformance: perfProj(s) } : null;
}

/* *[_type == "company" && investmentStatus == "active"] | order(order asc) {...} */
export async function getDataRoomPortfolioCompanies() {
  const ctx = new Ctx(DATAROOM);
  const companies = byOrder((await ctx.type('company')).filter((c) => eq(c.investmentStatus, 'active')));
  await ctx.load(companies.map((c) => [c.category, c.logo]));
  return companies.map((c) => ({
    _id: raw(c._id),
    name: raw(c.name),
    slug: slugOf(c),
    oneLiner: raw(c.oneLiner),
    logo: ctx.assetUrl(attr(c, 'logo', 'asset')),
    sector: attr(ctx.deref(c.category), 'name'),
    sectorSlug: attr(ctx.deref(c.category), 'slug', 'current'),
    investmentStatus: raw(c.investmentStatus),
    isRevenueMaking: raw(c.isRevenueMaking),
    investmentRounds: roundsSorted(c, (r) => pick(r, ['roundName', 'roundLabel', 'investmentDate', 'yaliInvestment', 'isInitialRound'])),
    latestQuarter: latestUpdate(c, QU_DATAROOM),
  }));
}

/* *[_type == "lpFundSettings"][0]{ fundName, fundSizeAtClose, targetFundSizeINR, firstCloseDate, finalCloseDate, quarterlyPerformance[] {...} } */
export async function getDataRoomAllFundSettings() {
  const ctx = new Ctx(DATAROOM);
  const s = first(await ctx.type('lpFundSettings'));
  if (!s) return null;
  return {
    ...pick(s, ['fundName', 'fundSizeAtClose', 'targetFundSizeINR', 'firstCloseDate', 'finalCloseDate']),
    quarterlyPerformance: perfProj(s),
  };
}

// ── route lookups (formerly inline GROQ in the API routes) ──────────────────

const ACCESS_FLAG = { portal: 'lpPortalAccess', dataroom: 'dataroomAccess' };
function scoped(table, scope) {
  if (!Object.prototype.hasOwnProperty.call(table, scope)) throw new Error(`Unknown scope: ${scope}`);
  return table[scope];
}

async function findDomain(domain, pred) {
  needParam('domain', domain);
  const ctx = new Ctx(PORTAL);
  return first((await ctx.type('domainPrivilege')).filter((p) => eq(p.domain, domain) && pred(p)));
}

/* *[_type == "domainPrivilege" && domain == $domain && <lpPortalAccess|dataroomAccess> == true && isActive == true][0]{
     _id, requireCode, inviteCode, codeExpiry, maxUses, usedCount } */
export async function getDomainPrivilegeForSignIn(scope, domain) {
  const flag = scoped(ACCESS_FLAG, scope);
  const p = await findDomain(domain, (d) => d[flag] === true && d.isActive === true);
  return p ? pick(p, ['_id', 'requireCode', 'inviteCode', 'codeExpiry', 'maxUses', 'usedCount']) : null;
}

/* *[_type == "portalUser" && lower(email) == $email && noAccess == true][0]{ _id } */
export async function getBlockedPortalUser(email) {
  const u = await findUser(email, (x) => x.noAccess === true);
  return u ? { _id: raw(u._id) } : null;
}

const ACTIVE = { portal: lpPortalActive, dataroom: dataroomActive };

/* active user (portal: lpPortalAccess rule, dataroom: investorDataRoomAccess rule) [0]{ _id, name } */
export async function getActiveUserForSignIn(scope, email) {
  const u = await findUser(email, scoped(ACTIVE, scope));
  return u ? pick(u, ['_id', 'name']) : null;
}

/* ... [0]{ _id } */
export async function getActiveUserId(scope, email) {
  const u = await findUser(email, scoped(ACTIVE, scope));
  return u ? { _id: raw(u._id) } : null;
}
