'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { PortableText } from '@portabletext/react';
import styles from '../../partners.module.css';
import { Lightlogo } from '../../../../components/icons/lightlogo';
import { Openicon } from '../../../../components/icons/small icons/Openicon';
import { CloseIcon } from '../../../../components/icons/small icons/closeicon';

import Footer from '../../../../components/footer';

export default function CompanyDetailClient({ company, currentReportPeriod, allCompanySlugs, reportSlug, allReports, isLatestReport }) {
  const router = useRouter();
  const [showPreviousQuarters, setShowPreviousQuarters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [fyDropdownOpen, setFyDropdownOpen] = useState(false);
  const [olderReportBannerDismissed, setOlderReportBannerDismissed] = useState(false);
  const headerRef = useRef(null);
  const dropdownRef = useRef(null);
  const dropdownTimerRef = useRef(null);

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

  // Scroll-responsive header (hide on scroll down, show on scroll up)
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 100) {
        if (currentScrollY > lastScrollY) {
          setHeaderHidden(true);
        } else {
          setHeaderHidden(false);
        }
      } else {
        setHeaderHidden(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setFyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Next/prev company navigation
  const currentCompanyIndex = allCompanySlugs?.findIndex(c => c.slug === company.slug) ?? -1;
  const prevCompany = currentCompanyIndex > 0 ? allCompanySlugs[currentCompanyIndex - 1] : null;
  const nextCompany = currentCompanyIndex >= 0 && currentCompanyIndex < (allCompanySlugs?.length || 0) - 1
    ? allCompanySlugs[currentCompanyIndex + 1]
    : null;

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

  // PortableText components for rendering rich text
  const portableTextComponents = {
    block: {
      normal: ({ children }) => <p className={styles.quarterUpdateNotes}>{children}</p>,
      h3: ({ children }) => <h3 className={styles.quarterUpdateHeading}>{children}</h3>,
      h4: ({ children }) => <h4 className={styles.quarterUpdateSubheading}>{children}</h4>,
    },
    list: {
      bullet: ({ children }) => <ul className={styles.quarterUpdateHighlights}>{children}</ul>,
      number: ({ children }) => <ol className={styles.quarterUpdateHighlights}>{children}</ol>,
    },
    listItem: {
      bullet: ({ children }) => <li>{children}</li>,
      number: ({ children }) => <li>{children}</li>,
    },
    marks: {
      link: ({ children, value }) => (
        <a href={value?.href} target="_blank" rel="noopener noreferrer" className={styles.quarterUpdateLink}>
          {children}
        </a>
      ),
    },
  };

  // Helper to render update notes - supports both Portable Text (new) and plain text (legacy)
  const renderUpdateNotes = (notes) => {
    if (!notes) return null;

    // Check if notes is Portable Text (array of blocks) or legacy string
    if (Array.isArray(notes)) {
      // New Portable Text format
      return (
        <div className={styles.quarterUpdateNotesContainer}>
          <PortableText value={notes} components={portableTextComponents} />
        </div>
      );
    }

    // Legacy string format - render as plain paragraph (no auto-bulletisation)
    if (typeof notes === 'string') {
      return <p className={styles.quarterUpdateNotes}>{notes}</p>;
    }

    return null;
  };

  // Helper to get a sortable number from quarter data (higher = more recent)
  const quarterSortKey = (q) => {
    const yearNum = parseInt(q.fiscalYear?.replace('FY', '') || '0', 10);
    const qNum = parseInt(q.quarter?.replace('Q', '') || '0', 10);
    return yearNum * 10 + qNum;
  };

  // Find quarterly update matching the current report period
  const allQuarterlyUpdates = company.quarterlyUpdates || [];
  const currentQuarterUpdate = allQuarterlyUpdates.find(
    q => q.quarter === currentReportPeriod?.quarter && q.fiscalYear === currentReportPeriod?.fiscalYear
  );

  // Helper to check if update notes have content (works for both Portable Text and legacy strings)
  const hasUpdateNotes = (notes) => {
    if (!notes) return false;
    if (Array.isArray(notes)) return notes.length > 0;
    if (typeof notes === 'string') return notes.trim().length > 0;
    return false;
  };

  // Previous quarters = all quarters that are NOT the current report period, sorted most recent first
  // Only show quarters that have update notes
  const previousQuarters = allQuarterlyUpdates
    .filter(q => !(q.quarter === currentReportPeriod?.quarter && q.fiscalYear === currentReportPeriod?.fiscalYear))
    .filter(q => hasUpdateNotes(q.updateNotes))
    .sort((a, b) => quarterSortKey(b) - quarterSortKey(a));

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
    { id: 'download-centre', label: 'Download Centre' },
  ];

  // Handle menu click - navigate to main portal with section (preserve report context)
  const handleMenuClick = (id) => {
    const reportParam = reportSlug ? `&report=${reportSlug}` : '';
    router.push(`/partners?section=${id}${reportParam}`);
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
      <header
        ref={headerRef}
        className={`${styles.portalHeader} ${headerHidden ? styles.portalHeaderHidden : ''}`}
      >
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
          <div
            className={styles.fyDropdown}
            ref={dropdownRef}
            onMouseEnter={() => clearTimeout(dropdownTimerRef.current)}
            onMouseLeave={() => {
              dropdownTimerRef.current = setTimeout(() => setFyDropdownOpen(false), 400);
            }}
          >
            <button
              className={styles.fyDropdownBtn}
              onClick={() => setFyDropdownOpen(!fyDropdownOpen)}
            >
              <span>{currentReportPeriod?.quarter} {currentReportPeriod?.fiscalYear}</span>
              <span className={styles.fyDropdownArrow}>▼</span>
            </button>
            {fyDropdownOpen && allReports && allReports.length > 0 && (
              <div className={styles.fyDropdownMenu}>
                {allReports.map((r) => (
                  <a
                    key={r.slug}
                    href={`/partners/company/${company.slug}?report=${r.slug}`}
                    className={`${styles.fyDropdownItem} ${r.slug === reportSlug ? styles.fyDropdownItemActive : ''}`}
                    onClick={() => setFyDropdownOpen(false)}
                  >
                    {r.quarter} {r.fiscalYear}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Older Report Banner */}
      {!isLatestReport && !olderReportBannerDismissed && (
        <div className={`${styles.olderReportBanner} ${headerHidden ? styles.olderReportBannerHidden : ''}`}>
          <span>
            You are viewing an older report ({currentReportPeriod?.quarter} {currentReportPeriod?.fiscalYear}).{' '}
            <a href={`/partners/company/${company.slug}`} className={styles.olderReportBannerLink}>
              Switch to the latest →
            </a>
          </span>
          <button
            className={styles.olderReportBannerClose}
            onClick={() => setOlderReportBannerDismissed(true)}
            aria-label="Dismiss banner"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Layout with Sidebar */}
      <div className={`${styles.portalLayout} ${!sidebarOpen ? styles.sidebarCollapsed : ''} ${(!isLatestReport && !olderReportBannerDismissed) ? styles.portalLayoutWithBanner : ''}`}>
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

        {/* Mobile sidebar overlay - closes sidebar on outside click */}
        {isMobile && sidebarOpen && (
          <div
            className={styles.sidebarOverlay}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className={styles.mainArea}>
          <section className={`${styles.contentSection} ${styles.companyDetailSection}`}>
            {/* Back Link */}
            <Link href={`/partners?section=portfolio-company-updates${reportSlug ? `&report=${reportSlug}` : ''}`} className={styles.backLink}>
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
                {company.link && (
                  <a
                    href={company.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.companyHeaderLink}
                  >
                    Visit Website →
                  </a>
                )}
              </div>
            </div>

            {/* Performance Summary Table */}
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
                  <td>{latestQuarter?.currentFMV != null ? formatCurrency(latestQuarter.currentFMV) : '-'}</td>
                </tr>
                <tr>
                  <td>Amount returned to investors</td>
                  <td>{latestQuarter?.amountReturned != null ? formatCurrency(latestQuarter.amountReturned) : '-'}</td>
                </tr>
                <tr>
                  <td>Multiple of investment</td>
                  <td>{latestQuarter?.multipleOfInvestment != null ? latestQuarter.multipleOfInvestment.toFixed(2) : '-'}</td>
                </tr>
                {company.coInvestors?.length > 0 && (
                  <tr>
                    <td>Key co-investors</td>
                    <td>
                      {company.coInvestors.length === 1 ? (
                        <span className={styles.coInvestorSingle}>{company.coInvestors[0]}</span>
                      ) : (
                        <ol className={styles.coInvestorsList}>
                          {company.coInvestors.map((investor, idx) => (
                            <li key={idx}>{idx + 1}. {investor}</li>
                          ))}
                        </ol>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* About Section */}
            {(company.aboutCompany || company.detail || company.oneLiner) && (
              <div className={styles.companyAboutSection}>
                <h3 className={styles.companyAboutTitle}>About the Company</h3>
                <p className={styles.companyAboutText}>
                  {company.aboutCompany || company.detail || company.oneLiner}
                </p>
              </div>
            )}

            {/* Investment Round Details Table - Combined: Investment Details (first round) + Follow-on Rounds */}
            {(() => {
              // Build combined rounds array: Investment Details as first round + investmentRounds as follow-ons
              const allRounds = [];

              // First round from Investment Details tab (if any investment data exists)
              const hasFirstRound = company.fundingRound || company.yaliInvestmentAmount || company.preMoneyValuation || company.totalRoundSize || company.postMoneyValuation;
              if (hasFirstRound) {
                allRounds.push({
                  roundName: company.fundingRound,
                  investmentDate: company.investmentDate,
                  preMoneyValuation: company.preMoneyValuation,
                  totalRoundSize: company.totalRoundSize,
                  postMoneyValuation: company.postMoneyValuation,
                  yaliInvestment: company.yaliInvestmentAmount,
                  yaliOwnership: company.yaliOwnershipPercent,
                  coInvestors: company.coInvestors,
                  isFirstRound: true, // Mark as coming from Investment Details
                });
              }

              // Follow-on rounds from investmentRounds array
              if (company.investmentRounds?.length > 0) {
                allRounds.push(...company.investmentRounds.map(r => ({ ...r, isFirstRound: false })));
              }

              // Only show section if there's round data
              if (allRounds.length === 0) return null;

              return (
                <div className={styles.roundMetricsSection}>
                  <h3 className={styles.companyAboutTitle}>Investment round details</h3>

                  <div className={styles.roundsTableWrapper}>
                    <table className={styles.roundsTable}>
                      <thead>
                        <tr>
                          <th></th>
                          {allRounds.map((round, idx) => (
                            <th key={idx}>{formatRound(round.roundName)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Pre-money valuation</td>
                          {allRounds.map((round, idx) => (
                            <td key={idx}>{round.preMoneyValuation ? formatCurrency(round.preMoneyValuation) : '-'}</td>
                          ))}
                        </tr>
                        <tr>
                          <td>Total investment</td>
                          {allRounds.map((round, idx) => (
                            <td key={idx}>{round.totalRoundSize ? formatCurrency(round.totalRoundSize) : '-'}</td>
                          ))}
                        </tr>
                        <tr>
                          <td>Post-money valuation</td>
                          {allRounds.map((round, idx) => (
                            <td key={idx}>{round.postMoneyValuation ? formatCurrency(round.postMoneyValuation) : '-'}</td>
                          ))}
                        </tr>
                        <tr>
                          <td>Yali's investment</td>
                          {allRounds.map((round, idx) => (
                            <td key={idx}>{round.yaliInvestment ? formatCurrency(round.yaliInvestment) : '-'}</td>
                          ))}
                        </tr>
                        <tr>
                          <td>Yali's ownership in %</td>
                          {allRounds.map((round, idx) => (
                            <td key={idx}>{round.yaliOwnership ? round.yaliOwnership.toFixed(2) : '-'}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className={styles.tableFootnote}>All figures except percentages are in ₹ crore</p>
                </div>
              );
            })()}

            {/* Financials / Key Matrix */}
            {(() => {
              // Only show for revenue-making companies with quarterly data
              const quartersWithFinancials = allQuarterlyUpdates
                .filter(q => q.revenueINR != null || q.patINR != null)
                .sort((a, b) => quarterSortKey(b) - quarterSortKey(a));

              if (!company.isRevenueMaking || quartersWithFinancials.length === 0) return null;

              // Format FY label: FY26 -> 2025-26
              const formatFYLabel = (quarter, fy) => {
                if (!fy) return `${quarter}`;
                const yearNum = parseInt(fy.replace('FY', ''), 10);
                const fullYear = yearNum < 50 ? 2000 + yearNum : 1900 + yearNum;
                return `${quarter} ${fullYear - 1}-${String(fullYear).slice(2)}`;
              };

              // Format PAT: negative in parentheses
              const formatPAT = (value) => {
                if (value == null) return '-';
                if (value < 0) return `(${Math.abs(value).toFixed(2)})`;
                return value.toFixed(2);
              };

              return (
                <div className={styles.roundMetricsSection}>
                  <h3 className={styles.companyAboutTitle}>Financials / Key matrix</h3>
                  <div className={styles.roundsTableWrapper}>
                    <table className={styles.roundsTable}>
                      <thead>
                        <tr>
                          <th>Particulars</th>
                          {quartersWithFinancials.map((q, idx) => (
                            <th key={idx}>{formatFYLabel(q.quarter, q.fiscalYear)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Revenue</td>
                          {quartersWithFinancials.map((q, idx) => (
                            <td key={idx}>{q.revenueINR != null ? q.revenueINR.toFixed(2) : '-'}</td>
                          ))}
                        </tr>
                        <tr>
                          <td>PAT</td>
                          {quartersWithFinancials.map((q, idx) => (
                            <td key={idx}>{formatPAT(q.patINR)}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className={styles.tableFootnote}>All figures except percentages are in ₹ crore</p>
                </div>
              );
            })()}

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

                  {(currentQuarterUpdate.currentFMV != null || currentQuarterUpdate.multipleOfInvestment != null || currentQuarterUpdate.revenueINR != null || currentQuarterUpdate.patINR != null || currentQuarterUpdate.teamSize) && (
                    <div className={styles.quarterUpdateMetrics}>
                      {currentQuarterUpdate.currentFMV != null && (
                        <div className={styles.quarterUpdateMetric}>
                          <span className={styles.quarterUpdateMetricLabel}>FMV</span>
                          <span className={styles.quarterUpdateMetricValue}>
                            ₹{formatCurrency(currentQuarterUpdate.currentFMV)} Cr
                          </span>
                        </div>
                      )}
                      {currentQuarterUpdate.multipleOfInvestment != null && (
                        <div className={styles.quarterUpdateMetric}>
                          <span className={styles.quarterUpdateMetricLabel}>Multiple</span>
                          <span className={styles.quarterUpdateMetricValue}>
                            {currentQuarterUpdate.multipleOfInvestment.toFixed(2)}x
                          </span>
                        </div>
                      )}
                      {company.isRevenueMaking ? (
                        <>
                          {currentQuarterUpdate.revenueINR != null && (
                            <div className={styles.quarterUpdateMetric}>
                              <span className={styles.quarterUpdateMetricLabel}>Revenue</span>
                              <span className={styles.quarterUpdateMetricValue}>
                                ₹{formatCurrency(currentQuarterUpdate.revenueINR)} Cr
                              </span>
                            </div>
                          )}
                          {currentQuarterUpdate.patINR != null && (
                            <div className={styles.quarterUpdateMetric}>
                              <span className={styles.quarterUpdateMetricLabel}>PAT</span>
                              <span className={styles.quarterUpdateMetricValue}>
                                ₹{formatCurrency(currentQuarterUpdate.patINR)} Cr
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className={styles.quarterUpdateMetric}>
                          <span className={styles.quarterUpdateMetricLabel}>Financials</span>
                          <span className={styles.quarterUpdateMetricValue} style={{ fontSize: '0.8125rem', color: '#666' }}>
                            This company is pre-revenue
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
                  )}

                  {renderUpdateNotes(currentQuarterUpdate.updateNotes)}
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
                    <span className={styles.previousQuartersIcon}>
                      {showPreviousQuarters ? '−' : '+'}
                    </span>
                    <h2 className={styles.previousQuartersHeading}>
                      Previous Quarters ({previousQuarters.length})
                    </h2>
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

                          {(quarter.currentFMV != null || quarter.multipleOfInvestment != null || quarter.revenueINR != null || quarter.teamSize) && (
                            <div className={styles.quarterUpdateMetrics}>
                              {quarter.currentFMV != null && (
                                <div className={styles.quarterUpdateMetric}>
                                  <span className={styles.quarterUpdateMetricLabel}>FMV</span>
                                  <span className={styles.quarterUpdateMetricValue}>
                                    ₹{formatCurrency(quarter.currentFMV)} Cr
                                  </span>
                                </div>
                              )}
                              {quarter.multipleOfInvestment != null && (
                                <div className={styles.quarterUpdateMetric}>
                                  <span className={styles.quarterUpdateMetricLabel}>Multiple</span>
                                  <span className={styles.quarterUpdateMetricValue}>
                                    {quarter.multipleOfInvestment.toFixed(2)}x
                                  </span>
                                </div>
                              )}
                              {company.isRevenueMaking ? (
                                <>
                                  {quarter.revenueINR != null && (
                                    <div className={styles.quarterUpdateMetric}>
                                      <span className={styles.quarterUpdateMetricLabel}>Revenue</span>
                                      <span className={styles.quarterUpdateMetricValue}>
                                        ₹{formatCurrency(quarter.revenueINR)} Cr
                                      </span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className={styles.quarterUpdateMetric}>
                                  <span className={styles.quarterUpdateMetricLabel}>Financials</span>
                                  <span className={styles.quarterUpdateMetricValue} style={{ fontSize: '0.8125rem', color: '#666' }}>
                                    This company is pre-revenue
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
                          )}

                          {renderUpdateNotes(quarter.updateNotes)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Next/Prev Company Navigation */}
            <div className={styles.sectionNavigation}>
              {prevCompany ? (
                <Link
                  href={`/partners/company/${prevCompany.slug}${reportSlug ? `?report=${reportSlug}` : ''}`}
                  className={styles.sectionNavBtn}
                >
                  <span className={styles.sectionNavArrow}>←</span>
                  <span className={styles.sectionNavLabel}>{prevCompany.name}</span>
                </Link>
              ) : (
                <div></div>
              )}
              {nextCompany ? (
                <Link
                  href={`/partners/company/${nextCompany.slug}${reportSlug ? `?report=${reportSlug}` : ''}`}
                  className={`${styles.sectionNavBtn} ${styles.sectionNavBtnNext}`}
                >
                  <span className={styles.sectionNavLabel}>{nextCompany.name}</span>
                  <span className={styles.sectionNavArrow}>→</span>
                </Link>
              ) : (
                <Link
                  href={`/partners?section=fund-financials${reportSlug ? `&report=${reportSlug}` : ''}`}
                  className={`${styles.sectionNavBtn} ${styles.sectionNavBtnNext}`}
                >
                  <span className={styles.sectionNavLabel}>Fund Financials</span>
                  <span className={styles.sectionNavArrow}>→</span>
                </Link>
              )}
            </div>

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
