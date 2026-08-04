import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllNewsletters } from '@/lib/sanity-queries';
import SubscribeBar from './SubscribeBar';
import styles from './page.module.css';

export const revalidate = 60;

export const metadata = {
  title: 'Tattva | The Yali Newsletter',
  description:
    'Insights, ideas, and updates from deep within the world of deep tech. Published by Yali Capital.',
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
  if (process.env.NODE_ENV === 'production') notFound();

  const newsletters = await getAllNewsletters();

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* Masthead */}
        <div className={styles.masthead}>
          <p className={styles.mastheadLabel}>NEWSLETTER</p>
          <h1 className={styles.mastheadHeading}>Tattva | The Yali Newsletter</h1>
          <p className={styles.mastheadSubtext}>
            Insights, ideas, and updates from deep within the world of deep tech.
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
                aria-label={nl.title}
              >
                <span className={styles.editionDate}>{formatDate(nl.publishedDate)}</span>
                <div className={styles.editionMeta}>
                  <h3 className={styles.editionTitle}>{nl.title}</h3>
                  {nl.shortDescription && (
                    <p className={styles.editionDesc}>{nl.shortDescription}</p>
                  )}
                </div>
                <span className={styles.editionRead}>Read ↗</span>
              </Link>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
