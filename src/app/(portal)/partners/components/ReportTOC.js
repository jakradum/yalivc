'use client';

import styles from './report.module.css';

export default function ReportTOC({ items }) {
  const defaultItems = [
    { title: 'Cover Note', page: 3 },
    { title: 'Fund Summary', page: 4 },
    { title: 'Portfolio Investments', page: 5 },
    { title: 'Company Updates', page: 6 },
    { title: 'Fund Financials', page: 10 },
    { title: 'Pipeline Summary', page: 11 },
    { title: 'Media Coverage', page: 12 },
    { title: 'Contact', page: 13 },
  ];

  const tocItems = items || defaultItems;

  return (
    <div className={styles.page}>
      <span className={styles.confidentialBadge}>Confidential</span>

      <h1 className={styles.tocTitle}>Table of Contents</h1>

      <ul className={styles.tocList}>
        {tocItems.map((item, index) => (
          <li key={index} className={styles.tocItem}>
            <span className={styles.tocItemTitle}>{item.title}</span>
            <span className={styles.tocItemPage}>{item.page}</span>
          </li>
        ))}
      </ul>

      <span className={styles.pageNumber}>2</span>
    </div>
  );
}
