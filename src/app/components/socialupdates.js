'use client';
import React from 'react';
import Image from 'next/image';
import styles from '../landing-page-styles/socialupdates.module.css';

const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const normalizeUrl = (url) => {
  if (!url) return '#';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export default function SocialUpdates({ updates = [] }) {
  if (!updates || updates.length === 0) return null;

  const [featured, ...rest] = updates;
  const secondary = rest.slice(0, 3);
  const hasSecondary = secondary.length > 0;

  return (
    <div className={styles.socialSection}>
      <div className={`${styles.grid} ${!hasSecondary ? styles.gridSingle : ''}`}>

        {/* Featured post */}
        <a
          href={normalizeUrl(featured.url)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.featured} ${!hasSecondary ? styles.featuredOnly : ''}`}
        >
          {featured.image && (
            <div className={styles.featuredImageWrap}>
              <Image
                src={featured.image}
                alt=""
                fill
                className={styles.featuredImage}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}
          <div className={styles.featuredBody}>
            <div className={styles.dateLine}>
              <span className={styles.linkedinDot} />
              <span className={styles.featuredDate}>{formatDate(featured.date)}</span>
            </div>
            <p className={styles.featuredSnippet}>{truncateText(featured.excerpt, 220)}</p>
            <span className={styles.featuredLink}>View post ↗</span>
          </div>
        </a>

        {/* Secondary stack */}
        {hasSecondary && (
          <div className={styles.secondaryStack}>
            {secondary.map((post, i) => (
              <a
                key={post._id || i}
                href={normalizeUrl(post.url)}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.secondaryRow} ${i === secondary.length - 1 ? styles.secondaryRowLast : ''}`}
              >
                {post.image && (
                  <div className={styles.thumbWrap}>
                    <Image
                      src={post.image}
                      alt=""
                      fill
                      className={styles.thumbImage}
                      sizes="64px"
                    />
                  </div>
                )}
                <div className={styles.secondaryBody}>
                  <p className={styles.secondarySnippet}>{truncateText(post.excerpt, 110)}</p>
                  <div className={styles.secondaryFooter}>
                    <span className={styles.secondaryDate}>{formatDate(post.date)}</span>
                    <span className={styles.secondaryLink}>View ↗</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
