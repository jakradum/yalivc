'use client';

import React, { useState, useEffect } from 'react';
import styles from './investments.module.css'; 
import Button from '../components/button';
import Link from 'next/link';
import { vectorUsageMap } from '../components/companygrid';

const truncateWords = (text, wordLimit = 20) => {
  if (!text) return '';
  const words = text.split(' ');
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(' ') + '...';
};

const CategoryTable = ({ categories, philosophyText }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const minSwipeDistance = 50;

  // swipe handlers

  const onTouchStart = (e) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setCurrentCard((prev) => (prev + 1) % categories.length);
    }
    if (isRightSwipe) {
      setCurrentCard((prev) => (prev - 1 + categories.length) % categories.length);
    }
  };

  const renderDesktopLayout = () => (
    <>
      <div className={styles.sidebar}>
        <p className={styles.sidebarText}>{philosophyText}</p>
      </div>
      <table className={styles.categoryTable}>
        <tbody>
          {/* First row: 4 items */}
          <tr>
            {categories.slice(0, 4).map((category, index) => (
              <td key={index} className={styles.categoryCell}>
                <Link href={`/investments/${category.slug.current}`} className={styles.categoryLink}>
                  <div className={styles.vector}>
                    {vectorUsageMap[category.name.toLowerCase()] || vectorUsageMap['artificial intelligence']}
                  </div>
                  <article className={styles.categoryContent}>
                    <div className={styles.categoryNumber}>
                      <h2>{String(index + 1).padStart(2, '0')}</h2>
                    </div>
                    <h4 className={styles.categoryTitle}>{category.name}</h4>
                    <p className={styles.categoryDescription}>
                      {truncateWords(category.description, 20)}
                    </p>
                  </article>
                </Link>
              </td>
            ))}
          </tr>
          {/* Second row: 3 items */}
          <tr>
            {categories.slice(4, 7).map((category, index) => (
              <td key={index} className={styles.categoryCell}>
                <Link href={`/investments/${category.slug.current}`} className={styles.categoryLink}>
                  <div className={styles.vector}>
                    {vectorUsageMap[category.name.toLowerCase()] || vectorUsageMap['artificial intelligence']}
                  </div>
                  <article className={styles.categoryContent}>
                    <div className={styles.categoryNumber}>
                      <h2>{String(index + 5).padStart(2, '0')}</h2>
                    </div>
                    <h4 className={styles.categoryTitle}>{category.name}</h4>
                    <p className={styles.categoryDescription}>
                      {truncateWords(category.description, 20)}
                    </p>
                  </article>
                </Link>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </>
  );

   const renderMobileLayout = () => (
    <div className={styles.mobileCategoryGrid}>
      <p className={styles.sidebarText}>{philosophyText}</p>
      <section 
        className={styles.carouselContainer}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {categories.map((category, index) => {
          const isVisible = index >= currentCard && index < currentCard + 4;
          const cardStyle = isVisible
            ? {
                zIndex: categories.length - (index - currentCard),
                transform: `translateX(${(index - currentCard) * 20}px) scale(${1 - (index - currentCard) * 0.05})`,
                opacity: 1 - (index - currentCard) * 0.2,
              }
            : { display: 'none' };

          return (
            <Link 
              key={index}
              href={`/investments/${category.slug.current}`}
              className={styles.mobileCategoryCardLink}
            >
              <aside
                className={`${styles.mobileCategoryCard} ${index === currentCard ? styles.activeCard : ''}`}
                style={cardStyle}
              >
                <article className={styles.keyDetails}>
                  <div className={styles.cardHeader}>
                    <span className={styles.categoryNumber}>
                      <h2>{String(index + 1).padStart(2, '0')}</h2>
                    </span>
                    <span className={styles.totalCount}>
                      <h3>/{categories.length}</h3>
                    </span>
                  </div>
                  <h4 className={styles.categoryTitle}>{category.name}</h4>

                  <div className={styles.mobileVector}>
                    {vectorUsageMap[category.name.toLowerCase()] || vectorUsageMap['artificial intelligence']}
                  </div>
                  <p>Swipe to view next</p>
                </article>
              </aside>
            </Link>
          );
        })}
      </section>
    </div>
  );

  return (
    <div className={styles.categoryTableContainer}>
      {isMobile ? renderMobileLayout() : renderDesktopLayout()}
    </div>
  );
};

export default CategoryTable;