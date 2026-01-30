'use client';

import styles from './report.module.css';

export default function ReportFundSummary({ id, fundData }) {
  // --- Helpers for formatting to match Screenshot ---
  
  // Format Date: "2024-07-15" -> "15 Jul '24"
  const formatDate = (dateString) => {
    if (!dateString) return 'Not entered';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    }).replace(/ (\d{2})$/, " '$1"); // Adds the apostrophe before year
  };

  // Format Number: 879.443 -> "879.44"
  // Returns "Not entered" if null/undefined
  const formatNum = (val, decimals = 2) => {
    if (val === undefined || val === null) return 'Not entered';
    // If it's effectively 0 but might be null in data, handle carefully
    if (val === 0 && 1 / val === -Infinity) return '0.00'; 
    return Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // --- Data Mapping ---
  const data = {
    // Header Data
    reportingPeriod: fundData?.reportingPeriod || '30 Sep \'25',
    fundSizeHeader: fundData?.fundSizeAtClose 
      ? `₹${Math.round(fundData.fundSizeAtClose)} crore` 
      : 'Not entered',

    // Row Data (Exact order from screenshot)
    firstCloseDate: formatDate(fundData?.firstCloseDate),
    finalCloseDate: formatDate(fundData?.finalCloseDate),
    fundSizeAtClose: formatNum(fundData?.fundSizeAtClose),
    amountDrawnDown: formatNum(fundData?.amountDrawnDown), // New Field
    totalInvested: formatNum(fundData?.totalInvested),     // New Field
    fmv: formatNum(fundData?.fairMarketValue),             // New Field
    portfolioCompanies: fundData?.portfolioCompanies ?? 'Not entered',
    amountReturned: fundData?.amountReturned !== undefined 
      ? formatNum(fundData.amountReturned) 
      : '-', // Screenshot shows "-" for empty/zero sometimes
    moic: formatNum(fundData?.moic, 2),
    tvpi: formatNum(fundData?.tvpi, 2),
    dpi: formatNum(fundData?.dpi, 4), // Screenshot shows 4 decimals for DPI
  };

  return (
    <section id={id} className={styles.section}>
      {/* 1. Top Headline */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.h2} style={{ fontSize: '1.1rem', fontWeight: '500' }}>
          Combined size of both funds at final close: {data.fundSizeHeader}
        </h2>
      </div>

      {/* 2. Main Data Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHeader}>
              <th style={{ textAlign: 'left', padding: '12px 0', borderBottom: '2px solid #8e1b36', color: '#8e1b36' }}>
                As of {data.reportingPeriod}
              </th>
              <th style={{ textAlign: 'right', padding: '12px 0', borderBottom: '2px solid #8e1b36', color: '#8e1b36' }}>
                Amount in ₹ crores
              </th>
            </tr>
          </thead>
          <tbody>
            <Row label="First close date" value={data.firstCloseDate} />
            <Row label="Final close date" value={data.finalCloseDate} />
            <Row label="Fund size at final close" value={data.fundSizeAtClose} />
            <Row label="Amount drawn down as per bank" value={data.amountDrawnDown} />
            <Row label="Total invested in portfolio" value={data.totalInvested} />
            <Row label="Fair Market Value of Portfolio Investments (including realised value)" value={data.fmv} />
            <Row label="Number of portfolio companies" value={data.portfolioCompanies} isInteger />
            <Row label="Amount returned (including passive income returned)" value={data.amountReturned} />
            <Row label="MOIC" value={data.moic} isRatio />
            <Row label="TVPI" value={data.tvpi} isRatio />
            <Row label="DPI" value={data.dpi} isRatio />
          </tbody>
        </table>
      </div>
    </section>
  );
}

// Simple Sub-component for cleaner rows
function Row({ label, value, isRatio, isInteger }) {
  // Styles matching the screenshot's clean look
  const rowStyle = {
    borderBottom: '1px solid #e0e0e0',
    fontSize: '0.95rem',
    color: '#333'
  };

  const cellPadding = { padding: '12px 0' };

  return (
    <tr style={rowStyle}>
      <td style={{ ...cellPadding, textAlign: 'left' }}>{label}</td>
      <td style={{ ...cellPadding, textAlign: 'right', fontWeight: '500' }}>
        {value}
      </td>
    </tr>
  );
}