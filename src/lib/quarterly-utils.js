/**
 * Centralized Quarterly Logic Utility
 *
 * Single source of truth for all quarter-based calculations in the LP Portal.
 * Uses Indian Fiscal Year (April to March):
 * - Q1: April - June
 * - Q2: July - September
 * - Q3: October - December
 * - Q4: January - March
 */

/**
 * Parse fiscal year string (e.g., "FY26") to full calendar year (e.g., 2026)
 * @param {string} fiscalYear - Fiscal year in format "FY26"
 * @returns {number} Full calendar year
 */
export function parseFiscalYear(fiscalYear) {
  if (!fiscalYear) return null;
  const fyNum = parseInt(fiscalYear.replace('FY', ''), 10);
  return fyNum < 50 ? 2000 + fyNum : 1900 + fyNum;
}

/**
 * Get the start date of a quarter in Indian fiscal year (YYYY-MM-DD)
 * Q1 FY26 → 2025-04-01; Q2 FY26 → 2025-07-01; Q3 FY26 → 2025-10-01; Q4 FY26 → 2026-01-01
 * @param {string} quarter - Quarter (Q1, Q2, Q3, Q4)
 * @param {string} fiscalYear - Fiscal year (e.g., "FY26")
 * @returns {string|null} Date string in YYYY-MM-DD format
 */
export function getQuarterStartDate(quarter, fiscalYear) {
  if (!quarter || !fiscalYear) return null;
  const fullYear = parseFiscalYear(fiscalYear);
  if (!fullYear) return null;

  switch (quarter) {
    case 'Q1': return `${fullYear - 1}-04-01`;
    case 'Q2': return `${fullYear - 1}-07-01`;
    case 'Q3': return `${fullYear - 1}-10-01`;
    case 'Q4': return `${fullYear}-01-01`;
    default: return null;
  }
}

/**
 * Get the end date of a quarter in Indian fiscal year (YYYY-MM-DD)
 * Q1 FY26 → 2025-06-30; Q2 FY26 → 2025-09-30; Q3 FY26 → 2025-12-31; Q4 FY26 → 2026-03-31
 * @param {string} quarter - Quarter (Q1, Q2, Q3, Q4)
 * @param {string} fiscalYear - Fiscal year (e.g., "FY26")
 * @returns {string|null} Date string in YYYY-MM-DD format
 */
export function getQuarterEndDate(quarter, fiscalYear) {
  if (!quarter || !fiscalYear) return null;
  const fullYear = parseFiscalYear(fiscalYear);
  if (!fullYear) return null;

  switch (quarter) {
    case 'Q1': return `${fullYear - 1}-06-30`;
    case 'Q2': return `${fullYear - 1}-09-30`;
    case 'Q3': return `${fullYear - 1}-12-31`;
    case 'Q4': return `${fullYear}-03-31`;
    default: return null;
  }
}

/**
 * Get the next quarter and fiscal year after the given one
 * @param {string} quarter - Current quarter (Q1, Q2, Q3, Q4)
 * @param {string} fiscalYear - Current fiscal year (e.g., "FY26")
 * @returns {object} { quarter, fiscalYear } for the next quarter
 */
export function getNextQuarter(quarter, fiscalYear) {
  if (!quarter || !fiscalYear) return null;

  const fyNum = parseInt(fiscalYear.replace('FY', ''), 10);

  switch (quarter) {
    case 'Q1': return { quarter: 'Q2', fiscalYear };
    case 'Q2': return { quarter: 'Q3', fiscalYear };
    case 'Q3': return { quarter: 'Q4', fiscalYear };
    case 'Q4': return { quarter: 'Q1', fiscalYear: `FY${fyNum + 1}` };
    default: return null;
  }
}

/**
 * Get the end date of the NEXT quarter after the given one
 * Useful for "show early" logic where a round should appear in the quarter before its close
 * @param {string} quarter - Current quarter (Q1, Q2, Q3, Q4)
 * @param {string} fiscalYear - Current fiscal year (e.g., "FY26")
 * @returns {string|null} Date string in YYYY-MM-DD format for next quarter's end
 */
export function getNextQuarterEndDate(quarter, fiscalYear) {
  const next = getNextQuarter(quarter, fiscalYear);
  if (!next) return null;
  return getQuarterEndDate(next.quarter, next.fiscalYear);
}

/**
 * Get the earliest investment date from a company's investment rounds
 * @param {object} company - Company object with investmentRounds array
 * @returns {string|null} Earliest investment date in YYYY-MM-DD format, or null
 */
export function getEarliestInvestmentDate(company) {
  const rounds = company?.investmentRounds || [];
  if (rounds.length === 0) return null;

  // Find round marked as initial, or use the first round (already sorted by date asc)
  const initialRound = rounds.find(r => r.isInitialRound) || rounds[0];
  return initialRound?.investmentDate || null;
}

/**
 * Filter investments to only include companies invested on or before a quarter's end date
 * Companies without an investment date are included (legacy data)
 * @param {Array} investments - Array of investment objects with investmentRounds
 * @param {string} quarter - Quarter (Q1, Q2, Q3, Q4)
 * @param {string} fiscalYear - Fiscal year (e.g., "FY26")
 * @returns {Array} Filtered investments
 */
export function getPortfolioCompaniesForQuarter(investments, quarter, fiscalYear) {
  if (!investments || !Array.isArray(investments)) return [];

  const quarterEndDate = getQuarterEndDate(quarter, fiscalYear);
  if (!quarterEndDate) return investments;

  return investments.filter(inv => {
    // Get earliest investment date from rounds
    const firstInvestmentDate = getEarliestInvestmentDate(inv);

    // Companies without investment date are included (legacy data)
    if (!firstInvestmentDate) return true;

    // Only include companies invested on or before the quarter end date
    return firstInvestmentDate <= quarterEndDate;
  });
}

/**
 * Get the count of portfolio companies for a specific quarter
 * This is the single source of truth for portfolio company count
 * @param {Array} investments - Array of investment objects with investmentDate field
 * @param {string} quarter - Quarter (Q1, Q2, Q3, Q4)
 * @param {string} fiscalYear - Fiscal year (e.g., "FY26")
 * @returns {number} Count of portfolio companies
 */
export function getPortfolioCount(investments, quarter, fiscalYear) {
  const filtered = getPortfolioCompaniesForQuarter(investments, quarter, fiscalYear);
  return filtered.length;
}

/**
 * Get a sortable numeric key from quarter data (higher = more recent)
 * Useful for sorting quarters chronologically
 * @param {object} quarterData - Object with quarter and fiscalYear properties
 * @returns {number} Sortable key
 */
export function getQuarterSortKey(quarterData) {
  const yearNum = parseInt(quarterData?.fiscalYear?.replace('FY', '') || '0', 10);
  const qNum = parseInt(quarterData?.quarter?.replace('Q', '') || '0', 10);
  return yearNum * 10 + qNum;
}

/**
 * Format a quarter period for display (e.g., "Q3 FY26")
 * @param {string} quarter - Quarter (Q1, Q2, Q3, Q4)
 * @param {string} fiscalYear - Fiscal year (e.g., "FY26")
 * @returns {string} Formatted period string
 */
export function formatQuarterPeriod(quarter, fiscalYear) {
  if (!quarter || !fiscalYear) return '';
  return `${quarter} ${fiscalYear}`;
}

/**
 * Get the quarter data for a company matching a specific report period
 * @param {object} company - Company object with quarterlyUpdates array
 * @param {string} quarter - Quarter (Q1, Q2, Q3, Q4)
 * @param {string} fiscalYear - Fiscal year (e.g., "FY26")
 * @returns {object|null} Matching quarterly update or null
 */
export function getCompanyQuarterData(company, quarter, fiscalYear) {
  if (!company?.quarterlyUpdates || !Array.isArray(company.quarterlyUpdates)) {
    return null;
  }

  return company.quarterlyUpdates.find(
    q => q.quarter === quarter && q.fiscalYear === fiscalYear
  ) || null;
}

/**
 * Check if a quarter is before another quarter chronologically
 * @param {string} q1 - First quarter (Q1, Q2, Q3, Q4)
 * @param {string} fy1 - First fiscal year (e.g., "FY26")
 * @param {string} q2 - Second quarter (Q1, Q2, Q3, Q4)
 * @param {string} fy2 - Second fiscal year (e.g., "FY26")
 * @returns {boolean} True if first quarter is before second
 */
export function isQuarterBefore(q1, fy1, q2, fy2) {
  const key1 = getQuarterSortKey({ quarter: q1, fiscalYear: fy1 });
  const key2 = getQuarterSortKey({ quarter: q2, fiscalYear: fy2 });
  return key1 < key2;
}

/**
 * Filter and sort an array of quarter objects to only those chronologically before a reference quarter
 * Returns quarters sorted most recent first (descending)
 * @param {Array} quarters - Array of objects with quarter and fiscalYear properties
 * @param {string} refQuarter - Reference quarter (Q1, Q2, Q3, Q4)
 * @param {string} refFiscalYear - Reference fiscal year (e.g., "FY26")
 * @returns {Array} Filtered and sorted quarters (most recent first)
 */
export function getQuartersBefore(quarters, refQuarter, refFiscalYear) {
  if (!quarters || !Array.isArray(quarters) || !refQuarter || !refFiscalYear) {
    return [];
  }
  return quarters
    .filter(q => isQuarterBefore(q.quarter, q.fiscalYear, refQuarter, refFiscalYear))
    .sort((a, b) => getQuarterSortKey(b) - getQuarterSortKey(a));
}

/**
 * Sort an array of quarter objects chronologically (most recent first)
 * @param {Array} quarters - Array of objects with quarter and fiscalYear properties
 * @returns {Array} Sorted quarters (most recent first)
 */
export function sortQuartersDescending(quarters) {
  if (!quarters || !Array.isArray(quarters)) return [];
  return [...quarters].sort((a, b) => getQuarterSortKey(b) - getQuarterSortKey(a));
}

/**
 * Filter investment rounds to only show rounds made on or before quarter end
 * @param {Array} rounds - Array of investment round objects with investmentDate
 * @param {string} quarterEndDate - Quarter end date in YYYY-MM-DD format
 * @returns {Array} Filtered rounds
 */
export function filterInvestmentRounds(rounds, quarterEndDate) {
  if (!rounds || !Array.isArray(rounds) || !quarterEndDate) return rounds || [];
  return rounds.filter(round => {
    if (!round.investmentDate) return true; // Include rounds without dates
    return round.investmentDate <= quarterEndDate;
  });
}

/**
 * Get fund performance metrics for a specific quarter
 * @param {object} fundSettings - Fund settings with quarterlyPerformance array
 * @param {string} quarter - Quarter (Q1, Q2, Q3, Q4)
 * @param {string} fiscalYear - Fiscal year (e.g., "FY26")
 * @returns {object|null} Matching quarter performance or null
 */
export function getFundQuarterPerformance(fundSettings, quarter, fiscalYear) {
  if (!fundSettings?.quarterlyPerformance || !Array.isArray(fundSettings.quarterlyPerformance)) {
    return null;
  }
  return fundSettings.quarterlyPerformance.find(
    qp => qp.quarter === quarter && qp.fiscalYear === fiscalYear
  ) || null;
}

/**
 * =============================================================================
 * REPORT BUILDER - Single source of truth for all report data
 * =============================================================================
 *
 * Takes raw data and returns everything gated/filtered for a specific quarter.
 * This function is the authoritative source for what data appears in each report.
 *
 * @param {object} params - All raw data
 * @param {string} params.quarter - Report quarter (Q1, Q2, Q3, Q4)
 * @param {string} params.fiscalYear - Report fiscal year (e.g., "FY26")
 * @param {object} params.fundSettings - Fund settings from Sanity
 * @param {Array} params.investments - All portfolio companies from Sanity
 * @param {Array} params.news - All news items
 * @param {Array} params.socialUpdates - All social updates
 * @returns {object} All data filtered for the specified quarter
 */
export function buildReportData({
  quarter,
  fiscalYear,
  fundSettings,
  investments,
  news = [],
  socialUpdates = [],
}) {
  // Calculate quarter boundaries
  const quarterStartDate = getQuarterStartDate(quarter, fiscalYear);
  const quarterEndDate = getQuarterEndDate(quarter, fiscalYear);

  // 1. Filter portfolio companies - only those invested on or before quarter end
  const portfolioCompanies = getPortfolioCompaniesForQuarter(investments, quarter, fiscalYear);

  // 2. Get fund performance for this specific quarter
  const fundPerformance = getFundQuarterPerformance(fundSettings, quarter, fiscalYear);

  // 3. Compute fund metrics - use Sanity data if available, otherwise calculate
  const computedTotalInvested = portfolioCompanies.reduce(
    (sum, inv) => sum + (inv.yaliInvestmentAmount || 0), 0
  );

  let computedTotalFMV = 0;
  let computedTotalReturned = 0;

  portfolioCompanies.forEach(inv => {
    const quarterData = getCompanyQuarterData(inv, quarter, fiscalYear) ||
      inv.latestQuarter ||
      inv.quarterlyUpdates?.[0];

    if (quarterData) {
      computedTotalFMV += quarterData.currentFMV || 0;
      computedTotalReturned += quarterData.amountReturned || 0;
    }
  });

  const totalInvested = fundPerformance?.totalInvested ?? computedTotalInvested;
  const totalFMV = fundPerformance?.fairMarketValue ?? computedTotalFMV;
  const totalReturned = fundPerformance?.amountReturned ?? computedTotalReturned;

  const computedMoic = totalInvested > 0 ? (totalFMV + totalReturned) / totalInvested : 0;
  const computedDpi = totalInvested > 0 ? totalReturned / totalInvested : 0;

  const fundMetrics = {
    fundSizeAtClose: fundSettings?.fundSizeAtClose,
    amountDrawnDown: fundPerformance?.amountDrawnDown,
    totalInvestedInPortfolio: totalInvested,
    fmvOfPortfolio: totalFMV,
    numberOfPortfolioCompanies: portfolioCompanies.length,
    amountReturned: totalReturned,
    moic: fundPerformance?.moic ?? computedMoic,
    tvpi: fundPerformance?.tvpi ?? computedMoic,
    dpi: fundPerformance?.dpi ?? computedDpi,
  };

  // 4. Filter news and social updates by quarter date range
  const quarterNews = quarterStartDate && quarterEndDate
    ? news.filter(item => item.date >= quarterStartDate && item.date <= quarterEndDate)
    : [];

  const quarterSocialUpdates = quarterStartDate && quarterEndDate
    ? socialUpdates.filter(item => item.date >= quarterStartDate && item.date <= quarterEndDate)
    : [];

  // 5. Process each company with quarter-specific data
  const processedCompanies = portfolioCompanies.map(company => {
    // Get this company's quarterly data for the report period
    const quarterData = getCompanyQuarterData(company, quarter, fiscalYear);

    // Filter investment rounds to only show those made by quarter end
    const filteredRounds = filterInvestmentRounds(company.investmentRounds, quarterEndDate);

    return {
      ...company,
      // Quarter-specific performance data
      quarterData,
      // Filtered investment rounds
      investmentRounds: filteredRounds,
      // Convenience: current metrics from quarter data
      currentFMV: quarterData?.currentFMV ?? null,
      currentOwnership: quarterData?.currentOwnershipPercent ?? company.yaliOwnershipPercent,
      multipleOfInvestment: quarterData?.multipleOfInvestment ?? null,
    };
  });

  // 6. Build navigation list (for next/prev in company detail)
  const companyNavList = processedCompanies
    .filter(c => c.slug)
    .map(c => ({ slug: c.slug, name: c.name }));

  return {
    // Quarter info
    quarter,
    fiscalYear,
    quarterStartDate,
    quarterEndDate,

    // Fund data
    fundSettings,
    fundPerformance,
    fundMetrics,

    // Portfolio data
    portfolioCompanies: processedCompanies,
    portfolioCount: processedCompanies.length,
    companyNavList,

    // Media data
    quarterNews,
    quarterSocialUpdates,

    // Helper to check if a company is in scope
    isCompanyInScope: (slug) => companyNavList.some(c => c.slug === slug),

    // Helper to get a specific company's processed data
    getCompany: (slug) => processedCompanies.find(c => c.slug === slug) || null,
  };
}
