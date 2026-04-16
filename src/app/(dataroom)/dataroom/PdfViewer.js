'use client';

import { useState, useEffect } from 'react';
import styles from './dataroom.module.css';

export default function PdfViewer() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(null);
  const [label, setLabel] = useState('');

  useEffect(() => {
    function handleOpen(e) {
      setUrl(e.detail.url);
      setLabel(e.detail.label || 'Document');
      setOpen(true);
    }
    document.addEventListener('drOpenPdf', handleOpen);
    return () => document.removeEventListener('drOpenPdf', handleOpen);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {/* Backdrop — clicking anywhere here closes the drawer */}
      <div
        className={`${styles.pdfBackdrop}${open ? ` ${styles.pdfBackdropOpen}` : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Dismiss hint — floats in the backdrop area, left of the drawer */}
      <div className={`${styles.pdfDismissHint}${open ? ` ${styles.pdfDismissHintOpen}` : ''}`}>
        click anywhere to close
      </div>

      {/* Drawer */}
      <div
        className={`${styles.pdfDrawer}${open ? ` ${styles.pdfDrawerOpen}` : ''}`}
        role="dialog"
        aria-label="PDF viewer"
      >
        <div className={styles.pdfDrawerHeader}>
          <span className={styles.pdfDrawerTitle}>{label}</span>
          <button
            className={styles.pdfDrawerClose}
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            ✕ Close
          </button>
        </div>
        <iframe
          key={url}
          src={url || 'about:blank'}
          className={styles.pdfDrawerFrame}
          title={label || 'Document'}
        />
      </div>
    </>
  );
}
