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
export const dynamic = 'force-dynamic';

// Get the end date string of a quarter in Indian fiscal year (YYYY-MM-DD)
// Q1 FY26 → 2025-06-30; Q2 FY26 → 2025-09-30; Q3 FY26 → 2025-12-31; Q4 FY26 → 2026-03-31
function getQuarterEndDate(quarter, fiscalYear) {
  if (!quarter || !fiscalYear) return null;
  const fyNum = parseInt(fiscalYear.replace('FY', ''), 10);
  const fullYear = fyNum < 50 ? 2000 + fyNum : 1900 + fyNum;
  switch (quarter) {
    case 'Q1': return `${fullYear - 1}-06-30`;
    case 'Q2': return `${fullYear - 1}-09-30`;
    case 'Q3': return `${fullYear - 1}-12-31`;
    case 'Q4': return `${fullYear}-03-31`;
    default: return null;
  }
}

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

  // Filter investments: only show companies invested on or before the report quarter
  // This applies to ALL reports (including latest) to exclude future companies
  const isLatestReport = !reportSlug || selectedSlug === latestReport?.slug;
  const quarterEndDate = getQuarterEndDate(quarter, fiscalYear);
  const filteredInvestments = quarterEndDate
    ? investments?.filter(inv => {
        // Companies without investment date are included (legacy data)
        if (!inv.investmentDate) return true;
        // Only show companies invested on or before the quarter end date
        return inv.investmentDate <= quarterEndDate;
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
        isLatestReport={isLatestReport}
        initialSection={initialSection || 'cover-note'}
        reportSlug={reportSlug || null}
      />
    </PortalLanding>
  );
}
