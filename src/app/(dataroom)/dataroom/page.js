import Link from 'next/link';
import {
  getDataRoomTrackRecords,
  getDataroomSectionVisibility,
  getDataroomFundContent,
  getLatestLPReportForDataRoom,
} from '@/lib/sanity-queries';
import DataroomTopbar from './DataroomTopbar';
import styles from './dataroom.module.css';

export const dynamic = 'force-dynamic';

const CATEGORIES = [
  {
    slug: 'track-record',
    visibilityKey: 'trackRecord',
    title: 'Track Record & Recommendation',
    description:
      'Historical investments, exit performance, and third-party references',
    icon: 'chart',
  },
];

function CategoryIcon({ icon }) {
  switch (icon) {
    case 'chart':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <polyline points="2,12 5,8 8,10 11,5 14,7" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <circle cx="14" cy="7" r="1.2" fill="currentColor" opacity="0.7" />
        </svg>
      );
    case 'investor-docs':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="1" width="10" height="2" stroke="currentColor" strokeWidth="1.1" fill="none" />
          <rect x="2" y="4" width="12" height="11" stroke="currentColor" strokeWidth="1.1" fill="none" />
          <line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="0.9" opacity="0.7" />
          <line x1="5" y1="10.5" x2="9" y2="10.5" stroke="currentColor" strokeWidth="0.9" opacity="0.7" />
        </svg>
      );
    default:
      return null;
  }
}

export default async function DataroomPage() {
  const [trackRecords, sectionVisibility, fundContent, latestLPReport] = await Promise.all([
    getDataRoomTrackRecords(),
    getDataroomSectionVisibility(),
    getDataroomFundContent(),
    getLatestLPReportForDataRoom(),
  ]);

  const allTrackRecords = trackRecords || [];

  const vis = sectionVisibility || {};
  const displayCategories = CATEGORIES.filter(
    (cat) => vis[cat.visibilityKey] !== false && allTrackRecords.length > 0
  );

  function getCount(cat) {
    if (cat.slug === 'track-record') return allTrackRecords.length;
    return null;
  }

  function getCountLabel(cat) {
    if (cat.slug === 'track-record') return 'items';
    return 'documents';
  }

  return (
    <div className={styles.page}>
      <DataroomTopbar />
      <div className={styles.hero}>
        <div>
          <div className={styles.heroTitle}>Yali Investors&rsquo; Data Room</div>
          <div className={styles.heroSub}>Select a category to browse documents</div>
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.sectionLabel}>Categories</div>
        <div className={styles.grid}>
          {displayCategories.map((cat) => {
            const count = getCount(cat);
            const label = getCountLabel(cat);
            return (
              <Link
                key={cat.slug}
                href={`/dataroom/${cat.slug}`}
                className={styles.card}
              >
                <div className={styles.cardIcon}>
                  <CategoryIcon icon={cat.icon} />
                </div>
                <div className={styles.cardTitle}>{cat.title}</div>
                <div className={styles.cardDesc}>{cat.description}</div>
                <div className={styles.cardFooter}>
                  <div className={styles.cardCount}>
                    {count != null ? `${count} ${label}` : ''}
                  </div>
                  <div className={styles.cardArrow}>&#x2192;</div>
                </div>
              </Link>
            );
          })}

          {/* Investor Documents — scrolls to table below */}
          <a href="#investor-docs" className={`${styles.card} ${styles.cardInvestorDocs}`}>
            <div className={`${styles.cardIcon} ${styles.cardIconCrimson}`}>
              <CategoryIcon icon="investor-docs" />
            </div>
            <div className={`${styles.cardTitle} ${styles.cardTitleCrimson}`}>Investor Documents</div>
            <div className={styles.cardDesc}>Fund I &middot; Fund II &middot; Common</div>
            <div className={styles.cardDesc}>Presentations, reports, and team documents</div>
            <div className={styles.cardFooter}>
              <div />
              <div className={styles.cardArrowDown}>&#x2193;</div>
            </div>
          </a>
        </div>

        {/* ── Investor Documents Table ── */}
        <div id="investor-docs" className={styles.investorDocsWrap}>
          <table className={styles.investorDocsTable}>
            <thead>
              <tr>
                <th className={styles.investorDocsTh}>Section</th>
                <th className={styles.investorDocsTh}>Document</th>
                <th className={styles.investorDocsTh} />
              </tr>
            </thead>
            <tbody>
              {fundContent?.fundISlideDeckUrl && (
                <tr className={styles.investorDocsTr}>
                  <td className={`${styles.investorDocsTd} ${styles.investorDocsTdSection}`}>Fund I</td>
                  <td className={styles.investorDocsTd}>Fund I presentation</td>
                  <td className={`${styles.investorDocsTd} ${styles.investorDocsTdActions}`}>
                    <a href={fundContent.fundISlideDeckUrl} target="_blank" rel="noopener noreferrer" className={styles.investorDocsAction}>View</a>
                    <a href={fundContent.fundISlideDeckUrl} download="Fund-I-Presentation.pdf" target="_blank" rel="noopener noreferrer" className={styles.investorDocsAction}>Download</a>
                  </td>
                </tr>
              )}
              {latestLPReport?.pdfUrl && (
                <tr className={styles.investorDocsTr}>
                  <td className={`${styles.investorDocsTd} ${styles.investorDocsTdSection}`}>Fund I</td>
                  <td className={styles.investorDocsTd}>
                    <span>Latest quarterly report</span>
                    {latestLPReport.quarter && latestLPReport.fiscalYear && (
                      <span className={styles.investorDocsTdDocMeta}>
                        {latestLPReport.quarter} {latestLPReport.fiscalYear}
                      </span>
                    )}
                  </td>
                  <td className={`${styles.investorDocsTd} ${styles.investorDocsTdActions}`}>
                    <a href={latestLPReport.pdfUrl} target="_blank" rel="noopener noreferrer" className={styles.investorDocsAction}>View</a>
                    <a href={latestLPReport.pdfUrl} download={`${latestLPReport.title || 'LP-Report'}.pdf`} target="_blank" rel="noopener noreferrer" className={styles.investorDocsAction}>Download</a>
                  </td>
                </tr>
              )}
              <tr className={`${styles.investorDocsTr} ${styles.investorDocsTrLast}`}>
                <td className={`${styles.investorDocsTd} ${styles.investorDocsTdSection}`}>Fund II</td>
                {fundContent?.fundIIThesisPresentationUrl ? (
                  <>
                    <td className={styles.investorDocsTd}>Thesis presentation</td>
                    <td className={`${styles.investorDocsTd} ${styles.investorDocsTdActions}`}>
                      <a href={fundContent.fundIIThesisPresentationUrl} target="_blank" rel="noopener noreferrer" className={styles.investorDocsAction}>View</a>
                      <a href={fundContent.fundIIThesisPresentationUrl} download="Fund-II-Thesis-Presentation.pdf" target="_blank" rel="noopener noreferrer" className={styles.investorDocsAction}>Download</a>
                    </td>
                  </>
                ) : (
                  <>
                    <td className={`${styles.investorDocsTd} ${styles.investorDocsComingSoon}`}>Thesis presentation — coming soon</td>
                    <td className={styles.investorDocsTd} />
                  </>
                )}
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
