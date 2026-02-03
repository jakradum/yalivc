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

// Get the end date of a quarter in Indian fiscal year
// Q1 FY26 → June 30, 2025; Q2 FY26 → Sep 30, 2025; Q3 FY26 → Dec 31, 2025; Q4 FY26 → Mar 31, 2026
function getQuarterEndDate(quarter, fiscalYear) {
  if (!quarter || !fiscalYear) return null;
  const fyNum = parseInt(fiscalYear.replace('FY', ''), 10);
  const fullYear = fyNum < 50 ? 2000 + fyNum : 1900 + fyNum;
  switch (quarter) {
    case 'Q1': return new Date(fullYear - 1, 5, 30); // June 30
    case 'Q2': return new Date(fullYear - 1, 8, 30); // Sep 30
    case 'Q3': return new Date(fullYear - 1, 11, 31); // Dec 31
    case 'Q4': return new Date(fullYear, 2, 31); // Mar 31
    default: return null;
  }
}

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

  // Filter investments: only show companies invested during or before this quarter
  const quarterEndDate = getQuarterEndDate(quarter, fiscalYear);
  const filteredInvestments = quarterEndDate
    ? investments?.filter(inv => {
        if (!inv.investmentDate) return true; // include if no date set
        return new Date(inv.investmentDate) <= quarterEndDate;
      })
    : investments;

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

    // Sum up invested amounts from filtered portfolio companies (for fallback)
    const computedTotalInvested = filteredInvestments?.reduce((sum, inv) =>
      sum + (inv.yaliInvestmentAmount || 0), 0) || 0;

    // Get quarterly data for the report period to compute FMV (for fallback)
    const reportQuarter = report?.quarter;
    const reportFY = report?.fiscalYear;

    let computedTotalFMV = 0;
    let computedTotalReturned = 0;

    filteredInvestments?.forEach(inv => {
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
      numberOfPortfolioCompanies: fundSettings?.portfolioCompanies ?? filteredInvestments?.length ?? 0,
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
        investments={filteredInvestments}
        allReports={availableQuarters || []}
      />
    </PortalLanding>
  );
}
