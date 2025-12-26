import {
  getLPFundSettings,
  getLPQuarterlyReports,
  getLPQuarterlyReportBySlug,
  getLatestLPQuarterlyReport,
  getLPInvestments,
  getTeamMembers,
  getNews
} from '@/lib/sanity-queries';
import styles from './partners.module.css';
import Link from 'next/link';
import { Lightlogo } from '../../components/icons/lightlogo';
import CompanyGrid from './CompanyGrid';
import { PortableText } from '@portabletext/react';

export const revalidate = 0; // Disable cache for LP portal to show latest updates immediately

export default async function PartnersPortal() {
  // Fetch LP data from Sanity
  const [fundSettings, latestReport, investments, teamMembers, newsItems] = await Promise.all([
    getLPFundSettings(),
    getLatestLPQuarterlyReport(),
    getLPInvestments(),
    getTeamMembers(),
    getNews(),
  ]);

  // If we have a latest report, fetch the full data
  let report = null;
  if (latestReport?.slug) {
    report = await getLPQuarterlyReportBySlug(latestReport.slug);
  }

  // Get the managing partner or first team member for signatory
  const managingPartner = teamMembers.find(t =>
    t.role?.toLowerCase().includes('partner') ||
    t.role?.toLowerCase().includes('investments')
  ) || teamMembers[0];

  // Build fund metrics from report or use defaults
  const fundMetrics = report?.fundMetrics || {
    fundSizeAtClose: 893,
    amountDrawnDown: 45,
    totalInvestedInPortfolio: 15.2,
    fmvOfPortfolio: 18.5,
    numberOfPortfolioCompanies: investments.length,
    moic: 1.22,
    tvpi: 1.22,
    dpi: 0,
    irr: 18.5,
  };

  // Format currency helper
  const formatCurrency = (value, decimals = 0) => {
    if (!value && value !== 0) return '-';
    return `₹${Number(value).toFixed(decimals)} Cr`;
  };

  // Format percentage helper
  const formatPercent = (value, decimals = 1) => {
    if (!value && value !== 0) return '-';
    return `${Number(value).toFixed(decimals)}%`;
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric',
    });
  };

  // Format news date
  const formatNewsDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Build portfolio data from investments with quarterly data
  const portfolioData = report?.portfolioCompanies?.length > 0
    ? report.portfolioCompanies.map(investment => {
        // Find the quarterly data for this report's quarter
        const quarterData = investment.quarterlyUpdates?.find(
          q => q.quarter === report.quarter && q.fiscalYear === report.fiscalYear
        );

        return {
          company: investment.company || {},
          investment: investment,
          currentFMV: quarterData?.currentFMV || investment.yaliInvestmentAmount,
          currentOwnershipPercent: quarterData?.currentOwnershipPercent || investment.yaliOwnershipPercent,
          multipleOfInvestment: quarterData?.multipleOfInvestment || 1.0,
          updates: quarterData?.updates || [],
          revenueINR: quarterData?.revenueINR,
          patINR: quarterData?.patINR,
          teamSize: quarterData?.teamSize,
          keyMetrics: quarterData?.keyMetrics || [],
        };
      })
    : investments.map(inv => ({
        company: inv.company || {},
        investment: inv,
        currentFMV: inv.yaliInvestmentAmount * 1.2, // Fallback mock
        currentOwnershipPercent: inv.yaliOwnershipPercent,
        multipleOfInvestment: 1.2,
        updates: [],
        revenueINR: null,
        patINR: null,
        teamSize: null,
        keyMetrics: [],
      }));

  // Get report period display
  const quarter = report?.quarter || 'Q2';
  const fiscalYear = report?.fiscalYear || 'FY26';
  const reportingDate = report?.reportingDate
    ? new Date(report.reportingDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'September 2025';

  // Pipeline data
  const pipelineDeals = report?.pipelineDeals || [];

  // Signatory from report or fallback to managing partner
  const signatory = report?.signatory || managingPartner || {
    name: 'Managing Partner',
    role: 'Yali Capital'
  };

  return (
    <div className={styles.portalContainer}>
      {/* Header */}
      <header className={styles.portalHeader}>
        <div className={styles.headerLeft}>
          <Link href="/partners" className={styles.logoLink}>
            <Lightlogo />
          </Link>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.quarterLabel}>{quarter} {fiscalYear}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Quarterly Report</h1>
            <p className={styles.heroSubtitle}>{fundSettings?.fundName || 'Yali Capital Deep Tech Fund'}</p>
            {fundSettings?.tagline && (
              <p style={{ fontSize: '0.95rem', opacity: 0.8, marginTop: '0.5rem', fontStyle: 'italic' }}>
                &ldquo;{fundSettings.tagline}&rdquo;
              </p>
            )}
            <p className={styles.heroDate}>As of {reportingDate}</p>
          </div>
        </section>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Fund Size</div>
            <div className={styles.statValue}>{formatCurrency(fundMetrics.fundSizeAtClose)}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Drawn Down</div>
            <div className={styles.statValue}>{formatCurrency(fundMetrics.amountDrawnDown)}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Invested</div>
            <div className={styles.statValue}>{formatCurrency(fundMetrics.totalInvestedInPortfolio, 1)}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Portfolio FMV</div>
            <div className={styles.statValue}>{formatCurrency(fundMetrics.fmvOfPortfolio, 1)}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>MOIC</div>
            <div className={styles.statValue}>{fundMetrics.moic?.toFixed(2)}x</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>TVPI</div>
            <div className={styles.statValue}>{fundMetrics.tvpi?.toFixed(2)}x</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>DPI</div>
            <div className={styles.statValue}>{fundMetrics.dpi?.toFixed(4)}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>IRR</div>
            <div className={styles.statValue}>{formatPercent(fundMetrics.irr)}</div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className={styles.twoColumn}>
          {/* Main Column */}
          <div className={styles.mainColumn}>
            {/* Cover Note */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Cover Note</h2>
              </div>
              <div className={styles.messageCard}>
                <div className={styles.messageHeader}>
                  <span className={styles.messageFrom}>From the Managing Partner</span>
                </div>
                <div className={styles.messageContent}>
                  {report?.coverNoteIntro && report.coverNoteIntro.length > 0 ? (
                    <PortableText value={report.coverNoteIntro} />
                  ) : (
                    <>
                      <p>{report?.coverNoteGreeting || 'Dear Partners,'}</p>
                      <p>We are pleased to present the quarterly report for {fundSettings?.fundName || 'Yali Capital Deep Tech Fund'} for the period ending {reportingDate}.</p>
                      <p>This quarter marked significant progress across our portfolio companies, with several key milestones achieved in product development, customer acquisition, and funding rounds.</p>
                      <p>{fundSettings?.investmentStrategy || 'The Indian deep tech ecosystem continues to show remarkable resilience and growth, with increasing enterprise adoption of AI and advanced technologies across sectors.'}</p>
                    </>
                  )}

                  {report?.investmentActivityNotes && report.investmentActivityNotes.length > 0 && (
                    <>
                      <h4 style={{ marginTop: '2rem', marginBottom: '1rem', fontWeight: 600 }}>Investment Activity</h4>
                      <PortableText value={report.investmentActivityNotes} />
                    </>
                  )}

                  {report?.portfolioHighlightsNotes && report.portfolioHighlightsNotes.length > 0 && (
                    <>
                      <h4 style={{ marginTop: '2rem', marginBottom: '1rem', fontWeight: 600 }}>Portfolio Highlights</h4>
                      <PortableText value={report.portfolioHighlightsNotes} />
                    </>
                  )}

                  {report?.ecosystemNotes && report.ecosystemNotes.length > 0 && (
                    <>
                      <h4 style={{ marginTop: '2rem', marginBottom: '1rem', fontWeight: 600 }}>Ecosystem & Tailwinds</h4>
                      <PortableText value={report.ecosystemNotes} />
                    </>
                  )}

                  {report?.closingNotes && report.closingNotes.length > 0 && (
                    <>
                      <h4 style={{ marginTop: '2rem', marginBottom: '1rem', fontWeight: 600 }}>Closing Note</h4>
                      <PortableText value={report.closingNotes} />
                    </>
                  )}
                </div>
                <div className={styles.messageSignature}>
                  <p className={styles.signatureName}>{signatory.name}</p>
                  <p className={styles.signatureTitle}>{signatory.role}</p>
                </div>
              </div>
            </section>

            {/* Portfolio Companies */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Portfolio Companies ({portfolioData.length})</h2>
              </div>
              <CompanyGrid portfolioData={portfolioData} />
            </section>

            {/* Investment Summary Table */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Investment Summary</h2>
              </div>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>First Investment</th>
                    <th>Round</th>
                    <th>Invested</th>
                    <th>Ownership</th>
                    <th>FMV</th>
                    <th>Multiple</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioData.map((item, index) => (
                    <tr key={item.company?._id || index}>
                      <td>{item.company?.name || 'Company'}</td>
                      <td>{formatDate(item.investment?.investmentDate)}</td>
                      <td>{item.investment?.fundingRound?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '-'}</td>
                      <td>{formatCurrency(item.investment?.yaliInvestmentAmount, 1)}</td>
                      <td>{formatPercent(item.currentOwnershipPercent)}</td>
                      <td>{formatCurrency(item.currentFMV, 1)}</td>
                      <td>{item.multipleOfInvestment?.toFixed(2)}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Pipeline */}
            {pipelineDeals.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Investment Pipeline</h2>
                </div>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Sector</th>
                      <th>Proposed Amount</th>
                      <th>Stage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipelineDeals.map((deal, index) => (
                      <tr key={deal._id || index}>
                        <td>{deal.companyName}</td>
                        <td>{deal.sector}</td>
                        <td>{formatCurrency(deal.proposedAmountINR, 1)}</td>
                        <td>{deal.stage?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
          </div>

          {/* Side Column */}
          <div className={styles.sideColumn}>
            {/* Fund Info */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Fund Info</h2>
              </div>
              <div className={styles.messageContent}>
                <p><strong>{fundSettings?.fundName || 'Yali Deeptech Fund I'}</strong></p>
                <p>{fundSettings?.fundManagerName || 'Yali Partners LLP'}</p>
                {fundSettings?.firstCloseDate && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.8 }}>
                    First Close: {formatDate(fundSettings.firstCloseDate)}
                  </p>
                )}
                {fundSettings?.finalCloseDate && (
                  <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                    Final Close: {formatDate(fundSettings.finalCloseDate)}
                  </p>
                )}
              </div>
            </section>

            {/* Media Coverage */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Media Coverage</h2>
              </div>
              <div className={styles.newsList}>
                {newsItems.slice(0, 5).map((news, index) => (
                  <a
                    key={news._id || index}
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.newsItem}
                  >
                    <span className={styles.newsDate}>{formatNewsDate(news.date)}</span>
                    <span className={styles.newsTitle}>{news.headlineEdited}</span>
                  </a>
                ))}
              </div>
              <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                <a href="https://yali.vc/newsroom" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem', color: 'inherit', opacity: 0.7, textDecoration: 'underline' }}>
                  View All →
                </a>
              </div>
            </section>

            {/* Contact */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Contact</h2>
              </div>
              <div className={styles.contactContent}>
                <p className={styles.contactLabel}>Investor Relations</p>
                <p className={styles.contactValue}>sunil@yali.vc</p>
                <p className={styles.contactLabel} style={{ marginTop: '1rem' }}>Website</p>
                <p className={styles.contactValue}>{fundSettings?.website || 'https://yali.vc'}</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.portalFooter}>
        <div className={styles.footerContent}>
          <span className={styles.footerText}>
            © {new Date().getFullYear()} Yali Capital. Confidential - For LP use only.
          </span>
          <div className={styles.footerLinks}>
            <a href="https://yali.vc" className={styles.footerLink}>Main Site</a>
            <a href={`mailto:${fundSettings?.investorRelationsEmail || 'sunil@yali.vc'}`} className={styles.footerLink}>Contact IR</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
