import { cookies } from 'next/headers';
import {
  getDataroomFundContent,
  getLatestLPReportForDataRoom,
} from '@/lib/sanity-queries';
import DataroomTopbar from './DataroomTopbar';
import DrSidebar from './DrSidebar';
import DrTableRow from './DrTableRow';
import styles from './dataroom.module.css';

export const dynamic = 'force-dynamic';

export default async function DataroomPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get('dataroom-session')?.value;
  const email = session ? session.split(':')[0] : null;

  const [fundContent, latestLPReport] = await Promise.all([
    getDataroomFundContent(),
    getLatestLPReportForDataRoom(),
  ]);

  const recDocs = fundContent?.commonRecommendationDocuments || [];

  const fundICount = [fundContent?.fundISlideDeckUrl, latestLPReport?.pdfUrl].filter(Boolean).length;
  const fundIICount = fundContent?.fundIIThesisPresentationUrl ? 1 : 0;
  const othersCount = 1 + recDocs.filter((d) => d.fileUrl).length;

  const lrLabel = latestLPReport?.quarter && latestLPReport?.fiscalYear
    ? `Latest quarterly report — ${latestLPReport.quarter} ${latestLPReport.fiscalYear}`
    : 'Latest quarterly report';

  return (
    <div className={styles.page}>
      <DataroomTopbar />
      <div className={styles.drLayout}>

        {/* ── Sidebar ── */}
        <DrSidebar
          activeCategory={null}
          fundContent={fundContent}
          latestLPReport={latestLPReport}
          recDocs={recDocs}
          email={email}
        />

        {/* ── Main content ── */}
        <main id="dr-main-scroll" className={styles.drMain}>
          <h1 className={styles.drMobileTitle}>Yali Investors&rsquo; Data Room</h1>
          <div className={styles.drTableWrapper}>
            <table className={styles.drTable}>
              <thead>
                <tr>
                  <th className={styles.drTh}>Document</th>
                  <th className={styles.drTh}>Type</th>
                  <th className={`${styles.drTh} ${styles.drThActions}`} />
                </tr>
              </thead>
              <tbody>

                {/* ── Fund I ── */}
                <tr id="fund-i" className={styles.drGroupRow}>
                  <td colSpan={3} className={styles.drGroupCell}>
                    ▾ FUND I{fundICount > 0 ? ` · ${fundICount} document${fundICount !== 1 ? 's' : ''}` : ''}
                  </td>
                </tr>
                {fundContent?.fundISlideDeckUrl && (
                  <DrTableRow
                    href={fundContent.fundISlideDeckUrl}
                    label="Fund I presentation"
                  >
                    <td className={styles.drTd}>Fund I presentation</td>
                    <td className={styles.drTd}><span className={styles.drTypeTag}>PDF</span></td>
                    <td className={styles.drTdActions}>
                      <a href={`${fundContent.fundISlideDeckUrl}?dl=Fund-I-Presentation.pdf`} className={styles.drAction}>Download</a>
                    </td>
                  </DrTableRow>
                )}
                {latestLPReport?.pdfUrl && (
                  <DrTableRow
                    href={latestLPReport.pdfUrl}
                    label={lrLabel}
                  >
                    <td className={styles.drTd}>
                      Latest quarterly report
                      {latestLPReport.quarter && latestLPReport.fiscalYear && (
                        <span className={styles.drDocMeta}>{latestLPReport.quarter} {latestLPReport.fiscalYear}</span>
                      )}
                    </td>
                    <td className={styles.drTd}><span className={styles.drTypeTag}>PDF</span></td>
                    <td className={styles.drTdActions}>
                      <a href={`${latestLPReport.pdfUrl}?dl=${latestLPReport.title || 'LP-Report'}.pdf`} className={styles.drAction}>Download</a>
                    </td>
                  </DrTableRow>
                )}

                {/* ── Fund II — only shown when PDF is uploaded ── */}
                {fundContent?.fundIIThesisPresentationUrl && (
                  <>
                    <tr id="fund-ii" className={styles.drGroupRow}>
                      <td colSpan={3} className={styles.drGroupCell}>▾ FUND II · 1 document</td>
                    </tr>
                    <DrTableRow
                      href={fundContent.fundIIThesisPresentationUrl}
                      label="Thesis presentation"
                    >
                      <td className={styles.drTd}>Thesis presentation</td>
                      <td className={styles.drTd}><span className={styles.drTypeTag}>PDF</span></td>
                      <td className={styles.drTdActions}>
                        <a href={`${fundContent.fundIIThesisPresentationUrl}?dl=Fund-II-Thesis-Presentation.pdf`} className={styles.drAction}>Download</a>
                      </td>
                    </DrTableRow>
                  </>
                )}

                {/* ── Team ── */}
                <tr id="team" className={styles.drGroupRow}>
                  <td colSpan={3} className={styles.drGroupCell}>▾ TEAM</td>
                </tr>
                <DrTableRow href="/dataroom/team">
                  <td className={styles.drTd}>Investment team</td>
                  <td className={styles.drTd} />
                  <td className={styles.drTdActions}>
                    <a href="/dataroom/team" className={styles.drAction}>View →</a>
                  </td>
                </DrTableRow>

                {/* ── Others ── */}
                <tr id="others" className={styles.drGroupRow}>
                  <td colSpan={3} className={styles.drGroupCell}>
                    ▾ OTHERS{othersCount > 0 ? ` · ${othersCount} document${othersCount !== 1 ? 's' : ''}` : ''}
                  </td>
                </tr>
                <DrTableRow href="/dataroom/track-record">
                  <td className={styles.drTd}>Track record (prior to Yali)</td>
                  <td className={styles.drTd} />
                  <td className={styles.drTdActions}>
                    <a href="/dataroom/track-record" className={styles.drAction}>View →</a>
                  </td>
                </DrTableRow>
                {recDocs.map((doc, i) =>
                  doc.fileUrl ? (
                    <DrTableRow
                      key={doc.title || i}
                      href={doc.fileUrl}
                      label={doc.title}
                    >
                      <td className={styles.drTd}>{doc.title}</td>
                      <td className={styles.drTd}><span className={styles.drTypeTag}>PDF</span></td>
                      <td className={styles.drTdActions}>
                        <a href={`${doc.fileUrl}?dl=${encodeURIComponent(doc.title || 'Document')}.pdf`} className={styles.drAction}>Download</a>
                      </td>
                    </DrTableRow>
                  ) : null
                )}

              </tbody>
            </table>
          </div>
        </main>

      </div>

    </div>
  );
}
