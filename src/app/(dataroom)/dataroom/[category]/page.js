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
} from '@/lib/sanity-queries';
import DataroomTopbar from '../DataroomTopbar';
import DataroomPieChart from '../DataroomPieChart';
import TeamGrid from '../TeamGrid';
import TrackRecordTable from '../TrackRecordTable';
import styles from '../dataroom.module.css';

export const dynamic = 'force-dynamic';

const SLUG_TO_TITLE = {
  'pipeline': 'Pipeline',
  'ppm-agreements': 'PPM & Agreements',
  'presentations': 'Presentations',
  'recommendation': 'Recommendation',
  'sebi': 'SEBI',
  'team': 'Team',
  'track-record': 'Track Record',
  'fund-performance': 'Fund Performance',
  'category-split': 'Portfolio by Sector',
  'portfolio': 'Portfolio',
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

  const categoryTitle = SLUG_TO_TITLE[slug];

  if (slug === 'fund-performance') {
    const [perf, fundSettings] = await Promise.all([
      getDataRoomFundPerformance(),
      getDataRoomAllFundSettings(),
    ]);
    const asOf = perf ? `${perf.quarter} ${perf.fiscalYear}` : null;

    const fyOrder = (fy) => parseInt((fy || '0').replace('FY', ''), 10);
    const qOrder = { Q4: 4, Q3: 3, Q2: 2, Q1: 1 };
    const allQuarters = [...(fundSettings?.quarterlyPerformance || [])].sort((a, b) => {
      const fyDiff = fyOrder(b.fiscalYear) - fyOrder(a.fiscalYear);
      if (fyDiff !== 0) return fyDiff;
      return (qOrder[b.quarter] || 0) - (qOrder[a.quarter] || 0);
    });

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
          {asOf && <div className={styles.docCountBadge}>{asOf}</div>}
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
              <div className={styles.kpiValue}>{perf?.moic != null ? `${perf.moic.toFixed(2)}×` : '—'}</div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiLabel}>TVPI</div>
              <div className={styles.kpiValue}>{perf?.tvpi != null ? `${perf.tvpi.toFixed(2)}×` : '—'}</div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiLabel}>DPI</div>
              <div className={styles.kpiValue}>{perf?.dpi != null ? `${perf.dpi.toFixed(4)}×` : '—'}</div>
            </div>
          </div>

          {fundSettings && (
            <div className={styles.fundInfoBlock}>
              <div className={styles.sectionLabel}>Fund Details</div>
              <div className={styles.fundInfoRow}>
                {fundSettings.firstCloseDate && (
                  <div className={styles.fundInfoItem}>
                    <div className={styles.fundInfoLabel}>First Close</div>
                    <div className={styles.fundInfoValue}>
                      {new Date(fundSettings.firstCloseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                )}
                {fundSettings.finalCloseDate && (
                  <div className={styles.fundInfoItem}>
                    <div className={styles.fundInfoLabel}>Final Close</div>
                    <div className={styles.fundInfoValue}>
                      {new Date(fundSettings.finalCloseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                )}
                {fundSettings.targetFundSizeINR != null && (
                  <div className={styles.fundInfoItem}>
                    <div className={styles.fundInfoLabel}>Fund Size</div>
                    <div className={styles.fundInfoValue}>₹{fundSettings.targetFundSizeINR} Cr</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {allQuarters.length > 0 && (
            <>
              <div className={styles.sectionLabel}>All Quarters</div>
              <div className={styles.trackTableWrap}>
                <table className={styles.trackTable}>
                  <thead>
                    <tr>
                      <th className={styles.trackTh}>Quarter</th>
                      <th className={styles.trackTh}>Total Invested (₹ Cr)</th>
                      <th className={styles.trackTh}>FMV (₹ Cr)</th>
                      <th className={styles.trackTh}>Amount Returned (₹ Cr)</th>
                      <th className={styles.trackTh}>MOIC</th>
                      <th className={styles.trackTh}>TVPI</th>
                      <th className={styles.trackTh}>DPI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allQuarters.map((q, i) => (
                      <tr key={i}>
                        <td className={styles.trackTd}>{q.quarter} {q.fiscalYear}</td>
                        <td className={styles.trackTd}>{q.totalInvested != null ? q.totalInvested.toFixed(2) : '—'}</td>
                        <td className={styles.trackTd}>{q.fairMarketValue != null ? q.fairMarketValue.toFixed(2) : '—'}</td>
                        <td className={styles.trackTd}>{q.amountReturned != null ? q.amountReturned.toFixed(2) : '—'}</td>
                        <td className={styles.trackTd}>{q.moic != null ? `${q.moic.toFixed(2)}×` : '—'}</td>
                        <td className={styles.trackTd}>{q.tvpi != null ? `${q.tvpi.toFixed(2)}×` : '—'}</td>
                        <td className={styles.trackTd}>{q.dpi != null ? `${q.dpi.toFixed(4)}×` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (slug === 'category-split') {
    const companies = await getDataRoomPortfolioCompanies();
    const all = companies || [];

    const sectorTotals = all.reduce((acc, co) => {
      const sector = co.sector || 'Other';
      const invested = getTotalInvestment(co);
      if (invested > 0) acc[sector] = (acc[sector] || 0) + invested;
      return acc;
    }, {});

    const chartData = Object.entries(sectorTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const colors = ['#d75d86', '#66bdd4', '#ebde84', '#c28d55', '#9f7ae4', '#0d835b', '#f5a623', '#50e3c2', '#B11248'];

    return (
      <div className={styles.page}>
        <DataroomTopbar />
        <div className={styles.breadcrumb}>
          <Link href="/dataroom" className={styles.breadcrumbBack}>← Categories</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>Portfolio by Sector</span>
        </div>
        <div className={styles.innerHero}>
          <div>
            <div className={styles.innerTitle}>Portfolio by Sector</div>
            <div className={styles.innerSub}>Investment distribution across active portfolio companies</div>
          </div>
          <div className={styles.docCountBadge}>{all.length} companies</div>
        </div>
        <div className={styles.trackSection}>
          <DataroomPieChart chartData={chartData} colors={colors} />
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

    if (!user?.allAccess) {
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
                          {q?.moicConfidential ? '—' : (q?.multipleOfInvestment != null ? `${q.multipleOfInvestment.toFixed(2)}×` : '—')}
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
    const records = (await getDataRoomTrackRecords()) || [];
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
          </div>
          <div className={styles.docCountBadge}>{records.length} investments</div>
        </div>
        <div className={styles.trackSection}>
          <TrackRecordTable records={records} />
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
          <div key={doc._id} className={styles.docRow}>
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
            {doc.fileUrl && (
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.docOpen}
              >
                Open
              </a>
            )}
          </div>
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
