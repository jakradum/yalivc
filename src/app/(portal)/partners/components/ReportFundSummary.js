'use client';

import styles from './report.module.css';

export default function ReportFundSummary({ id, fundData }) {
  const defaultFundData = {
    fundName: 'Yali Capital Deep Tech Fund',
    targetCorpus: '₹300 Cr',
    capitalRaised: '₹225 Cr',
    capitalDeployed: '₹85 Cr',
    portfolioCompanies: 8,
    avgCheckSize: '₹10-12 Cr',
    fundVintage: '2023',
    reportingPeriod: 'Q2 FY26 (Jul-Sep 2024)',
    navPerUnit: '₹1.12',
    irr: '18.5%',
    moic: '1.15x',
    dpiRatio: '0.0x',
    investmentPeriod: '4 years',
    fundLife: '10 years',
  };

  const data = fundData || defaultFundData;

  return (
    <section id={id} className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.h2}>Fund Summary</h2>
      </div>

      <div className={styles.summaryCard}>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Fund Name</span>
            <span className={styles.summaryValueSmall}>{data.fundName}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Reporting Period</span>
            <span className={styles.summaryValueSmall}>{data.reportingPeriod}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Target Corpus</span>
            <span className={styles.summaryValue}>{data.targetCorpus}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Capital Raised</span>
            <span className={styles.summaryValue}>{data.capitalRaised}</span>
          </div>
        </div>
      </div>

      <h3 className={styles.h3}>Deployment Status</h3>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tableHeader}>
            <th>Metric</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr className={styles.tableRow}>
            <td className={styles.tableCell}>Capital Deployed</td>
            <td className={styles.tableCellBold}>{data.capitalDeployed}</td>
          </tr>
          <tr className={styles.tableRow}>
            <td className={styles.tableCell}>Portfolio Companies</td>
            <td className={styles.tableCellBold}>{data.portfolioCompanies}</td>
          </tr>
          <tr className={styles.tableRow}>
            <td className={styles.tableCell}>Average Check Size</td>
            <td className={styles.tableCellBold}>{data.avgCheckSize}</td>
          </tr>
          <tr className={styles.tableRow}>
            <td className={styles.tableCell}>Fund Vintage</td>
            <td className={styles.tableCellBold}>{data.fundVintage}</td>
          </tr>
        </tbody>
      </table>

      <h3 className={styles.h3}>Performance Metrics</h3>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tableHeader}>
            <th>Metric</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr className={styles.tableRow}>
            <td className={styles.tableCell}>NAV per Unit</td>
            <td className={styles.tableCellBold}>{data.navPerUnit}</td>
          </tr>
          <tr className={styles.tableRow}>
            <td className={styles.tableCell}>Gross IRR</td>
            <td className={styles.tableCellBold}>{data.irr}</td>
          </tr>
          <tr className={styles.tableRow}>
            <td className={styles.tableCell}>MOIC (Multiple on Invested Capital)</td>
            <td className={styles.tableCellBold}>{data.moic}</td>
          </tr>
          <tr className={styles.tableRow}>
            <td className={styles.tableCell}>DPI (Distributions to Paid-In)</td>
            <td className={styles.tableCellBold}>{data.dpiRatio}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
