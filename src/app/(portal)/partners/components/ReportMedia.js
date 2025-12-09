'use client';

import styles from './report.module.css';

export default function ReportMedia({ id, mediaItems }) {
  const defaultMedia = [
    {
      date: 'Sep 2024',
      title: 'Yali Capital leads $10M round in QuantumSafe',
      source: 'TechCrunch',
    },
    {
      date: 'Sep 2024',
      title: 'Deep Tech funding in India reaches record high in Q2',
      source: 'Economic Times',
    },
    {
      date: 'Aug 2024',
      title: 'MedDevice Pro receives FDA clearance for AI diagnostic tool',
      source: 'MedTech News',
    },
    {
      date: 'Aug 2024',
      title: 'Indian semiconductor startups attract global investor interest',
      source: 'LiveMint',
    },
    {
      date: 'Jul 2024',
      title: 'TechCo AI signs enterprise deal with Tata Group',
      source: 'Business Standard',
    },
    {
      date: 'Jul 2024',
      title: 'Yali Capital Managing Partner on deep tech investing outlook',
      source: 'YourStory',
    },
  ];

  const data = mediaItems || defaultMedia;

  return (
    <section id={id} className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.h2}>Media Coverage</h2>
      </div>

      <p className={styles.body}>
        Select media mentions and coverage of the fund and portfolio companies during the quarter.
      </p>

      <div>
        {data.map((item, index) => (
          <div key={index} className={styles.mediaItem}>
            <span className={styles.mediaDate}>{item.date}</span>
            <div className={styles.mediaContent}>
              <p className={styles.mediaTitle}>{item.title}</p>
              <p className={styles.mediaSource}>{item.source}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
