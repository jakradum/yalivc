'use client';

import styles from './report.module.css';

export default function ReportCoverNote({ id, quarter, fiscalYear, content, signatory }) {
  const defaultContent = {
    greeting: 'Dear Partners,',
    paragraphs: [
      'We are pleased to present the quarterly report for the Yali Capital Deep Tech Fund for the period ending September 2024.',
      'This quarter marked significant progress across our portfolio companies, with several key milestones achieved in product development, customer acquisition, and funding rounds.',
      'The Indian deep tech ecosystem continues to show remarkable resilience and growth, with increasing enterprise adoption of AI and advanced technologies across sectors.',
    ],
    highlights: [
      'Portfolio NAV increased by 12% quarter-over-quarter',
      'Two portfolio companies completed follow-on funding rounds',
      'One new investment deployed in the semiconductor space',
      'Strong pipeline of 15+ opportunities under active evaluation',
    ],
    closing: 'We remain committed to building a portfolio of category-defining deep tech companies and thank you for your continued partnership and trust.',
  };

  const noteContent = content || defaultContent;

  const defaultSignatory = {
    name: 'Raghunandan G',
    title: 'Managing Partner',
  };

  const sign = signatory || defaultSignatory;

  return (
    <section id={id} className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.h2}>Cover Note</h2>
      </div>

      <p className={styles.greeting}>{noteContent.greeting}</p>

      {noteContent.paragraphs.map((para, index) => (
        <p key={index} className={styles.body}>
          {para}
        </p>
      ))}

      {noteContent.highlights && noteContent.highlights.length > 0 && (
        <>
          <h3 className={styles.h3}>Quarter Highlights</h3>
          <ul className={styles.bulletList}>
            {noteContent.highlights.map((highlight, index) => (
              <li key={index}>{highlight}</li>
            ))}
          </ul>
        </>
      )}

      <p className={styles.body}>{noteContent.closing}</p>

      <div className={styles.signature}>
        <p className={styles.signatureName}>{sign.name}</p>
        <p className={styles.signatureTitle}>{sign.title}</p>
      </div>
    </section>
  );
}
