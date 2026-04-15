import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  getDataRoomDocuments,
  getDataRoomTrackRecords,
  getDataRoomTeamMembers,
  getDataRoomFundPerformance,
  getDataRoomAllFundSettings,
  getDataRoomPortfolioCompanies,
  getPortalUserByEmail,
  getDataroomSectionVisibility,
} from '@/lib/sanity-queries';
import DataroomTopbar from '../DataroomTopbar';
import TeamGrid from '../TeamGrid';
import TrackRecordTable from '../TrackRecordTable';
import styles from '../dataroom.module.css';

export const dynamic = 'force-dynamic';

const SLUG_TO_TITLE = {
  'pipeline': 'Dealflow & Pipeline',
  'ppm-agreements': 'PPM & Agreements',
  'presentations': 'Presentations',
  'recommendation': 'Recommendation',
  'regulatory-documents': 'Regulatory Documents',
  'team': 'Team',
  'track-record': 'Track Record & Recommendation',
  'fund-performance': 'Fund Performance',
  'portfolio': 'Portfolio',
};

const SLUG_TO_VISIBILITY_KEY = {
  'pipeline': 'pipeline',
  'ppm-agreements': 'ppmAgreements',
  'presentations': 'presentations',
  'regulatory-documents': 'regulatoryDocuments',
  'team': 'team',
  'track-record': 'trackRecord',
  'fund-performance': 'fundPerformance',
  'portfolio': 'portfolio',
};

const DocIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M4 2h6l3 3v9H4V2z"
      stroke="#efefef"
      strokeWidth="1.2"
      fill="none"
      opacity="0.7"
    />
  </svg>
);

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
  });
}

function FundRow({ label, value }) {
  return (
    <tr>
      <td className={styles.trackTd} style={{ textAlign: 'left' }}>{label}</td>
      <td className={styles.trackTd} style={{ textAlign: 'right', fontWeight: 600 }}>{value}</td>
    </tr>
  );
}

function getTotalInvestment(company) {
  return (company?.investmentRounds || []).reduce((sum, r) => sum + (r.yaliInvestment || 0), 0);
}

function getLatestRound(company) {
  const rounds = (company?.investmentRounds || []).filter(r => r.roundName);
  if (!rounds.length) return null;
  const sorted = [...rounds].sort((a, b) => {
    if (!a.investmentDate) return 1;
    if (!b.investmentDate) return -1;
    return new Date(b.investmentDate) - new Date(a.investmentDate);
  });
  return sorted[0].roundLabel || sorted[0].roundName;
}

export default async function CategoryPage({ params }) {
  const { category: slug } = await params;

  if (!SLUG_TO_TITLE[slug]) {
    notFound();
  }

  const visibilityKey = SLUG_TO_VISIBILITY_KEY[slug];
  if (visibilityKey) {
    const vis = await getDataroomSectionVisibility();
    if (vis && vis[visibilityKey] === false) {
      notFound();
    }
  }

  const categoryTitle = SLUG_TO_TITLE[slug];

  if (slug === 'fund-performance') {
    const [perf, fundSettings] = await Promise.all([
      getDataRoomFundPerformance(),
      getDataRoomAllFundSettings(),
    ]);
    const asOf = perf ? `${perf.quarter} ${perf.fiscalYear}` : null;

    return (
      <div className={styles.page}>
        <DataroomTopbar />
        <div className={styles.breadcrumb}>
          <Link href="/dataroom" className={styles.breadcrumbBack}>← Data Room</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>Fund Performance</span>
        </div>
        <div className={styles.innerHero}>
          <div>
            <div className={styles.innerTitle}>Fund Performance</div>
            <div className={styles.innerSub}>Most recent reported quarter{asOf ? ` — ${asOf}` : ''}</div>
          </div>
        </div>
        <div className={styles.perfSection}>
          <div className={styles.sectionLabel}>Headline Metrics</div>
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiLabel}>Total Invested</div>
              <div className={styles.kpiValue}>{perf?.totalInvested != null ? `₹${perf.totalInvested.toFixed(2)} Cr` : '—'}</div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiLabel}>Current FMV</div>
              <div className={styles.kpiValue}>{perf?.fairMarketValue != null ? `₹${perf.fairMarketValue.toFixed(2)} Cr` : '—'}</div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiLabel}>MOIC</div>
              <div className={styles.kpiValue}>{perf?.moic != null ? `${perf.moic.toFixed(2)}x` : '—'}</div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiLabel}>TVPI</div>
              <div className={styles.kpiValue}>{perf?.tvpi != null ? `${perf.tvpi.toFixed(2)}x` : '—'}</div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiLabel}>DPI</div>
              <div className={styles.kpiValue}>{perf?.dpi != null ? `${perf.dpi.toFixed(4)}x` : '—'}</div>
            </div>
          </div>

          {(fundSettings || perf) && (
            <>
              <div className={styles.perfTitle}>Fund Summary</div>
              <div className={styles.trackTableWrap}>
                <table className={styles.trackTable}>
                  <thead>
                    <tr>
                      <th className={styles.trackTh} style={{ textAlign: 'left' }}>As of {asOf || '—'}</th>
                      <th className={styles.trackTh} style={{ textAlign: 'right' }}>Amount in ₹ crores</th>
                    </tr>
                  </thead>
                  <tbody>
                    <FundRow label="First close date" value={fundSettings?.firstCloseDate ? new Date(fundSettings.firstCloseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'} />
                    <FundRow label="Final close date" value={fundSettings?.finalCloseDate ? new Date(fundSettings.finalCloseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'} />
                    <FundRow label="Fund size at final close" value={fundSettings?.fundSizeAtClose != null ? fundSettings.fundSizeAtClose.toFixed(2) : (fundSettings?.targetFundSizeINR != null ? fundSettings.targetFundSizeINR.toFixed(2) : '—')} />
                    <FundRow label="Amount drawn down as per bank" value={perf?.amountDrawnDown != null ? perf.amountDrawnDown.toFixed(2) : '—'} />
                    <FundRow label="Total invested in portfolio" value={perf?.totalInvested != null ? perf.totalInvested.toFixed(2) : '—'} />
                    <FundRow label="Fair Market Value of portfolio investments (including realised value)" value={perf?.fairMarketValue != null ? perf.fairMarketValue.toFixed(2) : '—'} />
                    <FundRow label="Amount returned (including passive income returned)" value={perf?.amountReturned != null ? perf.amountReturned.toFixed(2) : '—'} />
                    <FundRow label="MOIC" value={perf?.moic != null ? `${perf.moic.toFixed(2)}x` : '—'} />
                    <FundRow label="TVPI" value={perf?.tvpi != null ? `${perf.tvpi.toFixed(2)}x` : '—'} />
                    <FundRow label="DPI" value={perf?.dpi != null ? `${perf.dpi.toFixed(4)}x` : '—'} />
                  </tbody>
                </table>
              </div>
            </>
          )}

        </div>
      </div>
    );
  }

  if (slug === 'portfolio') {
    // Server-side access check
    const cookieStore = await cookies();
    const session = cookieStore.get('dataroom-session')?.value;
    const email = session ? session.split(':')[0] : null;
    const user = email ? await getPortalUserByEmail(email) : null;

    if (!user?.investorDataRoomAccess) {
      notFound();
    }

    const companies = await getDataRoomPortfolioCompanies();
    const all = companies || [];

    return (
      <div className={styles.page}>
        <DataroomTopbar />
        <div className={styles.breadcrumb}>
          <Link href="/dataroom" className={styles.breadcrumbBack}>← Categories</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>Portfolio</span>
        </div>
        <div className={styles.innerHero}>
          <div>
            <div className={styles.innerTitle}>Portfolio</div>
            <div className={styles.innerSub}>Active portfolio companies — performance as of most recent quarter</div>
          </div>
          <div className={styles.docCountBadge}>{all.length} companies</div>
        </div>
        <div className={styles.portfolioSection}>
          {all.length === 0 ? (
            <div className={styles.docTitleEmpty}>No portfolio data available.</div>
          ) : (
            <div className={styles.portfolioGrid}>
              {all.map((co) => {
                const totalInvested = getTotalInvestment(co);
                const stage = getLatestRound(co);
                const q = co.latestQuarter;
                return (
                  <div key={co._id} className={styles.portfolioCard}>
                    <div className={styles.portfolioCardTop}>
                      {co.logo && (
                        <img src={co.logo} alt={co.name} className={styles.portfolioLogo} />
                      )}
                      <div className={styles.portfolioCardMeta}>
                        <div className={styles.portfolioName}>{co.name}</div>
                        {co.sector && <div className={styles.portfolioSector}>{co.sector}</div>}
                      </div>
                    </div>
                    {co.oneLiner && <div className={styles.portfolioOneLiner}>{co.oneLiner}</div>}
                    <div className={styles.portfolioMetrics}>
                      <div className={styles.portfolioMetricItem}>
                        <div className={styles.portfolioMetricLabel}>Stage</div>
                        <div className={styles.portfolioMetricValue}>{stage || '—'}</div>
                      </div>
                      <div className={styles.portfolioMetricItem}>
                        <div className={styles.portfolioMetricLabel}>Invested</div>
                        <div className={styles.portfolioMetricValue}>{totalInvested > 0 ? `₹${totalInvested.toFixed(2)} Cr` : '—'}</div>
                      </div>
                      <div className={styles.portfolioMetricItem}>
                        <div className={styles.portfolioMetricLabel}>FMV</div>
                        <div className={styles.portfolioMetricValue}>
                          {q?.currentFMVConfidential ? '—' : (q?.currentFMV != null ? `₹${q.currentFMV.toFixed(2)} Cr` : '—')}
                        </div>
                      </div>
                      <div className={styles.portfolioMetricItem}>
                        <div className={styles.portfolioMetricLabel}>MOIC</div>
                        <div className={styles.portfolioMetricValue}>
                          {q?.moicConfidential ? '—' : (q?.multipleOfInvestment != null ? `${q.multipleOfInvestment.toFixed(2)}x` : '—')}
                        </div>
                      </div>
                      {co.isRevenueMaking && (
                        <div className={styles.portfolioMetricItem}>
                          <div className={styles.portfolioMetricLabel}>Revenue</div>
                          <div className={styles.portfolioMetricValue}>
                            {q?.revenueConfidential ? '—' : (q?.revenueINR != null ? `₹${q.revenueINR.toFixed(2)} Cr` : '—')}
                          </div>
                        </div>
                      )}
                      <div className={styles.portfolioMetricItem}>
                        <div className={styles.portfolioMetricLabel}>Team</div>
                        <div className={styles.portfolioMetricValue}>
                          {q?.teamSizeConfidential ? '—' : (q?.teamSize != null ? q.teamSize : '—')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (slug === 'team') {
    const members = (await getDataRoomTeamMembers()) || [];
    return (
      <div className={styles.page}>
        <DataroomTopbar />
        <div className={styles.breadcrumb}>
          <Link href="/dataroom" className={styles.breadcrumbBack}>← Data Room</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{categoryTitle}</span>
        </div>
        <div className={styles.innerHero}>
          <div>
            <div className={styles.innerTitle}>{categoryTitle}</div>
            <div className={styles.innerSub}>Investment team and advisory board</div>
          </div>
          <div className={styles.docCountBadge}>{members.length} profiles</div>
        </div>
        <TeamGrid members={members} />
      </div>
    );
  }

  if (slug === 'track-record') {
    const [records, allDocs] = await Promise.all([
      getDataRoomTrackRecords(),
      getDataRoomDocuments(),
    ]);
    const trackRecords = records || [];
    const recDocs = (allDocs || []).filter((d) => d.category === 'recommendation');

    return (
      <div className={styles.page}>
        <DataroomTopbar />
        <div className={styles.breadcrumb}>
          <Link href="/dataroom" className={styles.breadcrumbBack}>← Data Room</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{categoryTitle}</span>
        </div>
        <div className={styles.innerHero}>
          <div>
            <div className={styles.innerTitle}>{categoryTitle}</div>
            <div className={styles.trackFinePrint}>Best viewed on larger devices</div>
          </div>
          <div className={styles.docCountBadge}>{trackRecords.length + recDocs.length} items</div>
        </div>
        <div className={styles.trackPageContent}>
          <div className={styles.trackSection}>
            <TrackRecordTable records={trackRecords} />
          </div>
          {recDocs.length > 0 && (
            <>
              <div className={styles.trackRecSeparator} />
              <div className={styles.trackRecSection}>
                <div className={styles.sectionLabel}>Recommendation</div>
                {recDocs.map((doc) => (
                  <a
                    key={doc._id}
                    href={doc.fileUrl || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.docRow}
                    style={{ textDecoration: 'none', cursor: doc.fileUrl ? 'pointer' : 'default' }}
                  >
                    <div className={styles.docIcon}><DocIcon /></div>
                    <div className={styles.docInfo}>
                      <div className={styles.docTitle}>{doc.title}</div>
                      <div className={styles.docMeta}>
                        <span>PDF</span>
                        {doc.description && <span>{doc.description}</span>}
                        {doc.publishedAt && <span>{formatDate(doc.publishedAt)}</span>}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Default: document list
  const allDocs = (await getDataRoomDocuments()) || [];
  const docs = allDocs.filter((d) => d.category === slug);

  return (
    <div className={styles.page}>
      <DataroomTopbar />
      <div className={styles.breadcrumb}>
        <Link href="/dataroom" className={styles.breadcrumbBack}>
          ← Data Room
        </Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{categoryTitle}</span>
      </div>
      <div className={styles.innerHero}>
        <div>
          <div className={styles.innerTitle}>{categoryTitle}</div>
          <div className={styles.innerSub}>
            Browse and open documents in this category
          </div>
        </div>
        <div className={styles.docCountBadge}>{docs.length} documents</div>
      </div>
      <div className={styles.docList}>
        {docs.map((doc) => (
          <a
            key={doc._id}
            href={doc.fileUrl || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.docRow}
            style={{ textDecoration: 'none', cursor: doc.fileUrl ? 'pointer' : 'default' }}
          >
            <div className={styles.docIcon}>
              <DocIcon />
            </div>
            <div className={styles.docInfo}>
              <div className={styles.docTitle}>{doc.title}</div>
              <div className={styles.docMeta}>
                <span>PDF</span>
                {doc.description && <span>{doc.description}</span>}
                {doc.publishedAt && <span>{formatDate(doc.publishedAt)}</span>}
              </div>
            </div>
          </a>
        ))}
        {docs.length === 0 && (
          <div className={styles.docRow}>
            <div className={styles.docInfo}>
              <div className={styles.docTitleEmpty}>
                No documents available
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
