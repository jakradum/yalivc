import Link from 'next/link';
import { getAllNewsletters } from '@/lib/sanity-queries';
import SubscribeBar from './SubscribeBar';
import styles from './page.module.css';

export const revalidate = 60;

export const metadata = {
  title: 'Newsletter — Yali Capital',
  description:
    'Notes from the Yali Capital podcast. Deep tech, genomics, semiconductors, and the founders building India\'s next wave.',
  alternates: {
    canonical: 'https://yali.vc/newsletter/',
  },
};

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default async function NewsletterArchive() {
  const newsletters = await getAllNewsletters();

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* Masthead */}
        <div className={styles.masthead}>
          <p className={styles.mastheadLabel}>NEWSLETTER</p>
          <h1 className={styles.mastheadHeading}>From the Yali podcast</h1>
          <p className={styles.mastheadSubtext}>
            Occasional notes from conversations with deep tech founders. Written by the Yali team.
          </p>
        </div>

        {/* Subscribe bar */}
        <SubscribeBar />

        {/* Edition list */}
        <div className={styles.editionList}>
          {!newsletters || newsletters.length === 0 ? (
            <div className={styles.emptyRow}>
              <span className={styles.emptyText}>First edition coming soon</span>
            </div>
          ) : (
            newsletters.map((nl) => (
              <Link
                key={nl._id}
                href={`/newsletter/${nl.slug.current}`}
                className={styles.editionRow}
              >
                <span className={styles.editionDate}>{formatDate(nl.publishedDate)}</span>
                <span className={styles.editionMeta}>
                  <span className={styles.editionTitle}>{nl.title}</span>
                  {nl.shortDescription && (
                    <span className={styles.editionDesc}>{nl.shortDescription}</span>
                  )}
                </span>
                <span className={styles.editionRead}>Read ↗</span>
              </Link>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
