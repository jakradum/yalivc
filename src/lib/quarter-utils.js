/**
 * Quarter utility functions for Yali Capital
 *
 * Fiscal year quarters:
 * Q1: April 1 - June 30
 * Q2: July 1 - September 30
 * Q3: October 1 - December 31
 * Q4: January 1 - March 31
 */

/**
 * Get the current quarter and fiscal year based on a date
 * @param {Date} date - The date to evaluate (defaults to now)
 * @returns {Object} { quarter: 'Q1'|'Q2'|'Q3'|'Q4', fiscalYear: 'FY26', displayYear: '2025-26' }
 */
export function getCurrentQuarter(date = new Date()) {
  const month = date.getMonth(); // 0-11
  const year = date.getFullYear();

  let quarter;
  let fiscalYearStart;

  // Determine quarter based on month
  if (month >= 3 && month <= 5) {
    // April (3) to June (5) = Q1
    quarter = 'Q1';
    fiscalYearStart = year;
  } else if (month >= 6 && month <= 8) {
    // July (6) to September (8) = Q2
    quarter = 'Q2';
    fiscalYearStart = year;
  } else if (month >= 9 && month <= 11) {
    // October (9) to December (11) = Q3
    quarter = 'Q3';
    fiscalYearStart = year;
  } else {
    // January (0) to March (2) = Q4
    quarter = 'Q4';
    fiscalYearStart = year - 1; // Fiscal year started previous calendar year
  }

  const fiscalYearEnd = fiscalYearStart + 1;
  const fiscalYearShort = `FY${fiscalYearEnd.toString().slice(-2)}`;
  const displayYear = `${fiscalYearStart}-${fiscalYearEnd.toString().slice(-2)}`;

  return {
    quarter,
    fiscalYear: fiscalYearShort, // e.g., "FY26"
    displayYear, // e.g., "2025-26"
    fiscalYearStart,
    fiscalYearEnd
  };
}

/**
 * Get quarter and fiscal year from a date string
 * @param {string} dateString - ISO date string
 * @returns {Object} { quarter: 'Q1'|'Q2'|'Q3'|'Q4', fiscalYear: 'FY26', displayYear: '2025-26' }
 */
export function getQuarterFromDate(dateString) {
  if (!dateString) return null;
  return getCurrentQuarter(new Date(dateString));
}

/**
 * Parse fiscal year string to get start and end years
 * @param {string} fiscalYear - e.g., "FY26" or "2025-26"
 * @returns {Object} { startYear: 2025, endYear: 2026 }
 */
export function parseFiscalYear(fiscalYear) {
  if (!fiscalYear) return null;

  // Handle "FY26" format
  if (fiscalYear.startsWith('FY')) {
    const endYearShort = fiscalYear.slice(2);
    const endYear = 2000 + parseInt(endYearShort);
    return {
      startYear: endYear - 1,
      endYear
    };
  }

  // Handle "2025-26" format
  if (fiscalYear.includes('-')) {
    const [startYear, endYearShort] = fiscalYear.split('-');
    const endYear = endYearShort.length === 2
      ? 2000 + parseInt(endYearShort)
      : parseInt(endYearShort);
    return {
      startYear: parseInt(startYear),
      endYear
    };
  }

  return null;
}

/**
 * Convert fiscal year to display format
 * @param {string} fiscalYear - e.g., "FY26"
 * @returns {string} e.g., "2025-26"
 */
export function fiscalYearToDisplay(fiscalYear) {
  const parsed = parseFiscalYear(fiscalYear);
  if (!parsed) return fiscalYear;
  return `${parsed.startYear}-${parsed.endYear.toString().slice(-2)}`;
}

/**
 * Compare two quarter/fiscal year combinations
 * @param {string} q1 - Quarter (e.g., "Q1")
 * @param {string} fy1 - Fiscal year (e.g., "FY26")
 * @param {string} q2 - Quarter to compare
 * @param {string} fy2 - Fiscal year to compare
 * @returns {number} -1 if q1/fy1 is earlier, 0 if equal, 1 if later
 */
export function compareQuarters(q1, fy1, q2, fy2) {
  const fy1Parsed = parseFiscalYear(fy1);
  const fy2Parsed = parseFiscalYear(fy2);

  if (!fy1Parsed || !fy2Parsed) return 0;

  // Compare fiscal years first
  if (fy1Parsed.endYear < fy2Parsed.endYear) return -1;
  if (fy1Parsed.endYear > fy2Parsed.endYear) return 1;

  // Same fiscal year, compare quarters
  const q1Num = parseInt(q1.replace('Q', ''));
  const q2Num = parseInt(q2.replace('Q', ''));

  if (q1Num < q2Num) return -1;
  if (q1Num > q2Num) return 1;
  return 0;
}

/**
 * Check if a quarter/fiscal year is after an investment date
 * @param {string} quarter - e.g., "Q1"
 * @param {string} fiscalYear - e.g., "FY26"
 * @param {string} investmentDate - ISO date string
 * @returns {boolean}
 */
export function isQuarterAfterInvestment(quarter, fiscalYear, investmentDate) {
  if (!investmentDate) return true;

  const invDate = new Date(investmentDate);
  const invQuarter = getCurrentQuarter(invDate);

  return compareQuarters(quarter, fiscalYear, invQuarter.quarter, invQuarter.fiscalYear) >= 0;
}

/**
 * Get all quarters between two dates
 * @param {string} startDate - ISO date string
 * @param {string} endDate - ISO date string (defaults to now)
 * @returns {Array} Array of { quarter, fiscalYear, displayYear } objects
 */
export function getQuartersBetween(startDate, endDate = null) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();

  const quarters = [];
  const startQ = getCurrentQuarter(start);
  const endQ = getCurrentQuarter(end);

  let currentYear = startQ.fiscalYearStart;
  let currentQuarter = parseInt(startQ.quarter.replace('Q', ''));

  const endYear = endQ.fiscalYearStart;
  const endQuarterNum = parseInt(endQ.quarter.replace('Q', ''));

  while (
    currentYear < endYear ||
    (currentYear === endYear && currentQuarter <= endQuarterNum)
  ) {
    const fiscalYearEnd = currentYear + 1;
    quarters.push({
      quarter: `Q${currentQuarter}`,
      fiscalYear: `FY${fiscalYearEnd.toString().slice(-2)}`,
      displayYear: `${currentYear}-${fiscalYearEnd.toString().slice(-2)}`
    });

    currentQuarter++;
    if (currentQuarter > 4) {
      currentQuarter = 1;
      currentYear++;
    }
  }

  return quarters;
}
