'use client';

import styles from './report.module.css';
import ReportCompanyCard from './ReportCompanyCard';

export default function ReportCompanyUpdates({ id, portfolioData, companies }) {
  // Use portfolioData from Sanity if available, otherwise fall back to companies prop
  const data = portfolioData || companies;

  // Default data if nothing is provided
  const defaultPortfolio = [
    {
      company: {
        name: 'TechCo AI',
        oneLiner: 'Enterprise AI platform for manufacturing',
        detail: 'TechCo AI builds enterprise-grade artificial intelligence solutions for the manufacturing sector, helping companies optimize production lines and reduce downtime through predictive maintenance.',
        category: { name: 'Enterprise AI' },
      },
      dateOfFirstInvestment: '2023-06-15',
      fundingRound: 'Series A',
      totalAmountInvested: 12,
      ownershipFullyDiluted: 8.5,
      fmv: 142,
      amountReturnedToInvestors: '-',
      multipleOfInvestment: 1.18,
      keyCoInvestors: ['Accel', 'Sequoia'],
    },
    {
      company: {
        name: 'QuantumSafe',
        oneLiner: 'Post-quantum cryptography solutions',
        detail: 'QuantumSafe develops quantum-resistant encryption technologies to protect enterprises and governments from future quantum computing threats.',
        category: { name: 'Cybersecurity' },
      },
      dateOfFirstInvestment: '2022-09-20',
      fundingRound: 'Series A',
      totalAmountInvested: 15,
      ownershipFullyDiluted: 6.2,
      fmv: 242,
      amountReturnedToInvestors: '-',
      multipleOfInvestment: 1.61,
      keyCoInvestors: ['Matrix Partners', 'Lightspeed'],
    },
    {
      company: {
        name: 'SemiChip Labs',
        oneLiner: 'RISC-V based custom silicon',
        detail: 'SemiChip Labs designs custom semiconductor solutions using open RISC-V architecture, enabling cost-effective chip design for IoT and edge computing applications.',
        category: { name: 'Semiconductors' },
      },
      dateOfFirstInvestment: '2024-01-10',
      fundingRound: 'Seed',
      totalAmountInvested: 8,
      ownershipFullyDiluted: 12,
      fmv: 67,
      amountReturnedToInvestors: '-',
      multipleOfInvestment: 0.84,
      keyCoInvestors: ['Peak XV'],
    },
    {
      company: {
        name: 'MedDevice Pro',
        oneLiner: 'AI-powered diagnostic devices',
        detail: 'MedDevice Pro creates FDA-cleared AI diagnostic devices that enable faster and more accurate disease detection, with a focus on underserved healthcare markets.',
        category: { name: 'MedTech' },
      },
      dateOfFirstInvestment: '2023-03-05',
      fundingRound: 'Series A',
      totalAmountInvested: 10,
      ownershipFullyDiluted: 5.5,
      fmv: 182,
      amountReturnedToInvestors: '-',
      multipleOfInvestment: 1.82,
      keyCoInvestors: ['Healthcare Ventures', 'General Catalyst'],
    },
  ];

  const portfolioItems = data || defaultPortfolio;

  return (
    <section id={id} className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.h2}>Portfolio Companies</h2>
      </div>

      <p className={styles.body} style={{ marginBottom: '2rem' }}>
        Detailed investment data for each portfolio company as of the reporting period.
      </p>

      {portfolioItems.map((item, index) => (
        <ReportCompanyCard
          key={item.company?._id || index}
          portfolioData={item}
        />
      ))}
    </section>
  );
}
