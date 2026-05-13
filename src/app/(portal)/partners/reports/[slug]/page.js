import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getLPReportBySlug } from '@/lib/sanity-queries';
import { verifySession } from '@/lib/session';
import styles from '../../partners.module.css';

export const dynamic = 'force-dynamic';

// Generate metadata
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const report = await getLPReportBySlug(slug);

  if (!report) {
    return {
      title: 'Report Not Found | Partners Portal',
    };
  }

  return {
    title: `${report.title} | Partners Portal | Yali Capital`,
    description: report.summary || `${report.quarter} ${report.fiscalYear} Quarterly Report`,
    robots: 'noindex, nofollow',
  };
}

export default async function ReportPage({ params }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get('portal-session')?.value;
  const userEmail = cookieValue ? verifySession(cookieValue) : null;
  if (cookieValue && userEmail === null) redirect('/partners/sign-in');
  const report = await getLPReportBySlug(slug);

  if (!report) {
    notFound();
  }

  if (report.visibility === 'internal' && !userEmail?.endsWith('@yali.vc')) {
    redirect('/partners');
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className={styles.container}>
      {/* Back Link */}
      <Link href="/partners" className={styles.backLink}>
        ← Back to all reports
      </Link>

      {/* Report Header */}
      <header className={styles.reportPageHeader}>
        <div className={styles.reportMeta}>
          <span className={styles.reportQuarterLarge}>
            {report.quarter} {report.fiscalYear}
          </span>
          <span className={styles.reportDateLarge}>
            Published {formatDate(report.publishedAt)}
          </span>
        </div>
        <h1 className={styles.reportPageTitle}>{report.title}</h1>
        {report.summary && (
          <p className={styles.reportPageSummary}>{report.summary}</p>
        )}
      </header>

      {/* Highlights */}
      {report.highlights && report.highlights.length > 0 && (
        <section className={styles.highlightsSection}>
          <h2 className={styles.highlightsTitle}>Key Highlights</h2>
          <ul className={styles.highlightsList}>
            {report.highlights.map((highlight, index) => (
              <li key={index} className={styles.highlightItem}>
                {highlight}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* PDF Actions */}
      <section className={styles.pdfSection}>
        <h2 className={styles.pdfTitle}>Full Report</h2>

        {report.pdfUrl && (
          <div className={styles.pdfActions}>
            <a
              href={report.pdfUrl}
              download={report.pdfFileName || `${report.title}.pdf`}
              className={styles.downloadButtonLarge}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download PDF
            </a>

            {/* PDF Embed */}
            <div className={styles.pdfEmbed}>
              <iframe
                src={`${report.pdfUrl}#view=FitH`}
                title={report.title}
                className={styles.pdfViewer}
              />
            </div>
          </div>
        )}
      </section>

      {/* Disclaimer */}
      <section className={styles.disclaimer}>
        <p>
          <strong>Confidential:</strong> This report is intended solely for authorized Limited Partners
          of Yali Capital Deep Tech Fund. Unauthorized distribution or reproduction is prohibited.
        </p>
      </section>
    </div>
  );
}
