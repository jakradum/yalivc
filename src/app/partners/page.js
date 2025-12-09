import Link from 'next/link';
import { getLPReports } from '@/lib/sanity-queries';
import styles from './partners.module.css';

export const revalidate = 60;

export default async function PartnersPortal() {
  const reports = await getLPReports();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className={styles.container}>
      {/* Welcome Section */}
      <section className={styles.welcomeSection}>
        <h1 className={styles.welcomeTitle}>Welcome to the Partners Portal</h1>
        <p className={styles.welcomeText}>
          Access quarterly reports, fund updates, and key performance metrics for Yali Capital Deep Tech Fund.
        </p>
      </section>

      {/* Reports Section */}
      <section className={styles.reportsSection}>
        <h2 className={styles.sectionTitle}>Quarterly Reports</h2>

        {reports && reports.length > 0 ? (
          <div className={styles.reportsGrid}>
            {reports.map((report) => (
              <div key={report._id} className={styles.reportCard}>
                <div className={styles.reportHeader}>
                  <span className={styles.reportQuarter}>
                    {report.quarter} {report.fiscalYear}
                  </span>
                  <span className={styles.reportDate}>
                    {formatDate(report.publishedAt)}
                  </span>
                </div>

                <h3 className={styles.reportTitle}>{report.title}</h3>

                {report.summary && (
                  <p className={styles.reportSummary}>{report.summary}</p>
                )}

                {report.highlights && report.highlights.length > 0 && (
                  <ul className={styles.reportHighlights}>
                    {report.highlights.slice(0, 3).map((highlight, index) => (
                      <li key={index}>{highlight}</li>
                    ))}
                  </ul>
                )}

                <div className={styles.reportActions}>
                  <Link
                    href={`/partners/reports/${report.slug.current}`}
                    className={styles.viewButton}
                  >
                    View Report
                  </Link>
                  {report.pdfUrl && (
                    <a
                      href={report.pdfUrl}
                      download
                      className={styles.downloadButton}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No reports available yet. Check back soon for updates.</p>
          </div>
        )}
      </section>

      {/* Contact Section */}
      <section className={styles.contactSection}>
        <h2 className={styles.sectionTitle}>Questions?</h2>
        <p>
          For any questions regarding the reports or fund performance, please reach out to our
          Investor Relations team at{' '}
          <a href="mailto:ir@yali.vc" className={styles.emailLink}>ir@yali.vc</a>
        </p>
      </section>
    </div>
  );
}
