// LP portal and data room data layer. Every LP/data-room read and write goes
// through here; LP_DATA_SOURCE (see lp-source.js) picks where it lands:
//
//   sanity   (default) today's Sanity queries, unchanged (src/lib/sanity-queries.js
//            and the route GROQ moved verbatim into lp-data/sanity-routes.js)
//   supabase the twin in Supabase, read through the doc loader (lp-data/loader.js),
//            projections reproduced in lp-data/supabase-reads.js
//   shadow   serve Sanity, then compare with Supabase after the response and log
//            differences to parity_diffs (lp-data/shadow.js). Writes go to Sanity only.
//
// Server-only. Content that stays on Sanity (team, news, social updates, investor
// relations, public website) is not here: import it from sanity-queries.js.
import { getLpSource } from './lp-source.js';
import * as supaReads from './lp-data/supabase-reads.js';
import * as supaWrites from './lp-data/supabase-writes.js';
import { redemptionEntry } from './lp-data/redemption.js';

export { setDocLoader, resetDocLoader } from './lp-data/loader.js';

// Loaded on first use so the Supabase path (and fixture tests) never need the
// Sanity clients.
const sanityQueries = () => import('./sanity-queries.js');
const sanityRoutes = () => import('./lp-data/sanity-routes.js');

function read(name, sanityFn, supabaseFn) {
  const fn = async (...args) => {
    const source = getLpSource();
    if (source === 'supabase') return supabaseFn(...args);
    const result = await sanityFn(...args);
    if (source === 'shadow') {
      const { scheduleShadow } = await import('./lp-data/shadow.js');
      await scheduleShadow(name, args, result, () => supabaseFn(...args));
    }
    return result;
  };
  Object.defineProperty(fn, 'name', { value: name });
  return fn;
}

// Writes: Supabase only in `supabase` mode; Sanity in `sanity` and `shadow`.
function write(name, sanityFn, supabaseFn) {
  const fn = async (...args) => (getLpSource() === 'supabase' ? supabaseFn(...args) : sanityFn(...args));
  Object.defineProperty(fn, 'name', { value: name });
  return fn;
}

const q = (name) => async (...args) => (await sanityQueries())[name](...args);
const r = (name) => async (...args) => (await sanityRoutes())[name](...args);

// ── portal reads ───────────────────────────────────────────────────────────
export const getLPFundSettings = read('getLPFundSettings', q('getLPFundSettings'), supaReads.getLPFundSettings);
export const getLPInvestments = read('getLPInvestments', q('getLPInvestments'), supaReads.getLPInvestments);
export const getLPInvestmentsForPdf = read('getLPInvestmentsForPdf', q('getLPInvestmentsForPdf'), supaReads.getLPInvestmentsForPdf);
export const getLPInvestmentByCompanySlug = read('getLPInvestmentByCompanySlug', q('getLPInvestmentByCompanySlug'), supaReads.getLPInvestmentByCompanySlug);
export const getLPQuarterUpdates = read('getLPQuarterUpdates', q('getLPQuarterUpdates'), supaReads.getLPQuarterUpdates);
export const getLPQuarterlyReportBySlug = read('getLPQuarterlyReportBySlug', q('getLPQuarterlyReportBySlug'), supaReads.getLPQuarterlyReportBySlug);
export const getLPQuarterlyReportBySlugAdmin = read('getLPQuarterlyReportBySlugAdmin', q('getLPQuarterlyReportBySlugAdmin'), supaReads.getLPQuarterlyReportBySlugAdmin);
export const getLatestLPQuarterlyReport = read('getLatestLPQuarterlyReport', q('getLatestLPQuarterlyReport'), supaReads.getLatestLPQuarterlyReport);
export const getAllLPInvestmentSlugs = read('getAllLPInvestmentSlugs', q('getAllLPInvestmentSlugs'), supaReads.getAllLPInvestmentSlugs);
export const getAvailableLPQuarters = read('getAvailableLPQuarters', q('getAvailableLPQuarters'), supaReads.getAvailableLPQuarters);
export const getPortalUserByEmail = read('getPortalUserByEmail', q('getPortalUserByEmail'), supaReads.getPortalUserByEmail);

// ── data room reads ────────────────────────────────────────────────────────
export const getLatestLPReportForDataRoom = read('getLatestLPReportForDataRoom', q('getLatestLPReportForDataRoom'), supaReads.getLatestLPReportForDataRoom);
export const getDataroomDomainPrivilege = read('getDataroomDomainPrivilege', q('getDataroomDomainPrivilege'), supaReads.getDataroomDomainPrivilege);
export const getDataroomFundContent = read('getDataroomFundContent', q('getDataroomFundContent'), supaReads.getDataroomFundContent);
export const getDataRoomDocuments = read('getDataRoomDocuments', q('getDataRoomDocuments'), supaReads.getDataRoomDocuments);
export const getDataRoomTrackRecords = read('getDataRoomTrackRecords', q('getDataRoomTrackRecords'), supaReads.getDataRoomTrackRecords);
export const getDataRoomPortfolioCompanies = read('getDataRoomPortfolioCompanies', q('getDataRoomPortfolioCompanies'), supaReads.getDataRoomPortfolioCompanies);
export const getDataRoomAllFundSettings = read('getDataRoomAllFundSettings', q('getDataRoomAllFundSettings'), supaReads.getDataRoomAllFundSettings);

// Same post-processing as sanity-queries.js getDataRoomFundPerformance: latest quarter.
function latestPerformance(settings) {
  if (!settings?.quarterlyPerformance?.length) return null;
  const fyOrder = (fy) => parseInt(fy.replace('FY', ''), 10);
  const qOrder = { Q4: 4, Q3: 3, Q2: 2, Q1: 1 };
  const sorted = [...settings.quarterlyPerformance].sort((a, b) => {
    const fyDiff = fyOrder(b.fiscalYear) - fyOrder(a.fiscalYear);
    if (fyDiff !== 0) return fyDiff;
    return (qOrder[b.quarter] || 0) - (qOrder[a.quarter] || 0);
  });
  return sorted[0];
}
export const getDataRoomFundPerformance = read('getDataRoomFundPerformance', q('getDataRoomFundPerformance'),
  async () => latestPerformance(await supaReads.getDataRoomFundPerformanceSettings()));

// ── route lookups (were inline GROQ in the API routes) ──────────────────────
// scope: 'portal' (LP portal rules) or 'dataroom' (data room rules)
export const getDomainPrivilegeForSignIn = read('getDomainPrivilegeForSignIn', r('getDomainPrivilegeForSignIn'), supaReads.getDomainPrivilegeForSignIn);
export const getDomainSharedCode = read('getDomainSharedCode', r('getDomainSharedCode'), supaReads.getDomainSharedCode);
export const getSharedCodeDomain = read('getSharedCodeDomain', r('getSharedCodeDomain'), supaReads.getSharedCodeDomain);
export const getBlockedPortalUser = read('getBlockedPortalUser', r('getBlockedPortalUser'), supaReads.getBlockedPortalUser);
export const getActiveUserForSignIn = read('getActiveUserForSignIn', r('getActiveUserForSignIn'), supaReads.getActiveUserForSignIn);
export const getActiveUserInviteCode = read('getActiveUserInviteCode', r('getActiveUserInviteCode'), supaReads.getActiveUserInviteCode);
export const getActiveUserId = read('getActiveUserId', r('getActiveUserId'), supaReads.getActiveUserId);

// ── writes ─────────────────────────────────────────────────────────────────
// Records one use of a domain's shared code (usedCount + 1, redemptionLog entry).
export const redeemDomainSharedCode = write('redeemDomainSharedCode',
  async (domainPriv, email) => (await sanityRoutes()).redeemDomainSharedCode(domainPriv, email),
  async (domainPriv, email) => supaWrites.redeemDomainSharedCode(domainPriv, email, redemptionEntry(email)));
// Removes a user's one-time inviteCode / inviteCodeExpiry after it was used.
export const clearUserInviteCode = write('clearUserInviteCode', r('clearUserInviteCode'), supaWrites.clearUserInviteCode);
// Creates an lpDownloadConsent / lpPortalFeedback document; resolves to the new doc (with _id).
export const createDownloadConsent = write('createDownloadConsent', r('createDownloadConsent'), supaWrites.createDownloadConsent);
export const createPortalFeedback = write('createPortalFeedback', r('createPortalFeedback'), supaWrites.createPortalFeedback);
// Stores a report's computed snapshot on its lpQuarterlyReport document.
export const updateLPReportSnapshot = write('updateLPReportSnapshot', q('updateLPReportSnapshot'), supaWrites.updateLPReportSnapshot);
