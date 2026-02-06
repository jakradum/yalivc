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
 * Filter investments to only include companies invested on or before a quarter's end date
 * Companies without an investment date are included (legacy data)
 * @param {Array} investments - Array of investment objects with investmentDate field
 * @param {string} quarter - Quarter (Q1, Q2, Q3, Q4)
 * @param {string} fiscalYear - Fiscal year (e.g., "FY26")
 * @returns {Array} Filtered investments
 */
export function getPortfolioCompaniesForQuarter(investments, quarter, fiscalYear) {
  if (!investments || !Array.isArray(investments)) return [];

  const quarterEndDate = getQuarterEndDate(quarter, fiscalYear);
  if (!quarterEndDate) return investments;

  return investments.filter(inv => {
    // Companies without investment date are included (legacy data)
    if (!inv.investmentDate) return true;
    // Only include companies invested on or before the quarter end date
    return inv.investmentDate <= quarterEndDate;
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
