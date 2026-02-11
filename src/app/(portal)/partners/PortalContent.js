'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './partners.module.css';
import { Lightlogo } from '../../components/icons/lightlogo';
import { Openicon } from '../../components/icons/small icons/Openicon';
import { CloseIcon } from '../../components/icons/small icons/closeicon';
import { PortableText } from '@portabletext/react';
import Footer from '../../components/footer';
import PortalTour, { replayPortalTour } from './PortalTour';

// Quarter to ending month mapping (Indian fiscal year)
const QUARTER_END_MONTHS = {
  Q1: 'June',
  Q2: 'September',
  Q3: 'December',
  Q4: 'March'
};

// Get fiscal year number from FY string (e.g., "FY26" -> 2026)
const getFiscalYearNumber = (fy) => {
  if (!fy) return new Date().getFullYear();
  const yearNum = parseInt(fy.replace('FY', ''), 10);
  return yearNum < 50 ? 2000 + yearNum : 1900 + yearNum;
};

// Calculate the "As of" date from quarter and fiscal year
const calculateAsOfDate = (quarter, fiscalYear) => {
  if (!quarter || !fiscalYear) return null;
  const month = QUARTER_END_MONTHS[quarter];
  const fyNum = getFiscalYearNumber(fiscalYear);
  // Indian FY26 runs Apr 2025 - Mar 2026
  // Q1 FY26 = Apr-Jun 2025, Q2 = Jul-Sep 2025, Q3 = Oct-Dec 2025, Q4 = Jan-Mar 2026
  let year = fyNum;
  if (quarter === 'Q4') {
    year = fyNum; // Q4 FY26 ends March 2026
  } else {
    year = fyNum - 1; // Q1-Q3 FY26 end in 2025
  }
  return `${month} ${year}`;
};

// ===== INVESTMENT ROUNDS HELPERS =====
// Get initial investment date from investmentRounds array
const getInitialInvestmentDate = (company) => {
  const rounds = company?.investmentRounds || [];
  if (rounds.length === 0) return null;
  const initialRound = rounds.find(r => r.isInitialRound) || rounds[0];
  return initialRound?.investmentDate || null;
};

// Calculate total investment from investmentRounds
const getTotalInvestment = (company) => {
  const rounds = company?.investmentRounds || [];
  return rounds.reduce((sum, r) => sum + (r.yaliInvestment || 0), 0);
};

// Get latest ownership from investmentRounds (most recent round by date)
// Matches logic in CompanyDetailClient.js for consistency
const getLatestOwnership = (company) => {
  const rounds = company?.investmentRounds || [];
  if (rounds.length === 0) return null;

  // Sort by date: rounds WITH dates sorted by date, rounds WITHOUT dates go to end
  // (end = most recent, since we sort oldest-first then take last)
  const sortedRounds = [...rounds]
    .filter(r => r.roundName) // Only valid rounds
    .sort((a, b) => {
      // Both have dates: sort by date
      if (a.investmentDate && b.investmentDate) {
        return new Date(a.investmentDate) - new Date(b.investmentDate);
      }
      // Only a has date: a comes before b (b is "newer"/undated)
      if (a.investmentDate && !b.investmentDate) return -1;
      // Only b has date: b comes before a (a is "newer"/undated)
      if (!a.investmentDate && b.investmentDate) return 1;
      // Neither has date: keep original order
      return 0;
    });

  // Take the last one (most recent)
  if (sortedRounds.length === 0) {
    return rounds[rounds.length - 1]?.yaliOwnership || null;
  }

  return sortedRounds[sortedRounds.length - 1]?.yaliOwnership || null;
};

// Get latest funding round name
const getLatestRoundName = (company) => {
  const rounds = company?.investmentRounds || [];
  if (rounds.length === 0) return null;
  const latest = rounds[rounds.length - 1];
  if (latest?.roundLabel) return latest.roundLabel;
  if (latest?.roundName) {
    return latest.roundName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return null;
};

function PortalContentInner({
  fundSettings,
  report,
  quarter,
  fiscalYear,
  reportingDate,
  gani,
  fundMetrics,
  investments,
  allReports,
  isLatestReport,
  initialSection,
  reportSlug,
  quarterNews,
  quarterSocialUpdates,
  isGiftCityLP = false
}) {
  const router = useRouter();
  const dropdownRef = useRef(null);
  const dropdownTimerRef = useRef(null);
  const headerRef = useRef(null);

  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCollapsePopup, setShowCollapsePopup] = useState(false);
  const [activeSection, setActiveSection] = useState(initialSection);
  const [fundSummaryView, setFundSummaryView] = useState('chart');
  const [fyDropdownOpen, setFyDropdownOpen] = useState(false);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [olderReportBannerDismissed, setOlderReportBannerDismissed] = useState(false);

  // Download disclaimer state
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [pendingDownload, setPendingDownload] = useState(null);
  const [isLoggingConsent, setIsLoggingConsent] = useState(false);

  // NPS Feedback state
  const [npsScore, setNpsScore] = useState(null);
  const [feedbackDetails, setFeedbackDetails] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Handle download click - show disclaimer first
  const handleDownloadClick = (downloadUrl, downloadType, reportQuarter, fileName) => {
    setPendingDownload({ url: downloadUrl, type: downloadType, quarter: reportQuarter, fileName });
    setDisclaimerOpen(true);
  };

  // Handle disclaimer agreement
  const handleDisclaimerAgree = async () => {
    if (!pendingDownload) return;

    setIsLoggingConsent(true);
    try {
      // Log consent to Sanity
      await fetch('/api/portal-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          downloadType: pendingDownload.type,
          reportQuarter: pendingDownload.quarter,
          fileName: pendingDownload.fileName,
        }),
      });

      // Proceed with download
      window.open(pendingDownload.url, '_blank');
    } catch (error) {
      console.error('Failed to log download consent:', error);
      // Still allow download even if logging fails
      window.open(pendingDownload.url, '_blank');
    } finally {
      setIsLoggingConsent(false);
      setDisclaimerOpen(false);
      setPendingDownload(null);
    }
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async () => {
    if (npsScore === null) return;

    setIsSubmittingFeedback(true);
    try {
      await fetch('/api/portal-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npsScore,
          reportQuarter: `${quarter} ${fiscalYear}`,
          feedbackDetails: npsScore < 8 ? feedbackDetails : null,
        }),
      });
      setFeedbackSubmitted(true);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Calculate the "as of" date from quarter/fiscal year
  const calculatedAsOfDate = calculateAsOfDate(quarter, fiscalYear);

  // Sort investments by initial investment date (oldest first)
  const sortedInvestments = useMemo(() => {
    if (!investments || !Array.isArray(investments)) return [];
    return [...investments].sort((a, b) => {
      const dateA = getInitialInvestmentDate(a);
      const dateB = getInitialInvestmentDate(b);
      // Companies without dates go to the end
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.localeCompare(dateB);
    });
  }, [investments]);

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

  // Handle sidebar collapse popup
  const handleSidebarToggle = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);

    // Show popup when collapsing on desktop
    if (!newState && !isMobile) {
      setShowCollapsePopup(true);
    }
  };

  // Auto-dismiss popup after 5 seconds
  useEffect(() => {
    if (showCollapsePopup) {
      const timer = setTimeout(() => {
        setShowCollapsePopup(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showCollapsePopup]);

  // Menu items matching the image structure
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

  // Handle menu click - update state and URL without triggering navigation
  const handleMenuClick = (id) => {
    setActiveSection(id);
    // Update URL without triggering a server re-render
    const url = new URL(window.location.href);
    url.searchParams.set('section', id);
    if (reportSlug) {
      url.searchParams.set('report', reportSlug);
    }
    window.history.replaceState({}, '', url.toString());
    // Close sidebar on mobile after selection
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Get flat list of all sections for prev/next navigation
  const getAllSections = () => {
    const sections = [];
    menuItems.forEach(item => {
      if (item.children) {
        item.children.forEach(child => sections.push(child.id));
      } else {
        sections.push(item.id);
      }
    });
    return sections;
  };

  const allSections = getAllSections();
  const currentIndex = allSections.indexOf(activeSection);
  const prevSection = currentIndex > 0 ? allSections[currentIndex - 1] : null;
  const nextSection = currentIndex < allSections.length - 1 ? allSections[currentIndex + 1] : null;

  // Format helpers
  const formatCurrency = (value, decimals = 0) => {
    if (!value && value !== 0) return '-';
    return `₹${Number(value).toFixed(decimals)} Cr`;
  };

  const formatPercent = (value, decimals = 1) => {
    if (!value && value !== 0) return '-';
    return `${Number(value).toFixed(decimals)}%`;
  };

  return (
    <div className={styles.portalContainer}>
      {/* First-time user tour */}
      <PortalTour />

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
            {sidebarOpen ? (
              <CloseIcon />
            ) : (
              <Openicon />
            )}
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
              <span>{quarter} {fiscalYear}</span>
              <span className={styles.fyDropdownArrow}>▼</span>
            </button>
            {fyDropdownOpen && allReports && allReports.length > 0 && (
              <div className={styles.fyDropdownMenu}>
                {allReports.map((r) => (
                  <a
                    key={r.slug}
                    href={`/partners?report=${r.slug}&section=${activeSection}`}
                    className={`${styles.fyDropdownItem} ${r.slug === report?.slug ? styles.fyDropdownItemActive : ''}`}
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
            You are viewing an older report ({quarter} {fiscalYear}).{' '}
            <a href={`/partners?section=${activeSection}`} className={styles.olderReportBannerLink}>
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

      {/* Collapse Popup */}
      {showCollapsePopup && (
        <div className={styles.collapsePopup}>
          <p>Expand sidebar to navigate through this report</p>
          <button
            className={styles.collapsePopupClose}
            onClick={() => setShowCollapsePopup(false)}
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
                  {item.children ? (
                    // Parent item with children
                    <>
                      <span className={styles.menuParent}>{item.label}</span>
                      <ul className={styles.menuSubList}>
                        {item.children.map((child) => (
                          <li key={child.id}>
                            <button
                              onClick={() => handleMenuClick(child.id)}
                              className={`${styles.menuItem} ${styles.menuSubItem} ${activeSection === child.id ? styles.menuItemActive : ''}`}
                            >
                              {child.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    // Regular menu item
                    <button
                      onClick={() => handleMenuClick(item.id)}
                      className={`${styles.menuItem} ${activeSection === item.id ? styles.menuItemActive : ''}`}
                    >
                      {item.label}
                    </button>
                  )}
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

        {/* Spacer to push content (since sidebar is fixed) */}
        <div className={styles.sidebarSpacer}></div>

        {/* Main Content */}
        <main className={styles.mainArea}>
          {/* Cover Note Section */}
          {activeSection === 'cover-note' && (
            <section id="cover-note" className={styles.coverNoteSection}>
              {/* Letterhead */}
              <div className={styles.letterhead}>
                <div className={styles.letterheadLogo}>
                  <Lightlogo />
                </div>
                <div className={styles.letterheadInfo}>
                  <span className={styles.letterheadName}>{fundSettings?.fundManagerName || '-'}</span>
                  <span className={styles.letterheadDescriptor}>{fundSettings?.fundManagerDescriptor || '-'}</span>
                </div>
              </div>

              {/* Date */}
              {calculatedAsOfDate && (
                <div className={styles.letterDate}>
                  {calculatedAsOfDate}
                </div>
              )}

              {/* Greeting */}
              {report?.coverNoteGreeting && (
                <div className={styles.letterGreeting}>
                  {report.coverNoteGreeting}
                </div>
              )}

              <div className={styles.coverNoteContent}>
                {report?.coverNoteIntro && report.coverNoteIntro.length > 0 && (
                  <PortableText value={report.coverNoteIntro} />
                )}

                {report?.investmentActivityNotes && report.investmentActivityNotes.length > 0 && (
                  <>
                    <h3>Investment Activity</h3>
                    <PortableText value={report.investmentActivityNotes} />
                  </>
                )}

                {report?.portfolioHighlightsNotes && report.portfolioHighlightsNotes.length > 0 && (
                  <>
                    <h3>Portfolio Highlights</h3>
                    <PortableText value={report.portfolioHighlightsNotes} />
                  </>
                )}

                {report?.ecosystemNotes && report.ecosystemNotes.length > 0 && (
                  <>
                    <h3>Ecosystem & Tailwinds</h3>
                    <PortableText value={report.ecosystemNotes} />
                  </>
                )}

                {report?.closingNotes && report.closingNotes.length > 0 && (
                  <>
                    <h3>Closing Note</h3>
                    <PortableText value={report.closingNotes} />
                  </>
                )}

                {/* Show message if no content from Sanity */}
                {!report?.coverNoteIntro?.length &&
                 !report?.investmentActivityNotes?.length &&
                 !report?.portfolioHighlightsNotes?.length &&
                 !report?.closingNotes?.length && (
                  <p className={styles.noContentMessage}>
                    Cover note content will appear here once added in Sanity CMS.
                  </p>
                )}
              </div>

              {/* Author Attribution */}
              {(gani?.photo || gani?.name) && (
                <div className={styles.coverNoteAuthor}>
                  {gani?.slug?.current ? (
                    <a
                      href={`https://yali.vc/about-yali/${gani.slug.current}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.authorLink}
                    >
                      {gani?.photo && (
                        <div className={styles.authorPhoto}>
                          <Image
                            src={gani.photo}
                            alt={gani?.name || 'Signatory'}
                            width={80}
                            height={80}
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      )}
                      <div className={styles.authorInfo}>
                        {gani?.name && <p className={styles.authorName}>{gani.name}</p>}
                        {gani?.role && <p className={styles.authorRole}>{gani.role}</p>}
                      </div>
                    </a>
                  ) : (
                    <>
                      {gani?.photo && (
                        <div className={styles.authorPhoto}>
                          <Image
                            src={gani.photo}
                            alt={gani?.name || 'Signatory'}
                            width={80}
                            height={80}
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      )}
                      <div className={styles.authorInfo}>
                        {gani?.name && <p className={styles.authorName}>{gani.name}</p>}
                        {gani?.role && <p className={styles.authorRole}>{gani.role}</p>}
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Fund Summary Section */}
          {activeSection === 'fund-summary' && (
            <section id="fund-summary" className={styles.contentSection}>
              <div className={styles.fundSummaryContent}>
                {/* Title */}
                <h1 className={styles.fundSummaryTitle}>Fund Summary</h1>
                {fundSettings?.targetFundSizeINR != null && (
                  <p className={styles.fundSummarySubtitle}>
                    Combined fund size: ₹{fundSettings.targetFundSizeINR} crore
                  </p>
                )}

                {/* View Toggle */}
                <div className={styles.viewToggle}>
                  <button
                    className={`${styles.viewToggleBtn} ${fundSummaryView === 'chart' ? styles.viewToggleBtnActive : ''}`}
                    onClick={() => setFundSummaryView('chart')}
                  >
                    View as Chart
                  </button>
                  <button
                    className={`${styles.viewToggleBtn} ${fundSummaryView === 'table' ? styles.viewToggleBtnActive : ''}`}
                    onClick={() => setFundSummaryView('table')}
                  >
                    View as Table
                  </button>
                </div>

                {fundSummaryView === 'chart' ? (
                  <div className={styles.chartContainer}>
                    {/* Dates Row */}
                    <div className={styles.chartDatesRow}>
                      {calculatedAsOfDate && (
                        <div className={styles.chartDateItem}>
                          <span className={styles.chartDateLabel}>As of</span>
                          <span className={styles.chartDateValue}>{calculatedAsOfDate}</span>
                        </div>
                      )}
                      {fundSettings?.firstCloseDate && (
                        <div className={styles.chartDateItem}>
                          <span className={styles.chartDateLabel}>First close date</span>
                          <span className={styles.chartDateValue}>
                            {new Date(fundSettings.firstCloseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </span>
                        </div>
                      )}
                      {fundSettings?.finalCloseDate && (
                        <div className={styles.chartDateItem}>
                          <span className={styles.chartDateLabel}>Final close date</span>
                          <span className={styles.chartDateValue}>
                            {new Date(fundSettings.finalCloseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Pie Chart */}
                    <div className={styles.pieChartContainer}>
                      {(() => {
                        const fundSize = fundSettings?.fundSizeAtClose ?? fundMetrics?.fundSizeAtClose;
                        const amountDrawn = fundMetrics?.amountDrawnDown;
                        const totalInvested = fundMetrics?.totalInvestedInPortfolio;

                        // Don't render chart if no data
                        if (!fundSize || !amountDrawn || !totalInvested) {
                          return (
                            <p className={styles.noContentMessage}>
                              Fund metrics will appear here once data is added in Sanity CMS.
                            </p>
                          );
                        }

                        // Calculate segments
                        const undrawnCapital = fundSize - amountDrawn;
                        const uninvestedDrawn = amountDrawn - totalInvested;
                        const investedCapital = totalInvested;

                        const total = fundSize;
                        // Pie chart colors - use secondary/tertiary colors only (no burgundy)
                        // Secondary: #d75d86 (pink), #66bdd4 (teal), #ebde84 (gold)
                        // Tertiary: #c28d55 (copper/bronze)
                        const segments = [
                          { label: 'Undrawn Capital', value: undrawnCapital, color: '#c28d55', percent: (undrawnCapital / total) * 100 },
                          { label: 'Uninvested (Drawn)', value: uninvestedDrawn, color: '#66bdd4', percent: (uninvestedDrawn / total) * 100 },
                          { label: 'Invested in Portfolio', value: investedCapital, color: '#ebde84', percent: (investedCapital / total) * 100 },
                        ];

                        // SVG Pie Chart calculations
                        const size = 240;
                        const center = size / 2;
                        const radius = 100;
                        let cumulativePercent = 0;

                        const getCoordinatesForPercent = (percent) => {
                          const x = Math.cos(2 * Math.PI * percent);
                          const y = Math.sin(2 * Math.PI * percent);
                          return [x, y];
                        };

                        return (
                          <div className={styles.pieChartWrapper}>
                            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.pieChart}>
                              {segments.map((segment, idx) => {
                                if (segment.value <= 0) return null;
                                const startPercent = cumulativePercent;
                                cumulativePercent += segment.percent / 100;
                                const endPercent = cumulativePercent;

                                const [startX, startY] = getCoordinatesForPercent(startPercent);
                                const [endX, endY] = getCoordinatesForPercent(endPercent);

                                const largeArcFlag = segment.percent > 50 ? 1 : 0;

                                const pathData = [
                                  `M ${center + startX * radius} ${center + startY * radius}`,
                                  `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${center + endX * radius} ${center + endY * radius}`,
                                  `L ${center} ${center}`,
                                ].join(' ');

                                return (
                                  <path
                                    key={idx}
                                    d={pathData}
                                    fill={segment.color}
                                    className={styles.pieSegment}
                                    onMouseEnter={() => setHoveredSegment(idx)}
                                    onMouseLeave={() => setHoveredSegment(null)}
                                  />
                                );
                              })}
                            </svg>

                            {/* Hover Label (desktop) */}
                            {hoveredSegment !== null && !isMobile && (
                              <div className={styles.pieTooltip}>
                                <span className={styles.pieTooltipLabel}>{segments[hoveredSegment].label}</span>
                                <span className={styles.pieTooltipValue}>₹{segments[hoveredSegment].value.toFixed(2)} Cr</span>
                                <span className={styles.pieTooltipPercent}>{segments[hoveredSegment].percent.toFixed(1)}%</span>
                              </div>
                            )}

                            {/* Legend (always visible, prominent on mobile) */}
                            <div className={styles.pieLegend}>
                              {segments.map((segment, idx) => (
                                <div
                                  key={idx}
                                  className={`${styles.pieLegendItem} ${hoveredSegment === idx ? styles.pieLegendItemActive : ''}`}
                                  onMouseEnter={() => setHoveredSegment(idx)}
                                  onMouseLeave={() => setHoveredSegment(null)}
                                >
                                  <span className={styles.pieLegendColor} style={{ backgroundColor: segment.color }}></span>
                                  <span className={styles.pieLegendLabel}>{segment.label}</span>
                                  <span className={styles.pieLegendValue}>₹{segment.value.toFixed(2)} Cr ({segment.percent.toFixed(1)}%)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* KPI Cards */}
                    <div className={styles.kpiRow}>
                      <div className={styles.kpiCard}>
                        <span className={styles.kpiLabel}>No. of portfolio companies</span>
                        <span className={styles.kpiValue}>{fundMetrics?.numberOfPortfolioCompanies != null ? fundMetrics.numberOfPortfolioCompanies : (investments?.length ?? '-')}</span>
                      </div>
                      <div className={styles.kpiCard}>
                        <span className={styles.kpiLabel}>Amount returned</span>
                        <span className={styles.kpiValue}>{fundMetrics?.amountReturned != null ? `₹${fundMetrics.amountReturned.toFixed(2)} Cr` : '-'}</span>
                      </div>
                      <div className={styles.kpiCard}>
                        <span className={styles.kpiLabel}>MOIC</span>
                        <span className={styles.kpiValue}>{fundMetrics?.moic != null ? fundMetrics.moic.toFixed(2) : '-'}</span>
                      </div>
                      <div className={styles.kpiCard}>
                        <span className={styles.kpiLabel}>TVPI</span>
                        <span className={styles.kpiValue}>{fundMetrics?.tvpi != null ? fundMetrics.tvpi.toFixed(2) : '-'}</span>
                      </div>
                      <div className={styles.kpiCard}>
                        <span className={styles.kpiLabel}>DPI</span>
                        <span className={styles.kpiValue}>{fundMetrics?.dpi != null ? fundMetrics.dpi.toFixed(4) : '-'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Table View */
                  <table className={styles.fundTable}>
                    <thead className={styles.fundTableHeader}>
                      <tr>
                        <th>As of {calculatedAsOfDate || '-'}</th>
                        <th>Amount in ₹ crores</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>First close date</td>
                        <td>
                          {fundSettings?.firstCloseDate
                            ? new Date(fundSettings.firstCloseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
                            : "-"}
                        </td>
                      </tr>
                      <tr>
                        <td>Final close date</td>
                        <td>
                          {fundSettings?.finalCloseDate
                            ? new Date(fundSettings.finalCloseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
                            : "-"}
                        </td>
                      </tr>
                      <tr>
                        <td>Combined fund size</td>
                        <td>{fundSettings?.targetFundSizeINR != null ? fundSettings.targetFundSizeINR.toFixed(2) : '-'}</td>
                      </tr>
                      <tr>
                        <td>Amount drawn down as per bank</td>
                        <td>{fundMetrics?.amountDrawnDown != null ? fundMetrics.amountDrawnDown.toFixed(2) : '-'}</td>
                      </tr>
                      <tr>
                        <td>Total invested in portfolio</td>
                        <td>{fundMetrics?.totalInvestedInPortfolio != null ? fundMetrics.totalInvestedInPortfolio.toFixed(2) : '-'}</td>
                      </tr>
                      <tr>
                        <td>Fair Market Value of Portfolio Investments (including realised value)</td>
                        <td>{fundMetrics?.fmvOfPortfolio != null ? fundMetrics.fmvOfPortfolio.toFixed(2) : '-'}</td>
                      </tr>
                      <tr>
                        <td>Number of portfolio companies</td>
                        <td>{fundMetrics?.numberOfPortfolioCompanies != null ? fundMetrics.numberOfPortfolioCompanies : (investments?.length ?? '-')}</td>
                      </tr>
                      <tr>
                        <td>Amount returned (including passive income returned)</td>
                        <td>{fundMetrics?.amountReturned != null ? fundMetrics.amountReturned.toFixed(2) : '-'}</td>
                      </tr>
                      <tr>
                        <td>MOIC</td>
                        <td>{fundMetrics?.moic != null ? fundMetrics.moic.toFixed(2) : '-'}</td>
                      </tr>
                      <tr>
                        <td>TVPI</td>
                        <td>{fundMetrics?.tvpi != null ? fundMetrics.tvpi.toFixed(2) : '-'}</td>
                      </tr>
                      <tr>
                        <td>DPI</td>
                        <td>{fundMetrics?.dpi != null ? fundMetrics.dpi.toFixed(4) : '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {/* Portfolio Investment Summary */}
          {activeSection === 'portfolio-investment-summary' && (
            <section className={`${styles.contentSection} ${styles.portfolioHubSection}`}>
              <div className={styles.sectionHeader}>
                <h1 className={styles.sectionPageTitle}>Portfolio Investment Summary</h1>
              </div>
              <div className={styles.portfolioTableWrapper}>
                <table className={styles.portfolioTable}>
                  <thead>
                    <tr>
                      <th>Sl No.</th>
                      <th>Company</th>
                      <th>Sector</th>
                      <th>Initial Investment Date</th>
                      <th>Amount in ₹ (Crores)</th>
                      <th>Fully Diluted Ownership (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedInvestments && sortedInvestments.length > 0 ? (
                      sortedInvestments.map((investment, idx) => (
                        <tr
                          key={investment._id || idx}
                          className={styles.clickableRow}
                          onClick={() => router.push(`/partners/company/${investment.slug}${reportSlug ? `?report=${reportSlug}` : ''}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>{idx + 1}</td>
                          <td className={styles.companyNameCell}>
                            {investment.entityName || investment.name || '-'}
                          </td>
                          <td>{investment.sector || '-'}</td>
                          <td>
                            {(() => {
                              const initDate = getInitialInvestmentDate(investment);
                              return initDate
                                ? new Date(initDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
                                : '-';
                            })()}
                          </td>
                          <td>{(() => {
                            const total = getTotalInvestment(investment);
                            return total > 0 ? total.toFixed(2) : '-';
                          })()}</td>
                          <td>{(() => {
                            const ownership = getLatestOwnership(investment);
                            return ownership != null ? ownership.toFixed(2) : '-';
                          })()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className={styles.noDataCell}>
                          No portfolio companies found. Add companies in Sanity CMS.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Investment Distribution Pie Chart */}
              {sortedInvestments && sortedInvestments.length > 0 && (
                <div className={styles.investmentPieSection}>
                  <h3 className={styles.investmentPieTitle}>Investment Distribution by Sector</h3>
                  {(() => {
                    // Aggregate investments by sector
                    const sectorTotals = sortedInvestments.reduce((acc, inv) => {
                      const sector = inv.sector || 'Other';
                      const investment = getTotalInvestment(inv);
                      if (investment > 0) {
                        acc[sector] = (acc[sector] || 0) + investment;
                      }
                      return acc;
                    }, {});

                    const chartData = Object.entries(sectorTotals)
                      .map(([name, value]) => ({ name, value }))
                      .sort((a, b) => b.value - a.value);

                    if (chartData.length === 0) return null;

                    const total = chartData.reduce((sum, d) => sum + d.value, 0);
                    // Pie chart colors - secondary/tertiary palette (no burgundy primary)
                    // Secondary: #d75d86 (pink), #66bdd4 (teal), #ebde84 (gold)
                    // Tertiary: #c28d55 (copper/bronze)
                    // Additional: #9f7ae4 (purple), #0d835b (green), #f5a623 (amber), #50e3c2 (mint), #B11248 (crimson)
                    const colors = ['#d75d86', '#66bdd4', '#ebde84', '#c28d55', '#9f7ae4', '#0d835b', '#f5a623', '#50e3c2', '#B11248'];

                    // SVG Pie Chart calculations
                    const size = 220;
                    const center = size / 2;
                    const radius = 90;
                    let cumulativePercent = 0;

                    const getCoordinatesForPercent = (percent) => {
                      const x = Math.cos(2 * Math.PI * percent);
                      const y = Math.sin(2 * Math.PI * percent);
                      return [x, y];
                    };

                    return (
                      <div className={styles.investmentPieWrapper}>
                        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.investmentPieChart}>
                          {chartData.map((segment, idx) => {
                            if (segment.value <= 0) return null;
                            const percent = segment.value / total;
                            const startPercent = cumulativePercent;
                            cumulativePercent += percent;

                            const [startX, startY] = getCoordinatesForPercent(startPercent);
                            const [endX, endY] = getCoordinatesForPercent(cumulativePercent);

                            const largeArcFlag = percent > 0.5 ? 1 : 0;

                            const pathData = [
                              `M ${center + startX * radius} ${center + startY * radius}`,
                              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${center + endX * radius} ${center + endY * radius}`,
                              `L ${center} ${center}`,
                            ].join(' ');

                            return (
                              <path
                                key={idx}
                                d={pathData}
                                fill={colors[idx % colors.length]}
                                className={styles.investmentPieSegment}
                                onMouseEnter={() => setHoveredSegment(idx)}
                                onMouseLeave={() => setHoveredSegment(null)}
                              />
                            );
                          })}
                        </svg>

                        {/* Legend */}
                        <div className={styles.investmentPieLegend}>
                          {chartData.map((segment, idx) => (
                            <div
                              key={idx}
                              className={`${styles.investmentPieLegendItem} ${hoveredSegment === idx ? styles.investmentPieLegendItemActive : ''}`}
                              onMouseEnter={() => setHoveredSegment(idx)}
                              onMouseLeave={() => setHoveredSegment(null)}
                            >
                              <span className={styles.investmentPieLegendColor} style={{ backgroundColor: colors[idx % colors.length] }}></span>
                              <span className={styles.investmentPieLegendName}>{segment.name}</span>
                              <span className={styles.investmentPieLegendValue}>₹{segment.value.toFixed(2)} Cr</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

            </section>
          )}

          {activeSection === 'portfolio-company-updates' && (
            <section className={`${styles.contentSection} ${styles.portfolioHubSection}`}>
              <div className={styles.sectionHeader}>
                <h1 className={styles.sectionPageTitle}>Portfolio Company Updates</h1>
              </div>

              {/* Company Tiles */}
              {sortedInvestments && sortedInvestments.length > 0 ? (
                <div className={styles.companyTilesSection}>
                  <div className={styles.companyTilesGrid}>
                    {sortedInvestments.map((company, idx) => (
                      <Link
                        key={company._id || idx}
                        href={`/partners/company/${company.slug}${reportSlug ? `?report=${reportSlug}` : ''}`}
                        className={styles.companyTile}
                      >
                        <div className={styles.companyTileHeader}>
                          {company.logo ? (
                            <Image
                              src={company.logo}
                              alt={company.entityName || company.name}
                              width={48}
                              height={48}
                              className={styles.companyTileLogo}
                            />
                          ) : (
                            <div className={styles.companyTileLogoPlaceholder}>
                              {(company.entityName || company.name)?.charAt(0) || '-'}
                            </div>
                          )}
                          <div className={styles.companyTileInfo}>
                            <h4 className={styles.companyTileName}>{company.entityName || company.name}</h4>
                            <span className={styles.companyTileSector}>{company.sector || '-'}</span>
                          </div>
                        </div>
                        <p className={styles.companyTileOneLiner}>{company.oneLiner || company.detail || '-'}</p>
                        <div className={styles.companyTileMetrics}>
                          <div className={styles.companyTileMetric}>
                            <span className={styles.companyTileMetricLabel}>Invested</span>
                            <span className={styles.companyTileMetricValue}>{(() => {
                              const total = getTotalInvestment(company);
                              return total > 0 ? `₹${total.toFixed(1)} Cr` : '-';
                            })()}</span>
                          </div>
                          <div className={styles.companyTileMetric}>
                            <span className={styles.companyTileMetricLabel}>FMV</span>
                            <span className={styles.companyTileMetricValue}>{company.latestQuarter?.currentFMVConfidential ? '**' : (company.latestQuarter?.currentFMV != null ? `₹${company.latestQuarter.currentFMV.toFixed(1)} Cr` : '-')}</span>
                          </div>
                          <div className={styles.companyTileMetric}>
                            <span className={styles.companyTileMetricLabel}>Multiple</span>
                            <span className={styles.companyTileMetricValue}>{company.latestQuarter?.moicConfidential ? '**' : (company.latestQuarter?.multipleOfInvestment ? `${company.latestQuarter.multipleOfInvestment.toFixed(2)}x` : '-')}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.placeholderContent}>
                  <p>Portfolio company updates will be displayed here once data is added in Sanity CMS.</p>
                </div>
              )}
            </section>
          )}

          {activeSection === 'fund-financials' && (
            <section className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <h1 className={styles.sectionPageTitle}>Fund Financials</h1>
              </div>
              {report?.fundFinancialsPdfUrl || (isGiftCityLP && report?.giftCityFundFinancialsPdfUrl) ? (
                <div className={styles.fundFinancialsDownload}>
                  <p className={styles.fundFinancialsDesc}>
                    Download the fund financials report{isGiftCityLP && report?.giftCityFundFinancialsPdfUrl ? 's' : ''} for {quarter} {fiscalYear}.
                  </p>
                  {report?.fundFinancialsPdfUrl && (
                    <button
                      type="button"
                      onClick={() => handleDownloadClick(
                        report.fundFinancialsPdfUrl,
                        'fund-financials',
                        `${quarter} ${fiscalYear}`,
                        'Fund Financials'
                      )}
                      className={styles.downloadButton}
                    >
                      <svg className={styles.pdfIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="12" y2="18" />
                        <line x1="15" y1="15" x2="12" y2="18" />
                      </svg>
                      Download Fund Financials (PDF)
                    </button>
                  )}
                  {isGiftCityLP && report?.giftCityFundFinancialsPdfUrl && (
                    <button
                      type="button"
                      onClick={() => handleDownloadClick(
                        report.giftCityFundFinancialsPdfUrl,
                        'fund-financials-gift-city',
                        `${quarter} ${fiscalYear}`,
                        'GIFT City Fund Financials'
                      )}
                      className={styles.downloadButton}
                      style={{ marginTop: '1rem' }}
                    >
                      <svg className={styles.pdfIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="12" y2="18" />
                        <line x1="15" y1="15" x2="12" y2="18" />
                      </svg>
                      Download GIFT City Fund Financials (PDF)
                    </button>
                  )}
                </div>
              ) : (
                <div className={styles.placeholderContent}>
                  <p>Fund financials PDF will be available once uploaded for this quarter.</p>
                </div>
              )}
            </section>
          )}

          {activeSection === 'pipeline-summary' && (
            <section className={`${styles.contentSection} ${styles.portfolioHubSection}`}>
              <div className={styles.sectionHeader}>
                <h1 className={styles.sectionPageTitle}>Pipeline Summary</h1>
              </div>
              {report?.pipelineNotes && report.pipelineNotes.length > 0 && (
                <div className={styles.coverNoteContent} style={{ marginBottom: '1.5rem' }}>
                  <PortableText value={report.pipelineNotes} />
                </div>
              )}
              {report?.pipelineDeals && report.pipelineDeals.length > 0 && (
                <div className={styles.portfolioTableWrapper}>
                  <table className={styles.portfolioTable}>
                    <thead>
                      <tr>
                        <th>Sl No.</th>
                        <th>Company</th>
                        <th>Sector</th>
                        <th>Amount in ₹ (Crores)</th>
                        <th>Stage of Evaluation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.pipelineDeals.map((deal, idx) => (
                        <tr key={deal._id || idx}>
                          <td>{idx + 1}</td>
                          <td className={styles.companyNameCell}>{deal.companyName || '-'}</td>
                          <td>{deal.sector || '-'}</td>
                          <td>{deal.proposedAmountINR != null ? deal.proposedAmountINR.toFixed(2) : '-'}</td>
                          <td>{deal.stage ? deal.stage.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Only show placeholder if no deals AND no commentary */}
              {(!report?.pipelineDeals || report.pipelineDeals.length === 0) && (!report?.pipelineNotes || report.pipelineNotes.length === 0) && (
                <div className={styles.placeholderContent}>
                  <p>No pipeline deals for this quarter.</p>
                </div>
              )}
            </section>
          )}

          {activeSection === 'media-coverage' && (
            <section className={`${styles.contentSection} ${styles.portfolioHubSection}`}>
              <div className={styles.sectionHeader}>
                <h1 className={styles.sectionPageTitle}>Media Coverage</h1>
              </div>
              {report?.mediaNotes && report.mediaNotes.length > 0 && (
                <div className={styles.coverNoteContent} style={{ marginBottom: '1.5rem' }}>
                  <PortableText value={report.mediaNotes} />
                </div>
              )}

              {/* News Articles - auto-fetched by quarter date range */}
              {quarterNews && quarterNews.length > 0 && (
                <>
                  <h2 className={styles.mediaSectionTitle}>News Articles</h2>
                  <div className={styles.mediaCoverageGrid}>
                    {quarterNews.map((item) => (
                      <a
                        key={item._id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.mediaCoverageCard}
                      >
                        <div className={styles.mediaCoverageCardContent}>
                          <span className={styles.mediaCoveragePublication}>{item.publicationName || 'News'}</span>
                          <h3 className={styles.mediaCoverageHeadline}>{item.headlineEdited}</h3>
                          {item.date && (
                            <span className={styles.mediaCoverageDate}>
                              {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <span className={styles.mediaCoverageArrow}>→</span>
                      </a>
                    ))}
                  </div>
                </>
              )}

              {/* Social Updates - auto-fetched by quarter date range */}
              {quarterSocialUpdates && quarterSocialUpdates.length > 0 && (
                <>
                  <h2 className={styles.mediaSectionTitle} style={{ marginTop: quarterNews?.length > 0 ? '2rem' : 0 }}>Social Updates</h2>
                  <div className={styles.mediaCoverageGrid}>
                    {quarterSocialUpdates.map((item) => (
                      <a
                        key={item._id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.mediaCoverageCard}
                      >
                        <div className={styles.mediaCoverageCardContent}>
                          <span className={styles.mediaCoveragePublication}>
                            {item.platform === 'linkedin' ? 'LinkedIn' : item.platform === 'twitter' ? 'Twitter/X' : 'Social'}
                          </span>
                          <h3 className={styles.mediaCoverageHeadline}>
                            {item.excerpt?.length > 100 ? item.excerpt.substring(0, 100) + '...' : item.excerpt}
                          </h3>
                          {item.date && (
                            <span className={styles.mediaCoverageDate}>
                              {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <span className={styles.mediaCoverageArrow}>→</span>
                      </a>
                    ))}
                  </div>
                </>
              )}

              {/* Show placeholder if no news or social updates */}
              {(!quarterNews || quarterNews.length === 0) && (!quarterSocialUpdates || quarterSocialUpdates.length === 0) && (
                <div className={styles.placeholderContent}>
                  <p>No media coverage for this quarter.</p>
                </div>
              )}
            </section>
          )}

          {activeSection === 'contact-information' && (
            <section className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <h1 className={styles.sectionPageTitle}>Contact Information</h1>
              </div>
              {(fundSettings?.investorRelationsEmail || fundSettings?.additionalContacts?.length > 0 || fundSettings?.website) ? (
                <div className={styles.contactInfoSection}>
                  {fundSettings.investorRelationsEmail && (
                    <div className={styles.contactInfoBlock}>
                      <span className={styles.contactInfoLabel}>Investor Relations</span>
                      <a href={`mailto:${fundSettings.investorRelationsEmail}`} className={styles.contactInfoValue}>
                        {fundSettings.investorRelationsEmail}
                      </a>
                    </div>
                  )}
                  {fundSettings.website && (
                    <div className={styles.contactInfoBlock}>
                      <span className={styles.contactInfoLabel}>Website</span>
                      <a href={fundSettings.website} target="_blank" rel="noopener noreferrer" className={styles.contactInfoValue}>
                        {fundSettings.website}
                      </a>
                    </div>
                  )}
                  {fundSettings.additionalContacts?.length > 0 && (
                    <>
                      <div className={styles.contactInfoDivider} />
                      {fundSettings.additionalContacts.map((contact, idx) => (
                        <div key={idx} className={styles.contactInfoBlock}>
                          <span className={styles.contactInfoLabel}>{contact.role || 'Contact'}</span>
                          <span className={styles.contactInfoName}>{contact.name}</span>
                          {contact.email && (
                            <a href={`mailto:${contact.email}`} className={styles.contactInfoValue}>
                              {contact.email}
                            </a>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ) : (
                <div className={styles.placeholderContent}>
                  <p>Contact information will be displayed here once data is added in Sanity CMS.</p>
                </div>
              )}
              {/* Take a tour link */}
              <div className={styles.tourReplaySection}>
                <button
                  type="button"
                  className={styles.tourReplayLink}
                  onClick={replayPortalTour}
                >
                  Take a tour of the portal
                </button>
              </div>
            </section>
          )}

          {activeSection === 'download-centre' && (
            <section className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <h1 className={styles.sectionPageTitle}>Download Centre</h1>
              </div>
              {allReports && allReports.filter(r => r.pdfUrl).length > 0 ? (
                <div className={styles.downloadTableWrapper}>
                  <table className={styles.downloadTable}>
                    <thead>
                      <tr>
                        <th>Report</th>
                        <th>Period</th>
                        <th>Download</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allReports.filter(r => r.pdfUrl).map((rpt) => (
                        <tr key={rpt._id}>
                          <td className={styles.downloadReportName}>
                            {rpt.title || `${rpt.quarter} ${rpt.fiscalYear} Report`}
                          </td>
                          <td>{rpt.quarter} {rpt.fiscalYear}</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleDownloadClick(
                                rpt.pdfUrl,
                                'quarterly-report',
                                `${rpt.quarter} ${rpt.fiscalYear}`,
                                rpt.title || `${rpt.quarter} ${rpt.fiscalYear} Report`
                              )}
                              className={styles.downloadButton}
                            >
                              <svg className={styles.pdfIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 18V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M9 15L12 18L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.placeholderContent}>
                  <p>No reports available for download yet. Upload PDFs in Sanity under each quarterly report.</p>
                </div>
              )}

              {/* NPS Feedback Form */}
              <div className={styles.feedbackSection}>
                <h3 className={styles.feedbackTitle}>How was your experience?</h3>
                <p className={styles.feedbackSubtitle}>Rate your experience viewing this report on the portal</p>

                {feedbackSubmitted ? (
                  <div className={styles.feedbackSuccess}>
                    <p>Thank you for your feedback!</p>
                  </div>
                ) : (
                  <>
                    <div className={styles.npsScale}>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setNpsScore(score)}
                          className={`${styles.npsScoreBtn} ${npsScore === score ? styles.npsScoreBtnSelected : ''}`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    <div className={styles.npsLabels}>
                      <span className={styles.npsLabel}>Not satisfied</span>
                      <span className={styles.npsLabel}>Very satisfied</span>
                    </div>

                    {npsScore !== null && npsScore < 8 && (
                      <>
                        <label className={styles.feedbackTextareaLabel}>
                          We&apos;d love to hear more about how we can improve:
                        </label>
                        <textarea
                          className={styles.feedbackTextarea}
                          value={feedbackDetails}
                          onChange={(e) => setFeedbackDetails(e.target.value)}
                          placeholder="Please share your thoughts..."
                        />
                      </>
                    )}

                    {npsScore !== null && (
                      <button
                        type="button"
                        onClick={handleFeedbackSubmit}
                        disabled={isSubmittingFeedback}
                        className={styles.feedbackSubmitBtn}
                      >
                        {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </section>
          )}

          {/* Section Navigation */}
          <div className={styles.sectionNavigation}>
            {prevSection ? (
              <button
                className={styles.sectionNavBtn}
                onClick={() => handleMenuClick(prevSection)}
              >
                <span className={styles.sectionNavArrow}>←</span>
                <span className={styles.sectionNavLabel}>Previous</span>
              </button>
            ) : (
              <div></div>
            )}
            {nextSection ? (
              <button
                className={`${styles.sectionNavBtn} ${styles.sectionNavBtnNext}`}
                onClick={() => handleMenuClick(nextSection)}
              >
                <span className={styles.sectionNavLabel}>Next</span>
                <span className={styles.sectionNavArrow}>→</span>
              </button>
            ) : (
              <div></div>
            )}
          </div>
        </main>
      </div>

      {/* Download Disclaimer Dialog */}
      {disclaimerOpen && (
        <div className={styles.disclaimerOverlay}>
          <div className={styles.disclaimerDialog}>
            <h2 className={styles.disclaimerTitle}>Confidentiality Agreement</h2>
            <div className={styles.disclaimerContent}>
              <p>
                The material you are about to download contains confidential and proprietary
                information belonging to Yali Capital. By proceeding with this download, you
                acknowledge and agree to the following:
              </p>
              <p>
                <strong>1.</strong> You will not copy, reproduce, distribute, publish, display,
                or transmit any part of this material to any third party without prior written
                consent from Yali Capital.
              </p>
              <p>
                <strong>2.</strong> You will use this material solely for your own internal
                review purposes as a Limited Partner and will maintain its confidentiality.
              </p>
              <p>
                <strong>3.</strong> You understand that unauthorised disclosure of this
                information may cause significant harm to Yali Capital and its portfolio
                companies.
              </p>
            </div>
            <div className={styles.disclaimerActions}>
              <button
                type="button"
                onClick={() => {
                  setDisclaimerOpen(false);
                  setPendingDownload(null);
                }}
                className={styles.disclaimerCancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisclaimerAgree}
                disabled={isLoggingConsent}
                className={styles.disclaimerAgreeBtn}
              >
                {isLoggingConsent ? 'Processing...' : 'I Agree & Download'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer - Main website footer (z-index higher than sidebar to cover it) */}
      <div className={styles.footerWrapper}>
        <Footer />
      </div>
    </div>
  );
}

export default function PortalContent(props) {
  return <PortalContentInner {...props} />;
}
