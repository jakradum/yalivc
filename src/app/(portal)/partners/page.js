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
import {
  getQuarterStartDate,
  getQuarterEndDate,
  getPortfolioCompaniesForQuarter,
} from '@/lib/quarterly-utils';
import PortalLanding from './PortalLanding';
import PortalContent from './PortalContent';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function PartnersPortal({ searchParams }) {
  const { report: reportSlug, section: initialSection } = await searchParams;

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
  const reportingDate = report?.reportingDate
    ? new Date(report.reportingDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'December 2025';

  // Filter investments using centralized quarterly logic
  // Only show companies invested on or before the report quarter
  const isLatestReport = !reportSlug || selectedSlug === latestReport?.slug;
  const filteredInvestments = getPortfolioCompaniesForQuarter(investments, quarter, fiscalYear);

  // Find Gani from team members or use fallback
  const gani = teamMembers.find(t =>
    t.name?.toLowerCase().includes('gani') ||
    t.name?.toLowerCase().includes('ganapathy')
  ) || {
    name: "Ganapathy 'Gani' Subramaniam",
    role: "Founding Managing Partner",
    photo: "/images/gani.webp"
  };

  // Compute fund metrics - use quarter-specific data from Sanity, fall back to computed values
  const computeFundMetrics = () => {
    const fundSize = fundSettings?.fundSizeAtClose;

    // Find the matching quarter's performance data from fundSettings
    const quarterPerformance = fundSettings?.quarterlyPerformance?.find(
      qp => qp.quarter === quarter && qp.fiscalYear === fiscalYear
    );

    // Sum up invested amounts from filtered portfolio companies (for fallback)
    const computedTotalInvested = filteredInvestments?.reduce((sum, inv) =>
      sum + (inv.yaliInvestmentAmount || 0), 0) || 0;

    // Get quarterly data for the report period to compute FMV (for fallback)
    let computedTotalFMV = 0;
    let computedTotalReturned = 0;

    filteredInvestments?.forEach(inv => {
      const quarterData = inv.latestQuarter ||
        inv.quarterlyUpdates?.find(q =>
          q.quarter === quarter && q.fiscalYear === fiscalYear
        ) || inv.quarterlyUpdates?.[0];

      if (quarterData) {
        computedTotalFMV += quarterData.currentFMV || 0;
        computedTotalReturned += quarterData.amountReturned || 0;
      }
    });

    // Use quarter-specific Sanity data if available, otherwise use computed values
    const totalInvested = quarterPerformance?.totalInvested ?? computedTotalInvested;
    const totalFMV = quarterPerformance?.fairMarketValue ?? computedTotalFMV;
    const totalReturned = quarterPerformance?.amountReturned ?? computedTotalReturned;

    // Use quarter-specific MOIC/TVPI/DPI from Sanity or compute
    const computedMoic = totalInvested > 0 ? (totalFMV + totalReturned) / totalInvested : 0;
    const computedDpi = totalInvested > 0 ? totalReturned / totalInvested : 0;
    const computedTvpi = computedMoic;

    return {
      fundSizeAtClose: fundSize,
      amountDrawnDown: quarterPerformance?.amountDrawnDown,
      totalInvestedInPortfolio: totalInvested,
      fmvOfPortfolio: totalFMV,
      // Always calculate from filtered investments - single source of truth via quarterly-utils
      numberOfPortfolioCompanies: filteredInvestments?.length ?? 0,
      amountReturned: totalReturned,
      moic: quarterPerformance?.moic ?? computedMoic,
      tvpi: quarterPerformance?.tvpi ?? computedTvpi,
      dpi: quarterPerformance?.dpi ?? computedDpi,
    };
  };

  const fundMetrics = computeFundMetrics();

  // Fetch news and social updates for the quarter date range
  const quarterStartDate = getQuarterStartDate(quarter, fiscalYear);
  const quarterEndDate = getQuarterEndDate(quarter, fiscalYear);
  const [quarterNews, quarterSocialUpdates] = await Promise.all([
    quarterStartDate && quarterEndDate
      ? getNewsByDateRange(quarterStartDate, quarterEndDate)
      : Promise.resolve([]),
    quarterStartDate && quarterEndDate
      ? getSocialUpdatesByDateRange(quarterStartDate, quarterEndDate)
      : Promise.resolve([]),
  ]);

  return (
    <PortalLanding>
      <PortalContent
        fundSettings={fundSettings}
        report={report}
        quarter={quarter}
        fiscalYear={fiscalYear}
        reportingDate={reportingDate}
        gani={gani}
        fundMetrics={fundMetrics}
        investments={filteredInvestments}
        allReports={availableQuarters || []}
        isLatestReport={isLatestReport}
        initialSection={initialSection || 'cover-note'}
        reportSlug={reportSlug || null}
        quarterNews={quarterNews || []}
        quarterSocialUpdates={quarterSocialUpdates || []}
      />
    </PortalLanding>
  );
}
