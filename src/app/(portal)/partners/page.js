import { getCompanies, getTeamMembers, getNews } from '@/lib/sanity-queries';
import styles from './partners.module.css';
import Link from 'next/link';
import { Lightlogo } from '../../components/icons/lightlogo';

export default async function PartnersPortal() {
  // Fetch real data from Sanity
  const [companies, teamMembers, newsItems] = await Promise.all([
    getCompanies(),
    getTeamMembers(),
    getNews(),
  ]);

  // Get the managing partner or first team member for signatory
  const managingPartner = teamMembers.find(t =>
    t.role?.toLowerCase().includes('partner') ||
    t.role?.toLowerCase().includes('investments')
  ) || teamMembers[0];

  // Mock fund data (would come from Sanity quarterlyReport in production)
  const fundData = {
    quarter: 'Q2',
    fiscalYear: 'FY26',
    reportDate: 'October 2024',
    targetCorpus: '₹300 Cr',
    capitalRaised: '₹225 Cr',
    capitalDeployed: '₹85 Cr',
    navPerUnit: '₹1.12',
    irr: '18.5%',
    moic: '1.15x',
  };

  // Generate mock portfolio data using real companies
  const portfolioData = companies.map((company, index) => ({
    company,
    dateOfFirstInvestment: new Date(2023, 3 + index * 2, 15).toISOString().split('T')[0],
    fundingRound: ['Seed', 'Pre-Series A', 'Series A', 'Seed'][index % 4],
    totalAmountInvested: [8, 12, 15, 10][index % 4],
    ownershipFullyDiluted: [12.5, 8.2, 6.5, 11.0][index % 4],
    fmv: [67, 142, 185, 91][index % 4],
    multipleOfInvestment: [0.84, 1.18, 1.23, 0.91][index % 4],
    keyCoInvestors: [
      ['Peak XV', 'Accel'],
      ['Sequoia', 'Matrix Partners'],
      ['Lightspeed', 'General Catalyst'],
      ['Kalaari', 'Blume']
    ][index % 4]
  }));

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

  // Get company initial
  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  // Quarterly highlights
  const highlights = [
    'Portfolio NAV increased by 12% quarter-over-quarter',
    'Two portfolio companies completed follow-on funding rounds',
    'One new investment deployed in the semiconductor space',
    'Strong pipeline of 15+ opportunities under active evaluation'
  ];

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
          <span className={styles.quarterLabel}>{fundData.quarter} {fundData.fiscalYear}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Quarterly Report</h1>
            <p className={styles.heroSubtitle}>Yali Capital Deep Tech Fund</p>
            <p className={styles.heroDate}>Reporting Period: Jul-Sep 2024</p>
          </div>
        </section>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Target Corpus</div>
            <div className={styles.statValue}>{fundData.targetCorpus}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Capital Raised</div>
            <div className={styles.statValue}>{fundData.capitalRaised}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Capital Deployed</div>
            <div className={styles.statValue}>{fundData.capitalDeployed}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>NAV Per Unit</div>
            <div className={styles.statValue}>{fundData.navPerUnit}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>IRR</div>
            <div className={styles.statValue}>{fundData.irr}</div>
            <div className={styles.statChange}>+2.3% QoQ</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>MOIC</div>
            <div className={styles.statValue}>{fundData.moic}</div>
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
                  <p>Dear Partners,</p>
                  <p>We are pleased to present the quarterly report for the Yali Capital Deep Tech Fund for the period ending September 2024.</p>
                  <p>This quarter marked significant progress across our portfolio companies, with several key milestones achieved in product development, customer acquisition, and funding rounds.</p>
                  <p>The Indian deep tech ecosystem continues to show remarkable resilience and growth, with increasing enterprise adoption of AI and advanced technologies across sectors.</p>
                </div>
                <div className={styles.messageSignature}>
                  <p className={styles.signatureName}>{managingPartner?.name || 'Managing Partner'}</p>
                  <p className={styles.signatureTitle}>{managingPartner?.role || 'Yali Capital'}</p>
                </div>
              </div>
            </section>

            {/* Portfolio Companies */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Portfolio Companies</h2>
              </div>
              <div className={styles.companyGrid}>
                {portfolioData.map((item, index) => (
                  <div key={item.company._id || index} className={styles.companyCard}>
                    {item.company.logo ? (
                      <img
                        src={item.company.logo}
                        alt={item.company.name}
                        className={styles.companyLogo}
                      />
                    ) : (
                      <div className={styles.companyLogoPlaceholder}>
                        {getInitial(item.company.name)}
                      </div>
                    )}
                    <div className={styles.companyInfo}>
                      <h3 className={styles.companyName}>{item.company.name}</h3>
                      <p className={styles.companyOneLiner}>{item.company.oneLiner}</p>
                      <div className={styles.companyMeta}>
                        <span className={styles.companyMetaItem}>
                          Invested: <span className={styles.companyMetaValue}>₹{item.totalAmountInvested} Cr</span>
                        </span>
                        <span className={styles.companyMetaItem}>
                          FMV: <span className={styles.companyMetaValue}>₹{item.fmv} Cr</span>
                        </span>
                        <span className={styles.companyMetaItem}>
                          Multiple: <span className={styles.companyMetaValue}>{item.multipleOfInvestment}x</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                    <tr key={item.company._id || index}>
                      <td>{item.company.name}</td>
                      <td>{formatDate(item.dateOfFirstInvestment)}</td>
                      <td>{item.fundingRound}</td>
                      <td>₹{item.totalAmountInvested} Cr</td>
                      <td>{item.ownershipFullyDiluted}%</td>
                      <td>₹{item.fmv} Cr</td>
                      <td>{item.multipleOfInvestment}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          {/* Side Column */}
          <div className={styles.sideColumn}>
            {/* Quarterly Highlights */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Q2 Highlights</h2>
              </div>
              <ul className={styles.highlightsList}>
                {highlights.map((highlight, index) => (
                  <li key={index} className={styles.highlightItem}>
                    <span className={styles.highlightIcon}></span>
                    <span className={styles.highlightText}>{highlight}</span>
                  </li>
                ))}
              </ul>
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
            </section>

            {/* Contact */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Contact</h2>
              </div>
              <div className={styles.messageContent}>
                <p><strong>Investor Relations</strong></p>
                <p>ir@yali.vc</p>
                <p style={{ marginTop: '1rem' }}><strong>Newsroom</strong></p>
                <p>yali.vc/newsroom</p>
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
            <a href="mailto:ir@yali.vc" className={styles.footerLink}>Contact IR</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
