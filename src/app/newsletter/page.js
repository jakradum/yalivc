import Link from 'next/link';
import Image from 'next/image';
import { getAllNewsletters } from '@/lib/sanity-queries';
import styles from './newsletter.module.css';
import patternStyles from '../components/patterns/patterns.module.css';
import FooterSubscribe from '../components/FooterSubscribe';

export const revalidate = 60;

export const metadata = {
  title: 'Tattva | Deep Tech in Essence | Yali Capital',
  description: 'Tattva is Yali Capital\'s newsletter offering insights, analysis, and perspectives on deep tech investing in India.',
  openGraph: {
    title: 'Tattva | Deep Tech in Essence',
    description: 'Yali Capital\'s newsletter on deep tech investing',
  },
};

export default async function NewsletterPage() {
  const newsletters = await getAllNewsletters();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.title}>Tattva</h1>
          <p className={styles.tagline}>Deep tech in essence</p>
          <p className={styles.description}>
            Our monthly newsletter exploring the frontiers of deep technology,
            featuring insights from the Yali team, portfolio spotlights,
            and perspectives from industry leaders.
          </p>
        </header>

        {/* Newsletter Grid */}
        {newsletters && newsletters.length > 0 ? (
          <div className={styles.grid}>
            {newsletters.map((newsletter, index) => {
              // Cycle through patterns 1-7 for each card
              const patternIndex = (index % 7) + 1;
              return (
              <Link
                key={newsletter._id}
                href={`/newsletter/${newsletter.slug.current}`}
                className={styles.card}
              >
                {newsletter.coverImage?.asset?.url ? (
                  <div className={styles.cardImage}>
                    <Image
                      src={newsletter.coverImage.asset.url}
                      alt={newsletter.coverImage.alt || newsletter.title}
                      fill
                      className={styles.cardImg}
                    />
                  </div>
                ) : (
                  <div className={`${styles.cardImagePlaceholder} ${patternStyles[`pattern${patternIndex}Light`]}`}>
                    <span className={styles.editionBadge}>#{newsletter.edition}</span>
                  </div>
                )}
                <div className={styles.cardContent}>
                  <div className={styles.cardMeta}>
                    <span className={styles.editionNumber}>Edition {newsletter.edition}</span>
                    <span className={styles.separator}>&bull;</span>
                    <span className={styles.date}>{formatDate(newsletter.publishedDate)}</span>
                  </div>
                  <h2 className={styles.cardTitle}>{newsletter.title}</h2>
                  {newsletter.shortDescription && (
                    <p className={styles.cardDescription}>{newsletter.shortDescription}</p>
                  )}
                  <span className={styles.readMore}>Read edition &rarr;</span>
                </div>
              </Link>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No newsletters published yet. Check back soon!</p>
          </div>
        )}

        {/* Subscribe CTA */}
        <section className={styles.subscribeCta}>
          <h2>Stay in the loop</h2>
          <p>Get Tattva delivered to your inbox every month.</p>
          <FooterSubscribe variant="light" showLabel={false} />
        </section>
      </div>
    </main>
  );
}
