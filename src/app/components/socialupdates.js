'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from '../landing page styles/socialupdates.module.css';
import Button from './button';

const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return formatter.format(date);
};

const getPlatformIcon = (platform) => {
  switch (platform) {
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={styles.platformIcon}>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      );
    case 'twitter':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={styles.platformIcon}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={styles.platformIcon}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      );
  }
};

const ExpandChevron = ({ isExpanded }) => (
  <svg
    className={`${styles.expandIcon} ${isExpanded ? styles.expandedIcon : ''}`}
    width="29"
    height="16"
    viewBox="0 0 29 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_featured)">
      <line x1="28.6464" y1="15.3536" x2="14.5043" y2="1.21142" stroke="black"/>
      <line x1="15.2793" y1="1.35355" x2="1.1372" y2="15.4957" stroke="black"/>
    </g>
    <defs>
      <clipPath id="clip0_featured">
        <rect width="28.2164" height="14.2843" fill="white" transform="translate(29 15.1421) rotate(-180)"/>
      </clipPath>
    </defs>
  </svg>
);

export default function SocialUpdates({ updates = [] }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!updates || updates.length === 0) {
    return null;
  }

  const displayedUpdates = isMobile && !isExpanded ? updates.slice(0, 1) : updates;

  return (
    <div className={styles.socialSection}>
      {isMobile ? (
        <>
          <div className={styles.mobileCardsContainer}>
            {displayedUpdates.map((update, index) => (
              <div key={update._id || index} className={styles.card}>
                {update.image && (
                  <div className={styles.imageWrapper}>
                    <Image
                      src={update.image}
                      alt={update.author || 'Featured post'}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="100vw"
                    />
                  </div>
                )}
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    {getPlatformIcon(update.platform)}
                  </div>
                  <p className={styles.excerpt}>{truncateText(update.excerpt, 120)}</p>
                  <div className={styles.cardFooter}>
                    <span className={styles.date}>{formatDate(update.date)}</span>
                    <Button href={update.url} color="black" target="_blank">
                      View post
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {updates.length > 1 && (
            <button
              className={styles.expandButton}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
              <ExpandChevron isExpanded={isExpanded} />
            </button>
          )}
        </>
      ) : (
        <div className={styles.carouselWrapper}>
          <div className={styles.cardsContainer}>
            {updates.map((update, index) => (
              <div key={update._id || index} className={styles.card}>
                {update.image && (
                  <div className={styles.imageWrapper}>
                    <Image
                      src={update.image}
                      alt={update.author || 'Featured post'}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="300px"
                    />
                  </div>
                )}
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    {getPlatformIcon(update.platform)}
                  </div>
                  <p className={styles.excerpt}>{truncateText(update.excerpt, 120)}</p>
                  <div className={styles.cardFooter}>
                    <span className={styles.date}>{formatDate(update.date)}</span>
                    <Button href={update.url} color="black" target="_blank">
                      View post
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
