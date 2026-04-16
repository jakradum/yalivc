'use client';

import styles from './dataroom.module.css';

export default function DrTableRow({ href, label, children }) {
  const isInternalPage = href?.startsWith('/');

  function handleClick(e) {
    if (e.target.closest('a')) return;
    if (!href) return;

    if (!isInternalPage && window.innerWidth >= 768) {
      document.dispatchEvent(new CustomEvent('drOpenPdf', {
        detail: { url: href, label: label || 'Document' },
      }));
      return;
    }

    window.location.href = href;
  }

  return (
    <tr
      className={styles.drTr}
      onClick={href ? handleClick : undefined}
      style={href ? { cursor: 'pointer' } : undefined}
    >
      {children}
    </tr>
  );
}
