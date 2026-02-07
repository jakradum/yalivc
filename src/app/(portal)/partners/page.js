import {
  getLPFundSettings,
  getLatestLPQuarterlyReport,
  getLPQuarterlyReportBySlug,
  getLPInvestments,
  getTeamMembers,
  getAvailableLPQuarters,
  getNewsByDateRange,
  getSocialUpdatesByDateRange,
} from '@/lib/sanity-queries';
import { buildReportData, getQuarterStartDate, getQuarterEndDate } from '@/lib/quarterly-utils';
import PortalLanding from './PortalLanding';
import PortalContent from './PortalContent';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function PartnersPortal({ searchParams }) {
  const { report: reportSlug, section: initialSection } = await searchParams;

  // Fetch all raw data in parallel
  const [fundSettings, latestReport, investments, teamMembers, availableQuarters] = await Promise.all([
    getLPFundSettings(),
    getLatestLPQuarterlyReport(),
    getLPInvestments(),
    getTeamMembers(),
    getAvailableLPQuarters(),
  ]);

  // Fetch selected report, or fall back to latest
  const selectedSlug = reportSlug || latestReport?.slug;
  let report = null;
  if (selectedSlug) {
    report = await getLPQuarterlyReportBySlug(selectedSlug);
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

  // Find Gani from team members or use fallback
  const gani = teamMembers.find(t =>
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
        gani={gani}
        fundMetrics={reportData.fundMetrics}
        investments={reportData.portfolioCompanies}
        allReports={availableQuarters || []}
        isLatestReport={isLatestReport}
        initialSection={initialSection || 'cover-note'}
        reportSlug={reportSlug || null}
        quarterNews={reportData.quarterNews}
        quarterSocialUpdates={reportData.quarterSocialUpdates}
      />
    </PortalLanding>
  );
}
