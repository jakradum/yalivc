'use client';

import { useState, useEffect } from 'react';
import styles from './dataroom.module.css';
import SignOutButton from './SignOutButton';

function openPdf(e, url, label) {
  e.preventDefault();
  if (window.innerWidth >= 768) {
    document.dispatchEvent(new CustomEvent('drOpenPdf', { detail: { url, label } }));
  } else {
    window.location.href = url;
  }
}

export default function DrSidebar({ activeCategory, fundContent, latestLPReport, recDocs = [], email }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    function onToggle() { setMobileOpen(prev => !prev); }
    document.addEventListener('drToggleSidebar', onToggle);
    return () => document.removeEventListener('drToggleSidebar', onToggle);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dr-sidebar-open', mobileOpen);
    return () => document.body.classList.remove('dr-sidebar-open');
  }, [mobileOpen]);

  useEffect(() => {
    const scrollRoot = document.getElementById('dr-main-scroll');
    if (!scrollRoot) return;
    const ids = ['fund-i', 'fund-ii', 'others', 'team', 'recommendations'];
    const elements = ids.map(id => document.getElementById(id)).filter(Boolean);
    if (!elements.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActiveSection(visible[0].target.id);
      },
      { root: scrollRoot, threshold: 0, rootMargin: '0px 0px -60% 0px' }
    );
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const isActive = (id) => activeSection === id;
  const close = () => setMobileOpen(false);

  return (
    <>
      {mobileOpen && (
        <div className={styles.drSidebarOverlay} onClick={close} />
      )}
      <nav
        className={`${styles.drSidebar}${mobileOpen ? ` ${styles.drSidebarMobileOpen}` : ''}`}
        data-dr-sidebar
      >
        <div className={styles.drSidebarNav}>

          <div className={styles.drSidebarNavItems}>

            <div className={styles.drSidebarItem}>
              <a
                href="/dataroom#fund-i"
                className={`${styles.drSidebarLink}${isActive('fund-i') ? ` ${styles.drSidebarLinkActive}` : ''}`}
                onClick={close}
              >
                Fund I
              </a>
              <div className={styles.drSidebarSubmenu}>
                {fundContent?.fundISlideDeckUrl && (
                  <a
                    href={fundContent.fundISlideDeckUrl}
                    className={styles.drSidebarSubItem}
                    onClick={(e) => { openPdf(e, fundContent.fundISlideDeckUrl, 'Fund I presentation'); close(); }}
                  >
                    Fund I presentation
                  </a>
                )}
                {latestLPReport?.pdfUrl && (
                  <a
                    href={latestLPReport.pdfUrl}
                    className={styles.drSidebarSubItem}
                    onClick={(e) => {
                      const label = latestLPReport.quarter && latestLPReport.fiscalYear
                        ? `Latest quarterly report — ${latestLPReport.quarter} ${latestLPReport.fiscalYear}`
                        : 'Latest quarterly report';
                      openPdf(e, latestLPReport.pdfUrl, label);
                      close();
                    }}
                  >
                    Latest quarterly report
                  </a>
                )}
              </div>
            </div>

            {fundContent?.fundIIThesisPresentationUrl && (
              <div className={styles.drSidebarItem}>
                <a
                  href="/dataroom#fund-ii"
                  className={`${styles.drSidebarLink}${isActive('fund-ii') ? ` ${styles.drSidebarLinkActive}` : ''}`}
                  onClick={close}
                >
                  Fund II
                </a>
                <div className={styles.drSidebarSubmenu}>
                  <a
                    href={fundContent.fundIIThesisPresentationUrl}
                    className={styles.drSidebarSubItem}
                    onClick={(e) => { openPdf(e, fundContent.fundIIThesisPresentationUrl, 'Thesis presentation'); close(); }}
                  >
                    Thesis presentation
                  </a>
                </div>
              </div>
            )}

            <div className={styles.drSidebarItem}>
              <a
                href="/dataroom/team"
                className={`${styles.drSidebarLink}${activeCategory === 'team' || isActive('team') ? ` ${styles.drSidebarLinkActive}` : ''}`}
                onClick={close}
              >
                Team
              </a>
              <div className={styles.drSidebarSubmenu}>
                <a href="/dataroom/team" className={styles.drSidebarSubItem} onClick={close}>
                  Investment team
                </a>
              </div>
            </div>

            <div className={styles.drSidebarItem}>
              <a
                href="/dataroom/track-record"
                className={`${styles.drSidebarLink}${activeCategory === 'others' || isActive('others') ? ` ${styles.drSidebarLinkActive}` : ''}`}
                onClick={close}
              >
                Others
              </a>
              <div className={styles.drSidebarSubmenu}>
                <a href="/dataroom/track-record" className={styles.drSidebarSubItem} onClick={close}>
                  Track record (prior to Yali)
                </a>
              </div>
            </div>

            {recDocs.filter((d) => d.fileUrl).length > 0 && (
              <div className={styles.drSidebarItem}>
                <a
                  href="/dataroom#recommendations"
                  className={`${styles.drSidebarLink}${isActive('recommendations') ? ` ${styles.drSidebarLinkActive}` : ''}`}
                  onClick={close}
                >
                  Recommendations
                </a>
                <div className={styles.drSidebarSubmenu}>
                  {recDocs.filter((d) => d.fileUrl).map((doc, i) => (
                    <a
                      key={i}
                      href={doc.fileUrl}
                      className={styles.drSidebarSubItem}
                      onClick={(e) => { openPdf(e, doc.fileUrl, doc.title); close(); }}
                    >
                      {doc.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>

          <div className={styles.drSidebarFooter}>
            {email && <span className={styles.drSidebarEmail}>{email}</span>}
            <SignOutButton />
          </div>

        </div>
      </nav>
    </>
  );
}
