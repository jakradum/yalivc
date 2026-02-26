import Link from 'next/link';
import styles from './newscomponent.module.css';
import pressStyles from './PressReleasesSection.module.css';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export default function PressReleasesSection({ releases = [] }) {
  if (!releases.length) {
    return (
      <div className={pressStyles.emptyState}>
        <p>No press releases yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.newsArticles}>
      {releases.map((release) => (
        <article key={release._id} className={styles.article}>
          <p className={styles.articleDate}>{formatDate(release.publishedAt)}</p>
          <Link href={`/blog/${release.slug}/`}>
            <p className={styles.articleTitle}>{release.title}</p>
          </Link>
          {release.blurb && (
            <p className={pressStyles.releaseDescription}>{release.blurb}</p>
          )}
        </article>
      ))}
    </div>
  );
}
