'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './dataroom.module.css';
import { Lightlogo } from '../../components/icons/lightlogo';

const CATEGORY_LABELS = {
  'pipeline':       'Pipeline',
  'ppm-agreements': 'PPM & Agreements',
  'presentations':  'Presentations',
  'recommendation': 'Recommendation',
  'sebi':           'Regulatory Documents',
  'team':           'Team',
  'track-record':   'Track Record',
};

export default function DataroomClient({ documents }) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [signingOut, setSigningOut] = useState(false);

  // Derive the categories that actually have documents
  const categories = [...new Set(documents.map(d => d.category))].sort();

  const filtered = activeCategory === 'all'
    ? documents
    : documents.filter(d => d.category === activeCategory);

  // Group by category for the "all" view
  const grouped = categories.reduce((acc, cat) => {
    const docs = documents.filter(d => d.category === cat);
    if (docs.length > 0) acc[cat] = docs;
    return acc;
  }, {});

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch('/api/dataroom-auth/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sign-out' }),
      });
    } finally {
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      router.push(isLocalDev ? '/dataroom/sign-in' : '/sign-in');
    }
  };

  return (
    <div className={styles.layout}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <Lightlogo />
        </div>
        <p className={styles.sidebarLabel}>DATA ROOM</p>

        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${activeCategory === 'all' ? styles.navItemActive : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All Documents
          </button>

          <div className={styles.navDivider} />

          {categories.map(cat => (
            <button
              key={cat}
              className={`${styles.navItem} ${activeCategory === cat ? styles.navItemActive : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </nav>

        <button className={styles.signOut} onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Sign Out'}
        </button>
      </aside>

      {/* ── Main ── */}
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.headerTitle}>
            {activeCategory === 'all'
              ? 'All Documents'
              : CATEGORY_LABELS[activeCategory] || activeCategory}
          </h1>
          <p className={styles.headerCount}>
            {filtered.length} {filtered.length === 1 ? 'document' : 'documents'}
          </p>
        </header>

        <div className={styles.content}>
          {documents.length === 0 ? (
            <p className={styles.empty}>No documents available.</p>
          ) : activeCategory === 'all' ? (
            Object.entries(grouped).map(([cat, docs]) => (
              <section key={cat} className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  {CATEGORY_LABELS[cat] || cat}
                </h2>
                <div className={styles.docList}>
                  {docs.map(doc => <DocCard key={doc._id} doc={doc} />)}
                </div>
              </section>
            ))
          ) : (
            <div className={styles.docList}>
              {filtered.map(doc => <DocCard key={doc._id} doc={doc} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function DocCard({ doc }) {
  const date = doc.publishedAt
    ? new Date(doc.publishedAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : '';

  return (
    <a
      href={doc.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.docCard}
    >
      <div className={styles.docIcon}>
        <PdfIcon />
      </div>
      <div className={styles.docMeta}>
        <p className={styles.docTitle}>{doc.title}</p>
        {doc.description && (
          <p className={styles.docDescription}>{doc.description}</p>
        )}
        <p className={styles.docDate}>{date}</p>
      </div>
      <div className={styles.docDownload}>
        <DownloadIcon />
      </div>
    </a>
  );
}

function PdfIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.5 3C3.5 2.17 4.17 1.5 5 1.5H10L14.5 6V15C14.5 15.83 13.83 16.5 13 16.5H5C4.17 16.5 3.5 15.83 3.5 15V3Z"
        stroke="#830D35" strokeWidth="1.25" fill="none" strokeLinejoin="round"/>
      <path d="M10 1.5V6H14.5" stroke="#830D35" strokeWidth="1.25" fill="none" strokeLinejoin="round"/>
      <text x="9" y="12.5" textAnchor="middle" fontSize="4" fill="#830D35"
        fontFamily="var(--font-jetbrains-mono, monospace)" fontWeight="700" letterSpacing="0.02em">PDF</text>
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.5 1.5V10.5M7.5 10.5L4.5 7.5M7.5 10.5L10.5 7.5"
        stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1.5 13H13.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
    </svg>
  );
}
