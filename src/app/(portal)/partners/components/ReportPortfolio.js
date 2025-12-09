'use client';

import styles from './report.module.css';

export default function ReportPortfolio({ id, investments }) {
  const defaultInvestments = [
    {
      company: 'TechCo AI',
      sector: 'Enterprise AI',
      stage: 'Series A',
      invested: '₹12 Cr',
      ownership: '8.5%',
      valuation: '₹142 Cr',
      status: 'Performing',
    },
    {
      company: 'SemiChip Labs',
      sector: 'Semiconductors',
      stage: 'Seed',
      invested: '₹8 Cr',
      ownership: '12%',
      valuation: '₹67 Cr',
      status: 'Performing',
    },
    {
      company: 'QuantumSafe',
      sector: 'Cybersecurity',
      stage: 'Series A',
      invested: '₹15 Cr',
      ownership: '6.2%',
      valuation: '₹242 Cr',
      status: 'Outperforming',
    },
    {
      company: 'BioGenix',
      sector: 'BioTech',
      stage: 'Seed',
      invested: '₹10 Cr',
      ownership: '15%',
      valuation: '₹67 Cr',
      status: 'Performing',
    },
    {
      company: 'RoboFlow',
      sector: 'Robotics',
      stage: 'Series A',
      invested: '₹12 Cr',
      ownership: '7.8%',
      valuation: '₹154 Cr',
      status: 'Performing',
    },
    {
      company: 'SpaceTech India',
      sector: 'Aerospace',
      stage: 'Seed',
      invested: '₹8 Cr',
      ownership: '10%',
      valuation: '₹80 Cr',
      status: 'Performing',
    },
    {
      company: 'CleanEnergy AI',
      sector: 'CleanTech',
      stage: 'Pre-Series A',
      invested: '₹10 Cr',
      ownership: '11%',
      valuation: '₹91 Cr',
      status: 'Performing',
    },
    {
      company: 'MedDevice Pro',
      sector: 'MedTech',
      stage: 'Series A',
      invested: '₹10 Cr',
      ownership: '5.5%',
      valuation: '₹182 Cr',
      status: 'Outperforming',
    },
  ];

  const data = investments || defaultInvestments;

  return (
    <section id={id} className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.h2}>Portfolio Investments</h2>
      </div>

      <p className={styles.body}>
        The fund has deployed capital across {data.length} portfolio companies spanning deep tech sectors
        including AI/ML, semiconductors, robotics, aerospace, and biotechnology.
      </p>

      <table className={styles.table}>
        <thead>
          <tr className={styles.tableHeader}>
            <th>Company</th>
            <th>Sector</th>
            <th>Stage</th>
            <th>Invested</th>
            <th>Ownership</th>
            <th>Valuation</th>
          </tr>
        </thead>
        <tbody>
          {data.map((investment, index) => (
            <tr key={index} className={styles.tableRow}>
              <td className={styles.tableCellBold}>{investment.company}</td>
              <td className={styles.tableCell}>{investment.sector}</td>
              <td className={styles.tableCell}>{investment.stage}</td>
              <td className={styles.tableCellRight}>{investment.invested}</td>
              <td className={styles.tableCellRight}>{investment.ownership}</td>
              <td className={styles.tableCellRight}>{investment.valuation}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '1.5rem' }}>
        <p className={styles.caption}>
          * Valuations are based on the latest funding round or internal assessment as of the reporting date.
          Ownership percentages are on a fully diluted basis.
        </p>
      </div>
    </section>
  );
}
