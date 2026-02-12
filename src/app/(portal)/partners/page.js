import { cookies } from 'next/headers';
import {
  getLPFundSettings,
  getLatestLPQuarterlyReport,
  getLPQuarterlyReportBySlug,
  getLPInvestments,
  getTeamMembers,
  getAvailableLPQuarters,
  getNewsByDateRange,
  getSocialUpdatesByDateRange,
  getPortalUserByEmail,
} from '@/lib/sanity-queries';
import { buildReportData, getQuarterStartDate, getQuarterEndDate } from '@/lib/quarterly-utils';
import PortalLanding from './PortalLanding';
import PortalContent from './PortalContent';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

// Extract user email from session cookie (format: email:timestamp:signature)
function getUserEmail(cookieStore) {
  const sessionCookie = cookieStore.get('portal-session')?.value;
  if (!sessionCookie) return null;
  const parts = sessionCookie.split(':');
  if (parts.length < 1) return null;
  return parts[0]; // Email is the first part
}

// Check if user is internal (has @yali.vc email)
function isInternalUser(email) {
  if (!email) return false;
  return email.toLowerCase().endsWith('@yali.vc');
}

export default async function PartnersPortal({ searchParams }) {
  const { report: reportSlug, section: initialSection } = await searchParams;

  // Get user access level from session
  const cookieStore = await cookies();
  const userEmail = getUserEmail(cookieStore);
  const hasInternalAccess = isInternalUser(userEmail);

  // Fetch all raw data in parallel (including user info for GIFT City status)
  const [fundSettings, latestReport, investments, teamMembers, availableQuarters, portalUser] = await Promise.all([
    getLPFundSettings(),
    getLatestLPQuarterlyReport(hasInternalAccess),
    getLPInvestments(),
    getTeamMembers(),
    getAvailableLPQuarters(),
    getPortalUserByEmail(userEmail),
  ]);

  // Check if user is a GIFT City LP
  const isGiftCityLP = portalUser?.isGiftCityLP || false;

  // Filter available quarters based on user access
  // Internal users see both 'internal' and 'published' reports
  // External LPs only see 'published' reports
  const accessibleReports = (availableQuarters || []).filter(r =>
    hasInternalAccess ? true : r.visibility === 'published'
  );

  // Fetch selected report, or fall back to latest
  const selectedSlug = reportSlug || latestReport?.slug;
  let report = null;
  if (selectedSlug) {
    report = await getLPQuarterlyReportBySlug(selectedSlug);

    // Security check: if user doesn't have access to this report, fall back to latest accessible
    if (report && report.visibility === 'internal' && !hasInternalAccess) {
      report = await getLPQuarterlyReportBySlug(latestReport?.slug);
    }
  }

  // Get report period
  const quarter = report?.quarter || 'Q3';
  const fiscalYear = report?.fiscalYear || 'FY26';
  const isLatestReport = !reportSlug || selectedSlug === latestReport?.slug;

  // Fetch news and social updates for the quarter
  const quarterStartDate = getQuarterStartDate(quarter, fiscalYear);
  const quarterEndDate = getQuarterEndDate(quarter, fiscalYear);
  const [news, socialUpdates] = await Promise.all([
    quarterStartDate && quarterEndDate
      ? getNewsByDateRange(quarterStartDate, quarterEndDate)
      : Promise.resolve([]),
    quarterStartDate && quarterEndDate
      ? getSocialUpdatesByDateRange(quarterStartDate, quarterEndDate)
      : Promise.resolve([]),
  ]);

  // Use Report Builder - single source of truth for all quarter-gated data
  const reportData = buildReportData({
    quarter,
    fiscalYear,
    fundSettings,
    investments,
    news,
    socialUpdates,
  });

  // Format reporting date for display
  const reportingDate = report?.reportingDate
    ? new Date(report.reportingDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'December 2025';

  // Use signatory from report if set, otherwise fallback to Gani
  const signatory = report?.signatory || teamMembers.find(t =>
    t.name?.toLowerCase().includes('gani') ||
    t.name?.toLowerCase().includes('ganapathy')
  ) || {
    name: "Ganapathy 'Gani' Subramaniam",
    role: "Founding Managing Partner",
    photo: "/images/gani.webp"
  };

  return (
    <PortalLanding>
      <PortalContent
        fundSettings={fundSettings}
        report={report}
        quarter={quarter}
        fiscalYear={fiscalYear}
        reportingDate={reportingDate}
        signatory={signatory}
        fundMetrics={reportData.fundMetrics}
        investments={reportData.portfolioCompanies}
        allReports={accessibleReports}
        isLatestReport={isLatestReport}
        initialSection={initialSection || 'cover-note'}
        reportSlug={reportSlug || null}
        quarterNews={reportData.quarterNews}
        quarterSocialUpdates={reportData.quarterSocialUpdates}
        isGiftCityLP={isGiftCityLP}
      />
    </PortalLanding>
  );
}
