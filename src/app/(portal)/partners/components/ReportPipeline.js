'use client';

import styles from './report.module.css';

export default function ReportPipeline({ id, pipeline }) {
  const defaultPipeline = {
    summary: {
      totalDeals: 45,
      activeEvaluation: 12,
      dueDiligence: 5,
      termSheet: 2,
    },
    deals: [
      {
        company: 'Company A',
        sector: 'AI/ML',
        stage: 'Series A',
        status: 'Due Diligence',
        statusType: 'active',
      },
      {
        company: 'Company B',
        sector: 'Robotics',
        stage: 'Seed',
        status: 'Term Sheet',
        statusType: 'active',
      },
      {
        company: 'Company C',
        sector: 'SpaceTech',
        stage: 'Pre-Series A',
        status: 'Under Review',
        statusType: 'review',
      },
      {
        company: 'Company D',
        sector: 'BioTech',
        stage: 'Seed',
        status: 'Due Diligence',
        statusType: 'active',
      },
      {
        company: 'Company E',
        sector: 'Semiconductors',
        stage: 'Series A',
        status: 'Under Review',
        statusType: 'review',
      },
    ],
    sectorBreakdown: [
      { sector: 'AI/ML', count: 15, percentage: '33%' },
      { sector: 'Semiconductors', count: 8, percentage: '18%' },
      { sector: 'Robotics/Automation', count: 7, percentage: '16%' },
      { sector: 'SpaceTech', count: 6, percentage: '13%' },
      { sector: 'BioTech/MedTech', count: 5, percentage: '11%' },
      { sector: 'Others', count: 4, percentage: '9%' },
    ],
  };

  const data = pipeline || defaultPipeline;

  const getStatusClass = (statusType) => {
    switch (statusType) {
      case 'active':
        return styles.statusActive;
      case 'review':
        return styles.statusReview;
      case 'passed':
        return styles.statusPassed;
      default:
        return '';
    }
  };

  return (
    <section id={id} className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.h2}>Pipeline Summary</h2>
      </div>

      <div className={styles.summaryCard}>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Deals Reviewed</span>
            <span className={styles.summaryValue}>{data.summary.totalDeals}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Active Evaluation</span>
            <span className={styles.summaryValue}>{data.summary.activeEvaluation}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>In Due Diligence</span>
            <span className={styles.summaryValue}>{data.summary.dueDiligence}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Term Sheet Stage</span>
            <span className={styles.summaryValue}>{data.summary.termSheet}</span>
          </div>
        </div>
      </div>

      <h3 className={styles.h3}>Active Pipeline</h3>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tableHeader}>
            <th>Company</th>
            <th>Sector</th>
            <th>Stage</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.deals.map((deal, index) => (
            <tr key={index} className={styles.tableRow}>
              <td className={styles.tableCellBold}>{deal.company}</td>
              <td className={styles.tableCell}>{deal.sector}</td>
              <td className={styles.tableCell}>{deal.stage}</td>
              <td className={styles.tableCell}>
                <span className={`${styles.pipelineStatus} ${getStatusClass(deal.statusType)}`}>
                  {deal.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className={styles.h3} style={{ marginTop: '1.5rem' }}>Pipeline by Sector</h3>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tableHeader}>
            <th>Sector</th>
            <th style={{ textAlign: 'right' }}>Deals</th>
            <th style={{ textAlign: 'right' }}>% of Pipeline</th>
          </tr>
        </thead>
        <tbody>
          {data.sectorBreakdown.map((item, index) => (
            <tr key={index} className={styles.tableRow}>
              <td className={styles.tableCell}>{item.sector}</td>
              <td className={styles.tableCellRight}>{item.count}</td>
              <td className={styles.tableCellRight}>{item.percentage}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
