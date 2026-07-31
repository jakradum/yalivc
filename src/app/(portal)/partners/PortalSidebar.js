'use client';

import { useState } from 'react';
import styles from './partners.module.css';

export const MENU_ITEMS = [
  { id: 'cover-note', label: 'Cover note' },
  { id: 'fund-summary', label: 'Fund summary' },
  { id: 'portfolio-investment-summary', label: 'Portfolio investment summary' },
  { id: 'portfolio-company-updates', label: 'Portfolio company updates' },
  { id: 'fund-financials', label: 'Fund financials' },
  { id: 'pipeline-summary', label: 'Pipeline summary' },
  { id: 'media-coverage', label: 'Media coverage' },
  { id: 'contact-information', label: 'Contact Information' },
  { id: 'download-centre', label: 'Download Center' },
];

export default function PortalSidebar({
  activeSection,
  onMenuClick,
  reportSlug,
  companies = [],       // [{ slug, name }]
  currentCompanySlug,   // set when on a company detail page
  sidebarOpen,
}) {
  const [companyNavExpanded, setCompanyNavExpanded] = useState(!!currentCompanySlug);
  const reportParam = reportSlug ? `?report=${reportSlug}` : '';

  return (
    <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarHidden : ''}`}>
      <nav className={styles.sidebarNav}>
        <ul className={styles.menuList}>
          {MENU_ITEMS.map((item) => (
            <li key={item.id} className={styles.menuListItem}>
              {item.id === 'portfolio-company-updates' ? (
                <>
                  <button
                    onClick={() => {
                      onMenuClick(item.id);
                      setCompanyNavExpanded(e => !e);
                    }}
                    className={`${styles.menuItem} ${styles.menuItemExpandable} ${activeSection === item.id ? styles.menuItemActive : ''}`}
                  >
                    <span>{item.label}</span>
                    <span className={`${styles.menuChevron} ${companyNavExpanded ? styles.menuChevronOpen : ''}`}>›</span>
                  </button>
                  {companies.length > 0 && (
                    <ul className={`${styles.menuSubList} ${styles.companySubList} ${companyNavExpanded ? styles.companySubListOpen : ''}`}>
                      {companies.map((company) => (
                        <li key={company.slug}>
                          <a
                            href={`/partners/company/${company.slug}${reportParam}`}
                            className={`${styles.menuCompanyLink} ${currentCompanySlug === company.slug ? styles.menuCompanyLinkActive : ''}`}
                          >
                            {company.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <button
                  onClick={() => onMenuClick(item.id)}
                  className={`${styles.menuItem} ${activeSection === item.id ? styles.menuItemActive : ''}`}
                >
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>
        <a href="/api/portal-logout" className={styles.sidebarLogout}>
          Sign out
        </a>
      </nav>
    </aside>
  );
}
