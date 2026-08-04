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
          <p className={styles.mastheadLabel}>Newsletter</p>
          <h1 className={styles.mastheadHeading}>Tattva | The Yali Newsletter</h1>
          <p className={styles.mastheadSubtext}>
            Insights, ideas, and updates from deep within the world of deep tech.
          </p>
        </div>

        {/* Subscribe bar */}
        <SubscribeBar />

        {/* Edition grid */}
        <div className={styles.editionGrid}>
          {!newsletters || newsletters.length === 0 ? (
            <div className={styles.emptyRow}>
              <span className={styles.emptyText}>First edition coming soon</span>
            </div>
          ) : (
            newsletters.map((nl) => (
              <Link
                key={nl._id}
                href={`/newsletter/${nl.slug.current}`}
                className={styles.editionCard}
                aria-label={nl.title}
              >
                {/* Text half */}
                <div className={styles.cardText}>
                  <div className={styles.cardMeta}>
                    Edition {String(nl.edition).padStart(2, '0')} · {formatDate(nl.publishedDate)}
                  </div>
                  <h3 className={styles.cardTitle}>{nl.title}</h3>
                  {nl.tileBlurb && (
                    <p className={styles.cardBlurb}>{nl.tileBlurb}</p>
                  )}
                  <span className={styles.cardRead}>Read ↗</span>
                </div>

                {/* Image half */}
                <div className={styles.cardImage}>
                  {nl.coverImage?.asset?.url ? (
                    <img
                      src={nl.coverImage.asset.url}
                      alt={nl.coverImage.alt || nl.title}
                      className={styles.cardImg}
                    />
                  ) : (
                    <div className={styles.cardImgPlaceholder} />
                  )}
                  <div className={styles.cardEditionGhost}>
                    {String(nl.edition).padStart(2, '0')}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
