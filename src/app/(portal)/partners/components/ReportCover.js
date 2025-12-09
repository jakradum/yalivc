'use client';

import styles from './report.module.css';

export default function ReportCover({ quarter, fiscalYear, fundName, reportDate }) {
  // Generate decorative dot pattern
  const generateDots = () => {
    const rows = [];
    const pattern = [
      [0, 0, 0, 1, 0],
      [0, 0, 1, 0, 0],
      [0, 1, 1, 0, 0],
      [1, 0, 0, 1, 0],
      [0, 1, 0, 0, 1],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 1, 0],
    ];

    pattern.forEach((row, rowIndex) => {
      rows.push(
        <div key={rowIndex} className={styles.dotRow}>
          {row.map((isHighlight, dotIndex) => (
            <span
              key={dotIndex}
              className={`${styles.dot} ${isHighlight ? styles.dotHighlight : ''}`}
            />
          ))}
        </div>
      );
    });

    return rows;
  };

  return (
    <div className={styles.coverPage}>
      <div className={styles.coverHeader}>
        <h1 className={styles.coverLogo}>YALI</h1>
        <h2 className={styles.coverTitle}>
          Quarterly Report
          <br />
          {quarter} {fiscalYear}
        </h2>
      </div>

      <div className={styles.decorativeGraphic}>
        {generateDots()}
      </div>

      <div className={styles.coverFooter}>
        <p className={styles.coverFundName}>{fundName}</p>
        <p className={styles.coverDate}>{reportDate}</p>
      </div>
    </div>
  );
}
