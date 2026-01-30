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

  // Compute fund metrics - prefer Sanity data, fall back to computed values
  const computeFundMetrics = () => {
    const fundSize = fundSettings?.fundSizeAtClose;

    // Sum up invested amounts from all portfolio companies (for fallback)
    const computedTotalInvested = investments?.reduce((sum, inv) =>
      sum + (inv.yaliInvestmentAmount || 0), 0) || 0;

    // Get quarterly data for the report period to compute FMV (for fallback)
    const reportQuarter = report?.quarter;
    const reportFY = report?.fiscalYear;

    let computedTotalFMV = 0;
    let computedTotalReturned = 0;

    investments?.forEach(inv => {
      const quarterData = inv.latestQuarter ||
        inv.quarterlyUpdates?.find(q =>
          q.quarter === reportQuarter && q.fiscalYear === reportFY
        ) || inv.quarterlyUpdates?.[0];

      if (quarterData) {
        computedTotalFMV += quarterData.currentFMV || 0;
        computedTotalReturned += quarterData.amountReturned || 0;
      }
    });

    // Use Sanity data if available, otherwise use computed values
    const totalInvested = fundSettings?.totalInvested ?? computedTotalInvested;
    const totalFMV = fundSettings?.fairMarketValue ?? computedTotalFMV;
    const totalReturned = fundSettings?.amountReturned ?? computedTotalReturned;

    // Parse MOIC/TVPI/DPI from Sanity (stored as strings) or compute
    const parsedMoic = fundSettings?.moic ? parseFloat(fundSettings.moic) : null;
    const parsedTvpi = fundSettings?.tvpi ? parseFloat(fundSettings.tvpi) : null;
    const parsedDpi = fundSettings?.dpi ? parseFloat(fundSettings.dpi) : null;

    // Compute fallback metrics
    const computedMoic = totalInvested > 0 ? (totalFMV + totalReturned) / totalInvested : 0;
    const computedDpi = totalInvested > 0 ? totalReturned / totalInvested : 0;
    const computedTvpi = computedMoic;

    return {
      fundSizeAtClose: fundSize,
      amountDrawnDown: fundSettings?.amountDrawnDown,
      totalInvestedInPortfolio: totalInvested,
      fmvOfPortfolio: totalFMV,
      numberOfPortfolioCompanies: fundSettings?.portfolioCompanies ?? investments?.length ?? 0,
      amountReturned: totalReturned,
      moic: parsedMoic ?? computedMoic,
      tvpi: parsedTvpi ?? computedTvpi,
      dpi: parsedDpi ?? computedDpi,
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
