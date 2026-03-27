import { notFound } from 'next/navigation';
import {
  getLPFundSettings,
  getLPQuarterlyReportBySlug,
  getLPInvestments,
  getTeamMembers,
} from '@/lib/sanity-queries';
import {
  buildReportData,
} from '@/lib/quarterly-utils';
import PrintButton from './PrintButton';
import styles from './print.module.css';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

// ── Helpers ────────────────────────────────────────────────

function fmt(val, decimals = 2) {
  if (val === undefined || val === null) return '—';
  return Number(val).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtCr(val) {
  if (val === undefined || val === null) return '—';
  return `₹${fmt(val)} Cr`;
}

function fmtPct(val) {
  if (val === undefined || val === null) return '—';
  return `${fmt(val, 1)}%`;
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function fmtMonthYear(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    month: 'long', year: 'numeric',
  });
}

// Extract plain paragraphs from Sanity block content
function blocksToParas(blocks) {
  if (!blocks || !Array.isArray(blocks)) return [];
  return blocks
    .filter(b => b._type === 'block' && b.children?.some(c => c.text?.trim()))
    .map(b => ({
      style: b.style || 'normal',
      text: (b.children || []).map(c => c.text || '').join(''),
    }));
}

// Render paragraphs as JSX
function RenderParas({ blocks, className }) {
  const paras = blocksToParas(blocks);
  if (!paras.length) return null;
  return paras.map((p, i) => (
    <p key={i} className={className}>{p.text}</p>
  ));
}

function getInitialInvestmentDate(company) {
  const rounds = company?.investmentRounds || [];
  if (!rounds.length) return null;
  const initial = rounds.find(r => r.isInitialRound) || rounds[0];
  return initial?.investmentDate || null;
}

function getTotalInvestment(company) {
  return (company?.investmentRounds || []).reduce((s, r) => s + (r.yaliInvestment || 0), 0);
}

function getLatestRoundLabel(company) {
  const rounds = company?.investmentRounds || [];
  if (!rounds.length) return '—';
  const latest = rounds[rounds.length - 1];
  if (latest?.roundLabel) return latest.roundLabel;
  if (latest?.roundName) return latest.roundName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return '—';
}

function getLatestOwnership(company) {
  const rounds = company?.investmentRounds || [];
  if (!rounds.length) return null;
  const sorted = [...rounds]
    .filter(r => r.roundName)
    .sort((a, b) => {
      if (a.investmentDate && b.investmentDate) return new Date(a.investmentDate) - new Date(b.investmentDate);
      if (a.investmentDate) return -1;
      if (b.investmentDate) return 1;
      return 0;
    });
  return (sorted.length ? sorted[sorted.length - 1] : rounds[rounds.length - 1])?.yaliOwnership ?? null;
}

// Quarter end month label (Indian FY)
const QUARTER_END_MONTHS = { Q1: 'June', Q2: 'September', Q3: 'December', Q4: 'March' };
function quarterEndLabel(quarter, fiscalYear) {
  const fyNum = parseInt((fiscalYear || 'FY26').replace('FY', ''), 10);
  const fullYear = fyNum < 50 ? 2000 + fyNum : 1900 + fyNum;
  const month = QUARTER_END_MONTHS[quarter] || '';
  const year = quarter === 'Q4' ? fullYear : fullYear - 1;
  return `${month} ${year}`;
}

// ── Page Sections ──────────────────────────────────────────

function PageHeader({ quarter, fiscalYear }) {
  return (
    <div className={styles.pageHeader}>
      <span className={styles.pageHeaderLogo}>YALI</span>
      <span className={styles.pageHeaderMeta}>
        {quarter} {fiscalYear} — Limited Partners Report &nbsp;|&nbsp; Confidential
      </span>
    </div>
  );
}

function PageFooter({ label }) {
  return (
    <div className={styles.pageFooter}>
      <span>Yali Capital Deep Tech Fund</span>
      <span>{label || ''}</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────

export default async function GenerateReportPage({ params }) {
  const { slug } = await params;

  const [fundSettings, report, investments, teamMembers] = await Promise.all([
    getLPFundSettings(),
    getLPQuarterlyReportBySlug(slug),
    getLPInvestments(),
    getTeamMembers(),
  ]);

  if (!report) notFound();

  const { quarter, fiscalYear } = report;

  // Build quarter-gated data (same logic as portal)
  const reportData = buildReportData({
    quarter,
    fiscalYear,
    fundSettings,
    investments,
    news: [],
    socialUpdates: [],
  });

  const { fundMetrics, portfolioCompanies } = reportData;

  // Reporting date label
  const reportingDate = report.reportingDate
    ? fmtMonthYear(report.reportingDate)
    : quarterEndLabel(quarter, fiscalYear);

  // Signatory
  const signatory = report.signatory || teamMembers.find(t =>
    t.name?.toLowerCase().includes('gani') ||
    t.name?.toLowerCase().includes('ganapathy')
  ) || { name: 'Ganapathy Subramaniam', role: 'Founding Managing Partner' };

  const docTitle = `${report.title || `LP Report ${quarter} ${fiscalYear}`} — Yali Capital`;

  const asOf = quarterEndLabel(quarter, fiscalYear);

  return (
    <>
      <PrintButton title={docTitle} />

      <div className={styles.printWrap}>
        <div className={styles.printDoc}>

          {/* ═══ 1. COVER PAGE ═══════════════════════════════════ */}
          <div className={`${styles.page} ${styles.coverPage}`}>
            <div className={styles.coverTopRow}>
              <h1 className={styles.coverLogo}>YALI</h1>
              <span className={styles.coverConfidential}>Confidential</span>
            </div>

            <div className={styles.coverCenter}>
              <p className={styles.coverReportLabel}>Limited Partners</p>
              <h2 className={styles.coverTitle}>Quarterly Report</h2>
              <p className={styles.coverSubtitle}>{quarter} {fiscalYear}</p>
            </div>

            <div className={styles.coverFooter}>
              <p className={styles.coverFundName}>
                {fundSettings?.fundName || 'Yali Capital Deep Tech Fund'}
              </p>
              <p className={styles.coverDate}>As of {asOf}</p>
            </div>
          </div>

          {/* ═══ 2. TABLE OF CONTENTS ════════════════════════════ */}
          <div className={styles.page}>
            <PageHeader quarter={quarter} fiscalYear={fiscalYear} />

            <h2 className={styles.tocTitle}>Table of Contents</h2>
            <ol className={styles.tocList}>
              {[
                'Cover Note',
                'Fund Summary',
                'Portfolio Investments',
                ...portfolioCompanies.map(c => c.name),
                'Pipeline',
                'Media Coverage',
                'Contact',
              ].map((item, i) => (
                <li key={i} className={styles.tocItem}>
                  <span className={styles.tocItemNum}>{i + 1}.</span>
                  <span className={styles.tocItemTitle}>{item}</span>
                </li>
              ))}
            </ol>

            <PageFooter label="Table of Contents" />
          </div>

          {/* ═══ 3. COVER NOTE ═══════════════════════════════════ */}
          <div className={styles.page}>
            <PageHeader quarter={quarter} fiscalYear={fiscalYear} />
            <h2 className={styles.sectionTitle}>Cover Note</h2>

            {report.coverNoteGreeting && (
              <p className={styles.coverNoteGreeting}>{report.coverNoteGreeting}</p>
            )}

            <RenderParas blocks={report.coverNoteIntro} className={styles.coverNotePara} />
            <RenderParas blocks={report.investmentActivityNotes} className={styles.coverNotePara} />
            <RenderParas blocks={report.portfolioHighlightsNotes} className={styles.coverNotePara} />
            <RenderParas blocks={report.ecosystemNotes} className={styles.coverNotePara} />
            <RenderParas blocks={report.closingNotes} className={styles.coverNotePara} />

            <div className={styles.signatureBlock}>
              {signatory.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={signatory.photo} alt={signatory.name} className={styles.sigPhoto} />
              )}
              <p className={styles.sigName}>{signatory.name}</p>
              <p className={styles.sigRole}>{signatory.role}</p>
            </div>

            <PageFooter label="Cover Note" />
          </div>

          {/* ═══ 4. FUND SUMMARY ═════════════════════════════════ */}
          <div className={styles.page}>
            <PageHeader quarter={quarter} fiscalYear={fiscalYear} />
            <h2 className={styles.sectionTitle}>Fund Summary</h2>
            <p className={styles.sectionSubtitle}>As of {asOf} · Amounts in ₹ Crores</p>

            {[
              { label: 'First close date', value: fmtDate(fundSettings?.firstCloseDate) },
              { label: 'Final close date', value: fmtDate(fundSettings?.finalCloseDate) },
              { label: 'Fund size at final close', value: fmtCr(fundSettings?.fundSizeAtClose) },
              { label: 'Amount drawn down', value: fmtCr(fundMetrics.amountDrawnDown) },
              { label: 'Total invested in portfolio', value: fmtCr(fundMetrics.totalInvestedInPortfolio) },
              {
                label: 'Fair market value of portfolio (incl. realised)',
                value: fmtCr(fundMetrics.fmvOfPortfolio),
              },
              { label: 'Number of portfolio companies', value: String(fundMetrics.numberOfPortfolioCompanies ?? '—') },
              { label: 'Amount returned (incl. passive income)', value: fmtCr(fundMetrics.amountReturned) },
              { label: 'MOIC', value: `${fmt(fundMetrics.moic)}x` },
              { label: 'TVPI', value: `${fmt(fundMetrics.tvpi)}x` },
              { label: 'DPI', value: fmt(fundMetrics.dpi, 4) },
            ].map(({ label, value }, i) => (
              <div key={i} className={styles.fundRow}>
                <span className={styles.fundRowLabel}>{label}</span>
                <span className={styles.fundRowValue}>{value}</span>
              </div>
            ))}

            <PageFooter label="Fund Summary" />
          </div>

          {/* ═══ 5. PORTFOLIO INVESTMENTS TABLE ══════════════════ */}
          <div className={styles.page}>
            <PageHeader quarter={quarter} fiscalYear={fiscalYear} />
            <h2 className={styles.sectionTitle}>Portfolio Investments</h2>
            <p className={styles.sectionSubtitle}>As of {asOf} · Amounts in ₹ Crores</p>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Sector</th>
                  <th>Round</th>
                  <th className={styles.right}>Invested</th>
                  <th className={styles.right}>Ownership</th>
                  <th className={styles.right}>FMV</th>
                  <th className={styles.right}>MOIC</th>
                </tr>
              </thead>
              <tbody>
                {portfolioCompanies.map((c, i) => {
                  const invested = getTotalInvestment(c);
                  const ownership = getLatestOwnership(c);
                  const fmv = c.quarterData?.currentFMV ?? c.currentFMV;
                  const moic = c.quarterData?.multipleOfInvestment ?? c.multipleOfInvestment;
                  return (
                    <tr key={i}>
                      <td className={styles.bold}>{c.name}</td>
                      <td>{c.sector || '—'}</td>
                      <td>{getLatestRoundLabel(c)}</td>
                      <td className={styles.right}>{invested ? fmtCr(invested) : '—'}</td>
                      <td className={styles.right}>{fmtPct(ownership)}</td>
                      <td className={styles.right}>{fmv ? fmtCr(fmv) : '—'}</td>
                      <td className={styles.right}>{moic ? `${fmt(moic)}x` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {report.portfolioSummaryFootnotes && (
              <p className={styles.tableFootnote}>{report.portfolioSummaryFootnotes}</p>
            )}

            <PageFooter label="Portfolio Investments" />
          </div>

          {/* ═══ 6. PER-COMPANY PAGES ════════════════════════════ */}
          {portfolioCompanies.map((company, ci) => {
            const qd = company.quarterData;
            const invested = getTotalInvestment(company);
            const ownership = qd?.currentOwnershipPercent ?? getLatestOwnership(company);
            const fmv = qd?.currentFMV;
            const moic = qd?.multipleOfInvestment;
            const returned = qd?.amountReturned;
            const revenue = qd?.revenueINR;
            const teamSize = qd?.teamSize;
            const updateNotes = qd?.updateNotes;
            const keyMetrics = qd?.keyMetrics;

            return (
              <div key={ci} className={`${styles.page} ${styles.companyPage}`}>
                <PageHeader quarter={quarter} fiscalYear={fiscalYear} />

                {/* Company header */}
                <div className={styles.companyHeader}>
                  {company.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={company.logo} alt={company.name} className={styles.companyLogo} />
                  ) : (
                    <div className={styles.companyLogoPlaceholder}>
                      {company.name?.[0] || '?'}
                    </div>
                  )}
                  <div>
                    <h2 className={styles.companyName}>{company.name}</h2>
                    {company.oneLiner && (
                      <p className={styles.companyOneliner}>{company.oneLiner}</p>
                    )}
                  </div>
                </div>

                <div className={styles.companyBody}>
                  {/* Left: investment data table */}
                  <div className={styles.companyLeft}>
                    <table className={styles.table}>
                      <tbody>
                        <tr>
                          <td>Date of first investment</td>
                          <td className={styles.right}>{fmtDate(getInitialInvestmentDate(company))}</td>
                        </tr>
                        <tr>
                          <td>Funding round</td>
                          <td className={styles.right}>{getLatestRoundLabel(company)}</td>
                        </tr>
                        <tr>
                          <td>Total amount invested</td>
                          <td className={styles.right}>{invested ? fmtCr(invested) : '—'}</td>
                        </tr>
                        <tr>
                          <td>Ownership (fully diluted)</td>
                          <td className={styles.right}>{fmtPct(ownership)}</td>
                        </tr>
                        <tr>
                          <td>Fair Market Value</td>
                          <td className={styles.right}>{fmv ? fmtCr(fmv) : '—'}</td>
                        </tr>
                        <tr>
                          <td>Amount returned</td>
                          <td className={styles.right}>{returned ? fmtCr(returned) : '—'}</td>
                        </tr>
                        <tr>
                          <td>Multiple on invested capital</td>
                          <td className={styles.right}>{moic ? `${fmt(moic)}x` : '—'}</td>
                        </tr>
                        {revenue != null && (
                          <tr>
                            <td>Revenue (₹ Cr)</td>
                            <td className={styles.right}>{fmtCr(revenue)}</td>
                          </tr>
                        )}
                        {teamSize != null && (
                          <tr>
                            <td>Team size</td>
                            <td className={styles.right}>{teamSize}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {/* Key metrics */}
                    {keyMetrics && keyMetrics.length > 0 && (
                      <>
                        <p className={styles.updateNotesLabel}>Key metrics</p>
                        <ul className={styles.keyMetricsList}>
                          {keyMetrics.map((m, mi) => (
                            <li key={mi} className={styles.keyMetricItem}>{m}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>

                  {/* Right: about + update notes */}
                  <div className={styles.companyRight}>
                    {company.detail && (
                      <>
                        <p className={styles.companyAboutLabel}>About</p>
                        <p className={styles.companyAboutText}>{company.detail}</p>
                      </>
                    )}

                    {updateNotes && (
                      <>
                        <p className={styles.updateNotesLabel}>Quarter update</p>
                        <p className={styles.updateNotesText}>{updateNotes}</p>
                      </>
                    )}

                    {qd?.tableFootnotes && (
                      <>
                        <p className={styles.updateNotesLabel}>Notes</p>
                        <p className={styles.updateNotesText}>{qd.tableFootnotes}</p>
                      </>
                    )}

                    {/* Co-investors from investment rounds */}
                    {(() => {
                      const allCoInvestors = (company.investmentRounds || [])
                        .flatMap(r => (r.coInvestors || []).map(ci => ci.name))
                        .filter(Boolean);
                      const unique = [...new Set(allCoInvestors)];
                      if (!unique.length) return null;
                      return (
                        <>
                          <p className={styles.updateNotesLabel}>Key co-investors</p>
                          <p className={styles.updateNotesText}>{unique.join(', ')}</p>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <PageFooter label={company.name} />
              </div>
            );
          })}

          {/* ═══ 7. PIPELINE ═════════════════════════════════════ */}
          <div className={styles.page}>
            <PageHeader quarter={quarter} fiscalYear={fiscalYear} />
            <h2 className={styles.sectionTitle}>Pipeline</h2>

            {report.pipelineDeals && report.pipelineDeals.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Sector</th>
                    <th>Stage</th>
                    <th className={styles.right}>Proposed (₹ Cr)</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {report.pipelineDeals.map((deal, i) => (
                    <tr key={i} className={styles.pipelineRow}>
                      <td className={styles.bold}>{deal.companyName}</td>
                      <td>{deal.sector || '—'}</td>
                      <td>{deal.stage || '—'}</td>
                      <td className={styles.right}>
                        {deal.proposedAmountINR ? fmt(deal.proposedAmountINR) : '—'}
                      </td>
                      <td>{deal.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className={styles.coverNotePara}>No pipeline deals recorded for this quarter.</p>
            )}

            {report.pipelineNotes && (
              <RenderParas blocks={report.pipelineNotes} className={styles.pipelineNotes} />
            )}

            <PageFooter label="Pipeline" />
          </div>

          {/* ═══ 8. MEDIA COVERAGE ═══════════════════════════════ */}
          <div className={styles.page}>
            <PageHeader quarter={quarter} fiscalYear={fiscalYear} />
            <h2 className={styles.sectionTitle}>Media Coverage</h2>

            {report.mediaFromNews && report.mediaFromNews.length > 0 ? (
              report.mediaFromNews.map((item, i) => (
                <div key={i} className={styles.mediaItem}>
                  <span className={styles.mediaDate}>
                    {item.date
                      ? new Date(item.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                      : '—'}
                  </span>
                  <div className={styles.mediaContent}>
                    <p className={styles.mediaTitle}>{item.headlineEdited}</p>
                    {item.publicationName && (
                      <p className={styles.mediaPub}>{item.publicationName}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.coverNotePara}>No media items recorded for this quarter.</p>
            )}

            {report.mediaNotes && (
              <RenderParas blocks={report.mediaNotes} className={styles.pipelineNotes} />
            )}

            <PageFooter label="Media Coverage" />
          </div>

          {/* ═══ 9. CONTACT / BACK PAGE ══════════════════════════ */}
          <div className={`${styles.page} ${styles.contactPage}`}>
            <h1 className={styles.contactLogo}>YALI</h1>

            <div className={styles.contactInfo}>
              <p className={styles.contactRow}>
                {fundSettings?.fundName || 'Yali Capital Deep Tech Fund'}
              </p>
              {fundSettings?.website && (
                <p className={styles.contactRow}>
                  {fundSettings.website}
                </p>
              )}
              {fundSettings?.investorRelationsEmail && (
                <p className={styles.contactRow}>
                  Investor relations: {fundSettings.investorRelationsEmail}
                </p>
              )}
            </div>

            <p className={styles.disclaimer}>
              This document is confidential and intended solely for the authorized Limited Partners
              of Yali Capital Deep Tech Fund. Any reproduction, distribution, or disclosure of this
              document or its contents without prior written consent is strictly prohibited.
              The information contained herein is for informational purposes only and does not
              constitute an offer to sell or a solicitation of an offer to buy any securities.
              Past performance is not indicative of future results.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
