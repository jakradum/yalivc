'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './partners.module.css';
import ExitedTag from '../../components/exited-tag';

// Report sections in reading order (also drives prev/next in PortalContent).
// `group: 'resources'` items sit under their own label below the contents.
export const MENU_ITEMS = [
  { id: 'cover-note', label: 'Cover note' },
  { id: 'fund-summary', label: 'Fund summary' },
  { id: 'portfolio-investment-summary', label: 'Portfolio investment summary' },
  { id: 'portfolio-company-updates', label: 'Portfolio company updates' },
  { id: 'fund-financials', label: 'Fund financials' },
  { id: 'pipeline-summary', label: 'Pipeline summary' },
  { id: 'media-coverage', label: 'Media coverage' },
  { id: 'contact-information', label: 'Contact information', group: 'resources' },
  { id: 'download-centre', label: 'Downloads', group: 'resources' },
];

const CONTENTS = MENU_ITEMS.filter((item) => item.group !== 'resources');
const RESOURCES = MENU_ITEMS.filter((item) => item.group === 'resources');

const QUARTER_MONTHS = { Q1: 'Apr to Jun', Q2: 'Jul to Sep', Q3: 'Oct to Dec', Q4: 'Jan to Mar' };

// "Jul to Sep 2026" for Q2 FY27 (Indian fiscal year: Q4 falls in the FY's own year)
function quarterMonths(quarter, fiscalYear) {
  const fy = parseInt(String(fiscalYear || '').replace('FY', ''), 10);
  if (!QUARTER_MONTHS[quarter] || Number.isNaN(fy)) return '';
  const endYear = 2000 + fy;
  return `${QUARTER_MONTHS[quarter]} ${quarter === 'Q4' ? endYear : endYear - 1}`;
}

// Small square-ish rendition of a Sanity logo URL; other URLs pass through.
function sidebarLogo(url) {
  if (!url) return null;
  return url.startsWith('https://cdn.sanity.io/') && !url.includes('?') ? `${url}?w=64&fm=png` : url;
}

function QuarterSwitcher({ report, allReports, quarterHref }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const latestSlug = allReports?.[0]?.slug;
  const isLatest = !report?.slug || report.slug === latestSlug;
  const canSwitch = allReports?.length > 1;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className={styles.sbHead} ref={ref}>
      <span className={styles.sbEyebrow}>Limited Partners&rsquo; Report</span>
      <button
        type="button"
        className={styles.sbQuarterBtn}
        onClick={() => canSwitch && setOpen((o) => !o)}
        aria-expanded={open}
        disabled={!canSwitch}
      >
        <span className={`${styles.sbQuarter} ${isLatest ? styles.sbQuarterLatest : styles.sbQuarterPast}`}>
          {report?.quarter} {report?.fiscalYear}
        </span>
        {isLatest && <span className={styles.sbLatestTag}>Latest</span>}
        {canSwitch && <span className={styles.sbChange}>{open ? 'Close' : 'Change'}</span>}
      </button>
      <span className={styles.sbMonths}>{quarterMonths(report?.quarter, report?.fiscalYear)}</span>

      {open && (
        <ul className={styles.sbQuarterMenu}>
          {allReports.map((r) => (
            <li key={r.slug}>
              <a
                href={quarterHref(r)}
                className={`${styles.sbQuarterOption} ${r.slug === report?.slug ? styles.sbQuarterOptionActive : ''}`}
                onClick={() => setOpen(false)}
              >
                <span className={styles.sbLabel}>{r.quarter} {r.fiscalYear}</span>
                {r.slug === latestSlug && <span className={styles.sbLatestTagSmall}>Latest</span>}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PortalSidebar({
  activeSection,
  onMenuClick,
  reportSlug,
  report,               // { slug, quarter, fiscalYear } of the report being viewed
  allReports = [],      // reports this user can open, newest first
  quarterHref,          // (report) => href that opens that report on the current page
  companies = [],       // [{ slug, name, isExited, logo }]
  currentCompanySlug,   // set when on a company detail page
  sidebarOpen,
}) {
  const [companyNavExpanded, setCompanyNavExpanded] = useState(!!currentCompanySlug);
  const reportParam = reportSlug ? `?report=${reportSlug}` : '';

  const renderItem = (item, number) => {
    const isCompanies = item.id === 'portfolio-company-updates';
    // On a company page the company row carries the highlight, not its section
    const isActive = activeSection === item.id && !(isCompanies && currentCompanySlug);
    return (
      <li key={item.id}>
        <button
          type="button"
          onClick={() => {
            onMenuClick(item.id);
            if (isCompanies) setCompanyNavExpanded((e) => !e);
          }}
          className={`${styles.sbItem} ${isActive ? styles.sbItemActive : ''}`}
        >
          <span className={styles.sbLabel}>{item.label}</span>
          {number != null && (
            <>
              <span className={styles.sbLeader} aria-hidden="true" />
              <span className={styles.sbNum}>{number}</span>
            </>
          )}
        </button>
        {isCompanies && companies.length > 0 && companyNavExpanded && (
          <ul className={styles.sbSubList}>
            {companies.map((company) => (
              <li key={company.slug}>
                <a
                  href={`/partners/company/${company.slug}${reportParam}`}
                  className={`${styles.sbCompany} ${currentCompanySlug === company.slug ? styles.sbCompanyActive : ''}`}
                >
                  {company.logo ? (
                    <img className={styles.sbLogo} src={sidebarLogo(company.logo)} alt="" aria-hidden="true" />
                  ) : (
                    <span className={styles.sbLogo} aria-hidden="true" />
                  )}
                  <span className={styles.sbLabel}>{company.name}</span>
                  <ExitedTag exited={company.isExited === true} size="sm" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarHidden : ''}`}>
      <QuarterSwitcher report={report} allReports={allReports} quarterHref={quarterHref || ((r) => `/partners?report=${r.slug}`)} />
      <nav className={styles.sbNav}>
        <div className={styles.sbGroup}>Contents</div>
        <ul className={styles.sbList}>
          {CONTENTS.map((item, i) => renderItem(item, i + 1))}
        </ul>
        <div className={styles.sbGroup}>Resources</div>
        <ul className={styles.sbList}>
          {RESOURCES.map((item) => renderItem(item, null))}
        </ul>
        <a href="/api/portal-logout" className={styles.sbSignOut}>
          Sign out
        </a>
      </nav>
    </aside>
  );
}
