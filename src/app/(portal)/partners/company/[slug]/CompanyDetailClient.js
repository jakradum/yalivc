'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from '../../partners.module.css';
import { Lightlogo } from '../../../../components/icons/lightlogo';
import { Openicon } from '../../../../components/icons/small icons/Openicon';
import { CloseIcon } from '../../../../components/icons/small icons/closeicon';
import Footer from '../../../../components/footer';

export default function CompanyDetailClient({ company, currentReportPeriod }) {
  const router = useRouter();
  const [showPreviousQuarters, setShowPreviousQuarters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Detect mobile and set default sidebar state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const formatCurrency = (value, decimals = 2) => {
    if (!value && value !== 0) return '-';
    return `${Number(value).toFixed(decimals)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    });
  };

  const formatRound = (round) => {
    if (!round) return '-';
    return round.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Helper to render update notes - converts line breaks to bullets if multiple lines
  const renderUpdateNotes = (notes) => {
    if (!notes) return null;

    // Split by line breaks and filter out empty lines
    const lines = notes.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

    // If single line, render as paragraph
    if (lines.length === 1) {
      return <p className={styles.quarterUpdateNotes}>{lines[0]}</p>;
    }

    // If multiple lines, render as bullet list
    return (
      <ul className={styles.quarterUpdateHighlights}>
        {lines.map((line, idx) => (
          <li key={idx}>{line}</li>
        ))}
      </ul>
    );
  };

  // Find quarterly update matching the current report period
  const allQuarterlyUpdates = company.quarterlyUpdates || [];
  const currentQuarterUpdate = allQuarterlyUpdates.find(
    q => q.quarter === currentReportPeriod?.quarter && q.fiscalYear === currentReportPeriod?.fiscalYear
  );

  // Previous quarters = all quarters that are NOT the current report period
  const previousQuarters = allQuarterlyUpdates.filter(
    q => !(q.quarter === currentReportPeriod?.quarter && q.fiscalYear === currentReportPeriod?.fiscalYear)
  );

  // For FMV display in investment table, use current quarter data if available, else most recent
  const latestQuarter = currentQuarterUpdate || company.latestQuarter || allQuarterlyUpdates[0];

  // Menu items matching the main portal
  const menuItems = [
    { id: 'cover-note', label: 'Cover note' },
    { id: 'fund-summary', label: 'Fund summary' },
    { id: 'portfolio-investment-summary', label: 'Portfolio investment summary' },
    { id: 'portfolio-company-updates', label: 'Portfolio company updates' },
    { id: 'fund-financials', label: 'Fund financials' },
    { id: 'pipeline-summary', label: 'Pipeline summary' },
    { id: 'media-coverage', label: 'Media coverage' },
    { id: 'contact-information', label: 'Contact Information' },
  ];

  // Handle menu click - navigate to main portal with section
  const handleMenuClick = (id) => {
    router.push(`/partners?section=${id}`);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={styles.portalContainer}>
      {/* Header */}
      <header className={styles.portalHeader}>
        <div className={styles.headerLeft}>
          <button
            className={styles.sidebarToggle}
            onClick={handleSidebarToggle}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <CloseIcon /> : <Openicon />}
          </button>
          <Link href="/partners" className={styles.logoLink}>
            <Lightlogo />
          </Link>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.quarterLabel}>
            {currentReportPeriod?.quarter} {currentReportPeriod?.fiscalYear}
          </span>
        </div>
      </header>

      {/* Main Layout with Sidebar */}
      <div className={`${styles.portalLayout} ${!sidebarOpen ? styles.sidebarCollapsed : ''}`}>
        {/* Fixed Sidebar */}
        <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarHidden : ''}`}>
          <nav className={styles.sidebarNav}>
            <ul className={styles.menuList}>
              {menuItems.map((item) => (
                <li key={item.id} className={styles.menuListItem}>
                  <button
                    onClick={() => handleMenuClick(item.id)}
                    className={styles.menuItem}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.mainArea}>
          <section className={`${styles.contentSection} ${styles.companyDetailSection}`}>
            {/* Back Link */}
            <Link href="/partners?section=portfolio-company-updates" className={styles.backLink}>
              <span className={styles.backLinkArrow}>←</span>
              Back to Portfolio
            </Link>

            {/* Company Header */}
            <div className={styles.companyDetailHeader}>
              {company.logo ? (
                <Image
                  src={company.logo}
                  alt={company.name}
                  width={80}
                  height={80}
                  className={styles.companyDetailLogo}
                />
              ) : (
                <div className={styles.companyDetailLogoPlaceholder}>
                  {company.name?.charAt(0) || '?'}
                </div>
              )}
              <div className={styles.companyDetailHeaderInfo}>
                <h1 className={styles.companyDetailName}>{company.name}</h1>
                <span className={styles.companyDetailSector}>{company.sector || '-'}</span>
              </div>
            </div>

            {/* Investment Details Table */}
            <table className={styles.investmentDetailsTable}>
              <tbody>
                <tr>
                  <td>Date of first investment</td>
                  <td>{formatDate(company.investmentDate)}</td>
                </tr>
                <tr>
                  <td>Funding round</td>
                  <td>{formatRound(company.fundingRound)}</td>
                </tr>
                <tr>
                  <td>Total amount invested</td>
                  <td>{formatCurrency(company.yaliInvestmentAmount)}</td>
                </tr>
                <tr>
                  <td>Ownership fully diluted</td>
                  <td>{company.yaliOwnershipPercent ? `${company.yaliOwnershipPercent.toFixed(2)}%` : '-'}</td>
                </tr>
                <tr>
                  <td>FMV</td>
                  <td>{formatCurrency(latestQuarter?.currentFMV || company.yaliInvestmentAmount)}</td>
                </tr>
                <tr>
                  <td>Amount returned to investors</td>
                  <td>{latestQuarter?.amountReturned ? formatCurrency(latestQuarter.amountReturned) : '-'}</td>
                </tr>
                <tr>
                  <td>Multiple of investment</td>
                  <td>{latestQuarter?.multipleOfInvestment?.toFixed(2) || '1.00'}</td>
                </tr>
                {company.coInvestors?.length > 0 && (
                  <tr>
                    <td>Key co-investors</td>
                    <td>
                      <ol className={styles.coInvestorsList}>
                        {company.coInvestors.map((investor, idx) => (
                          <li key={idx}>{idx + 1}. {investor}</li>
                        ))}
                      </ol>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* About Section */}
            {(company.detail || company.oneLiner) && (
              <div className={styles.companyAboutSection}>
                <h3 className={styles.companyAboutTitle}>About the Company</h3>
                <p className={styles.companyAboutText}>
                  {company.detail || company.oneLiner}
                </p>
              </div>
            )}

            {/* Quarterly Updates Section */}
            <div className={styles.quarterlyUpdatesSection}>
              <h2 className={styles.quarterlyUpdatesTitle}>
                Quarterly Updates for {currentReportPeriod?.quarter} {currentReportPeriod?.fiscalYear}
              </h2>

              {currentQuarterUpdate ? (
                /* Show current quarter data if it exists */
                <div className={styles.currentQuarterUpdate}>
                  <div className={styles.quarterUpdateHeader}>
                    <span className={styles.quarterUpdatePeriod}>
                      {currentQuarterUpdate.quarter} {currentQuarterUpdate.fiscalYear}
                    </span>
                  </div>

                  <div className={styles.quarterUpdateMetrics}>
                    <div className={styles.quarterUpdateMetric}>
                      <span className={styles.quarterUpdateMetricLabel}>FMV</span>
                      <span className={styles.quarterUpdateMetricValue}>
                        ₹{formatCurrency(currentQuarterUpdate.currentFMV)} Cr
                      </span>
                    </div>
                    <div className={styles.quarterUpdateMetric}>
                      <span className={styles.quarterUpdateMetricLabel}>Multiple</span>
                      <span className={styles.quarterUpdateMetricValue}>
                        {currentQuarterUpdate.multipleOfInvestment?.toFixed(2) || '1.00'}x
                      </span>
                    </div>
                    {currentQuarterUpdate.revenueINR && (
                      <div className={styles.quarterUpdateMetric}>
                        <span className={styles.quarterUpdateMetricLabel}>Revenue</span>
                        <span className={styles.quarterUpdateMetricValue}>
                          ₹{formatCurrency(currentQuarterUpdate.revenueINR)} Cr
                        </span>
                      </div>
                    )}
                    {currentQuarterUpdate.teamSize && (
                      <div className={styles.quarterUpdateMetric}>
                        <span className={styles.quarterUpdateMetricLabel}>Team Size</span>
                        <span className={styles.quarterUpdateMetricValue}>
                          {currentQuarterUpdate.teamSize}
                        </span>
                      </div>
                    )}
                  </div>

                  {renderUpdateNotes(currentQuarterUpdate.updateNotes)}

                  {currentQuarterUpdate.highlights?.length > 0 && (
                    <ul className={styles.quarterUpdateHighlights}>
                      {currentQuarterUpdate.highlights.map((highlight, idx) => (
                        <li key={idx}>{highlight}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                /* No data for current quarter */
                <div className={styles.noQuarterUpdate}>
                  <p className={styles.noQuarterUpdateText}>
                    No updates entered for {currentReportPeriod?.quarter} {currentReportPeriod?.fiscalYear}
                  </p>
                </div>
              )}

              {/* Previous Quarters (Collapsed) */}
              {previousQuarters.length > 0 && (
                <div className={styles.previousQuartersSection}>
                  <button
                    className={styles.previousQuartersToggle}
                    onClick={() => setShowPreviousQuarters(!showPreviousQuarters)}
                  >
                    <span className={`${styles.previousQuartersArrow} ${showPreviousQuarters ? styles.previousQuartersArrowOpen : ''}`}>
                      ▼
                    </span>
                    Previous Quarters ({previousQuarters.length})
                  </button>

                  {showPreviousQuarters && (
                    <div className={styles.previousQuartersList}>
                      {previousQuarters.map((quarter, idx) => (
                        <div key={idx} className={styles.previousQuarterItem}>
                          <div className={styles.previousQuarterHeader}>
                            <span className={styles.previousQuarterPeriod}>
                              {quarter.quarter} {quarter.fiscalYear}
                            </span>
                          </div>

                          <div className={styles.quarterUpdateMetrics}>
                            <div className={styles.quarterUpdateMetric}>
                              <span className={styles.quarterUpdateMetricLabel}>FMV</span>
                              <span className={styles.quarterUpdateMetricValue}>
                                ₹{formatCurrency(quarter.currentFMV)} Cr
                              </span>
                            </div>
                            <div className={styles.quarterUpdateMetric}>
                              <span className={styles.quarterUpdateMetricLabel}>Multiple</span>
                              <span className={styles.quarterUpdateMetricValue}>
                                {quarter.multipleOfInvestment?.toFixed(2) || '1.00'}x
                              </span>
                            </div>
                            {quarter.revenueINR && (
                              <div className={styles.quarterUpdateMetric}>
                                <span className={styles.quarterUpdateMetricLabel}>Revenue</span>
                                <span className={styles.quarterUpdateMetricValue}>
                                  ₹{formatCurrency(quarter.revenueINR)} Cr
                                </span>
                              </div>
                            )}
                            {quarter.teamSize && (
                              <div className={styles.quarterUpdateMetric}>
                                <span className={styles.quarterUpdateMetricLabel}>Team Size</span>
                                <span className={styles.quarterUpdateMetricValue}>
                                  {quarter.teamSize}
                                </span>
                              </div>
                            )}
                          </div>

                          {renderUpdateNotes(quarter.updateNotes)}

                          {quarter.highlights?.length > 0 && (
                            <ul className={styles.quarterUpdateHighlights}>
                              {quarter.highlights.map((highlight, hIdx) => (
                                <li key={hIdx}>{highlight}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Website Link */}
            {company.link && (
              <div style={{ marginTop: '2rem' }}>
                <a
                  href={company.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.modalLink}
                >
                  Visit Website →
                </a>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Footer - Main website footer for consistency */}
      <div className={styles.footerWrapper}>
        <Footer />
      </div>
    </div>
  );
}
