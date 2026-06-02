import styles from './disclosures.module.css';

export const metadata = {
  title: 'Regulatory Disclosures | Yali Capital',
  description: 'SEBI registration details and regulatory disclosures for Yali Deeptech Fund I, managed by Yali Partners LLP.',
  alternates: {
    canonical: 'https://yali.vc/disclosures/',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Disclosures() {
  return (
    <div className={styles.page}>

      {/* Header band */}
      <div className={styles.heroBand}>
        <div className={styles.tag}>DISCLOSURES</div>
        <h1 className={styles.title}>Regulatory Disclosures</h1>
        <p className={styles.subtitle}>
          SEBI registration and compliance information for Yali Partners LLP
        </p>
      </div>

      <div className={styles.content}>

        {/* SEBI registration details */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>SEBI Registration</h2>
          <div className={styles.detailList}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Name of the Fund</span>
              <span className={styles.detailValue}>Yali Deeptech Fund I</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Category of AIF</span>
              <span className={styles.detailValue}>Category II</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>SEBI Registration No</span>
              <span className={`${styles.detailValue} ${styles.mono}`}>IN/AIF2/23-24/1438</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Date of Registration</span>
              <span className={styles.detailValue}>January 29, 2024</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>AIF Manager</span>
              <span className={styles.detailValue}>Yali Partners LLP</span>
            </div>
          </div>
        </section>

        {/* Grievance section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Investor Grievances</h2>
          <p className={styles.body}>
            Investor grievances can be emailed to{' '}
            <a href="mailto:investor.relations@yali.vc" className={styles.link}>
              investor.relations@yali.vc
            </a>
            .
          </p>
        </section>

        {/* Complaint policy */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Complaint Handling Policy</h2>
          <p className={styles.body}>
            Our complaint handling and grievance redressal policy is available as a{' '}
            <a
              href="/complaint-handling-policy.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              downloadable PDF
            </a>
            .
          </p>
        </section>

      </div>
    </div>
  );
}
