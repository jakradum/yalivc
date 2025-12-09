'use client';

import styles from './report.module.css';

// Yali Logo SVG Component
const YaliLogo = () => (
  <svg
    className={styles.contactLogoSvg}
    viewBox="0 0 300 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <text
      x="50%"
      y="60%"
      dominantBaseline="middle"
      textAnchor="middle"
      fill="white"
      fontFamily="var(--font-jetbrains-mono), monospace"
      fontSize="72"
      fontWeight="700"
      letterSpacing="0.15em"
    >
      YALI
    </text>
  </svg>
);

export default function ReportContact({ id, contact }) {
  const defaultContact = {
    fundName: 'Yali Capital Deep Tech Fund',
    email: 'investor.relations@yali.vc',
    newsroom: 'yali.vc/newsroom',
    website: 'www.yali.vc',
  };

  const data = contact || defaultContact;

  return (
    <section id={id} className={`${styles.section} ${styles.contactSection}`}>
      <h1 className={styles.contactLogo}>YALI</h1>

      <div className={styles.contactInfo}>
        <p className={styles.contactItem}>{data.fundName}</p>
      </div>

      <div className={styles.contactInfo}>
        <p className={styles.contactItem}>
          For more information, visit our newsroom at{' '}
          <a
            href={data.newsroomUrl || `https://${data.newsroom}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.contactLink}
          >
            {data.newsroomUrl?.replace('https://', '') || data.newsroom}
          </a>
        </p>
        <p className={styles.contactItem}>
          For investor relations, contact{' '}
          <a
            href={`mailto:${data.irEmail || data.email}`}
            className={styles.contactLink}
          >
            {data.irEmail || data.email}
          </a>
        </p>
      </div>

      <p className={styles.disclaimer}>
        This document is confidential and intended solely for the authorized Limited Partners
        of Yali Capital Deep Tech Fund. Any reproduction, distribution, or disclosure of this
        document or its contents without prior written consent is strictly prohibited.
        The information contained herein is for informational purposes only and does not
        constitute an offer to sell or a solicitation of an offer to buy any securities.
        Past performance is not indicative of future results.
      </p>
    </section>
  );
}
