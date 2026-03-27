'use client';

import styles from './print.module.css';

export default function PrintButton({ title }) {
  return (
    <div className={styles.printBar}>
      <span className={styles.printBarTitle}>{title}</span>
      <div className={styles.printBarActions}>
        <a href="/console" className={styles.printBarBack}>← Back to console</a>
        <button className={styles.printBarBtn} onClick={() => window.print()}>
          Download PDF
        </button>
      </div>
    </div>
  );
}
