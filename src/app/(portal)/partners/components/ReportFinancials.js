'use client';

import styles from './report.module.css';

export default function ReportFinancials({ id, financials }) {
  const defaultFinancials = {
    capitalAccount: [
      { item: 'Opening Capital Balance', value: '₹200.00 Cr' },
      { item: 'Capital Calls during Quarter', value: '₹25.00 Cr' },
      { item: 'Distributions during Quarter', value: '₹0.00 Cr' },
      { item: 'Closing Capital Balance', value: '₹225.00 Cr' },
    ],
    deploymentSummary: [
      { item: 'Total Capital Deployed', value: '₹85.00 Cr' },
      { item: 'Deployed this Quarter', value: '₹18.00 Cr' },
      { item: 'Reserved for Follow-ons', value: '₹40.00 Cr' },
      { item: 'Available for New Investments', value: '₹100.00 Cr' },
    ],
    portfolioValuation: [
      { item: 'Cost Basis (Investments at Cost)', value: '₹85.00 Cr' },
      { item: 'Current Fair Value', value: '₹97.75 Cr' },
      { item: 'Unrealized Gain/(Loss)', value: '₹12.75 Cr' },
      { item: 'Unrealized Gain %', value: '15.0%' },
    ],
    fees: [
      { item: 'Management Fee (2% p.a.)', value: '₹1.12 Cr' },
      { item: 'Operating Expenses', value: '₹0.15 Cr' },
      { item: 'Total Fees & Expenses', value: '₹1.27 Cr' },
    ],
  };

  const data = financials || defaultFinancials;

  const renderTable = (title, items) => (
    <>
      <h3 className={styles.h3}>{title}</h3>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tableHeader}>
            <th>Description</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row, index) => (
            <tr key={index} className={styles.tableRow}>
              <td className={styles.tableCell}>{row.item}</td>
              <td className={styles.tableCellRight}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  return (
    <section id={id} className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.h2}>Fund Financials</h2>
      </div>

      {renderTable('Capital Account', data.capitalAccount)}
      {renderTable('Deployment Summary', data.deploymentSummary)}
      {renderTable('Portfolio Valuation', data.portfolioValuation)}
      {renderTable('Fees & Expenses (Quarter)', data.fees)}

      <p className={styles.caption} style={{ marginTop: '1rem' }}>
        * All figures are as of the reporting date. Valuations are based on latest funding rounds
        or internal fair value assessments in accordance with IPEV guidelines.
      </p>
    </section>
  );
}
