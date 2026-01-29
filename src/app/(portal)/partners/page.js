import {
  getLPFundSettings,
  getLatestLPQuarterlyReport,
  getLPQuarterlyReportBySlug,
  getLPInvestments,
  getTeamMembers,
  getAvailableLPQuarters,
} from '@/lib/sanity-queries';
import PortalLanding from './PortalLanding';
import PortalContent from './PortalContent';

export const revalidate = 0;

export default async function PartnersPortal() {
  const [fundSettings, latestReport, investments, teamMembers, availableQuarters] = await Promise.all([
    getLPFundSettings(),
    getLatestLPQuarterlyReport(),
    getLPInvestments(),
    getTeamMembers(),
    getAvailableLPQuarters(),
  ]);

  // Fetch full report data
  let report = null;
  if (latestReport?.slug) {
    report = await getLPQuarterlyReportBySlug(latestReport.slug);
  }

  // Get report period
  const quarter = report?.quarter || 'Q3';
  const fiscalYear = report?.fiscalYear || 'FY26';
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

  // Compute fund metrics from portfolio data and fund settings
  const computeFundMetrics = () => {
    const fundSize = fundSettings?.fundSizeAtClose || 893;

    // Sum up invested amounts from all portfolio companies
    const totalInvested = investments?.reduce((sum, inv) =>
      sum + (inv.yaliInvestmentAmount || 0), 0) || 0;

    // Get quarterly data for the report period to compute FMV
    const reportQuarter = report?.quarter;
    const reportFY = report?.fiscalYear;

    let totalFMV = 0;
    let totalReturned = 0;

    investments?.forEach(inv => {
      // Find the quarterly update matching this report's quarter
      const quarterData = inv.latestQuarter ||
        inv.quarterlyUpdates?.find(q =>
          q.quarter === reportQuarter && q.fiscalYear === reportFY
        ) || inv.quarterlyUpdates?.[0];

      if (quarterData) {
        totalFMV += quarterData.currentFMV || 0;
        totalReturned += quarterData.amountReturned || 0;
      }
    });

    // Compute performance metrics
    const moic = totalInvested > 0 ? (totalFMV + totalReturned) / totalInvested : 0;
    const dpi = totalInvested > 0 ? totalReturned / totalInvested : 0;
    const tvpi = moic; // TVPI = (FMV + Distributions) / Paid-In Capital

    return {
      fundSizeAtClose: fundSize,
      totalInvestedInPortfolio: totalInvested,
      fmvOfPortfolio: totalFMV,
      numberOfPortfolioCompanies: investments?.length || 0,
      amountReturned: totalReturned,
      moic: moic,
      tvpi: tvpi,
      dpi: dpi,
    };
  };

  const fundMetrics = computeFundMetrics();

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
        investments={investments}
        allReports={availableQuarters || []}
      />
    </PortalLanding>
  );
}
