'use client';

import styles from './dataroom.module.css';
import { trackEvent } from '@/lib/analytics';

export default function DocRowLink({ href, label, children }) {
  function handleClick(e) {
    if (!href) return;
    trackEvent('dataroom_document_open', { label: label || 'Document' });
    if (window.innerWidth >= 768) {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('drOpenPdf', {
        detail: { url: href, label: label || 'Document' },
      }));
    }
    // mobile: let the href navigate normally (same tab, no target="_blank")
  }

  return (
    <a
      href={href || undefined}
      className={styles.docRow}
      style={{ textDecoration: 'none', cursor: href ? 'pointer' : 'default' }}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
