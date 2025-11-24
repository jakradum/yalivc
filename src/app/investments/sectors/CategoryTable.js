'use client';

import React, { useState, useEffect } from 'react';
import styles from './sectors.module.css';
import Button from '../../components/button';
import Link from 'next/link';
import { vectorUsageMap } from '../../components/companygrid';

const CategoryTable = ({ categories, philosophyText }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderDesktopLayout = () => (
    <>
      <div className={styles.sidebar}>
        <p className={styles.sidebarText}>{philosophyText}</p>
        {/* <Button href="/investments/companies" color="black">
          View Portfolio
        </Button> */}
      </div>
      <table className={styles.categoryTable}>
        <tbody>
          {/* First row: 4 items */}
          <tr>
            {categories.slice(0, 4).map((category, index) => (
              <td key={index} className={styles.categoryCell}>
                <Link href={`/investments/sectors/${category.slug.current}`} className={styles.categoryLink}>
                  <div className={styles.vector}>
                    {vectorUsageMap[category.name.toLowerCase()] || vectorUsageMap['artificial intelligence']}
                  </div>
                  <article className={styles.categoryContent}>
                    <div className={styles.categoryNumber}>
                      <h2>{String(index + 1).padStart(2, '0')}</h2>
                    </div>
                    <h4 className={styles.categoryTitle}>{category.name}</h4>
                  </article>
                </Link>
              </td>
            ))}
          </tr>
          {/* Second row: 3 items */}
          <tr>
            {categories.slice(4, 7).map((category, index) => (
              <td key={index} className={styles.categoryCell}>
                <Link href={`/investments/sectors/${category.slug.current}`} className={styles.categoryLink}>
                  <div className={styles.vector}>
                    {vectorUsageMap[category.name.toLowerCase()] || vectorUsageMap['artificial intelligence']}
                  </div>
                  <article className={styles.categoryContent}>
                    <div className={styles.categoryNumber}>
                      <h2>{String(index + 5).padStart(2, '0')}</h2>
                    </div>
                    <h4 className={styles.categoryTitle}>{category.name}</h4>
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
    <div
      className={styles.mobileCategoryGrid}
      onClick={() => setCurrentCard((prev) => (prev + 1) % categories.length)}
    >
      <p className={styles.sidebarText}>{philosophyText}</p>
      <section className={styles.carouselContainer}>
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
            <aside
              key={index}
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
                <p>Tap to view next</p>
              </article>
            </aside>
          );
        })}
      </section>
      {/* <Button href="/investments/companies" color="black">
        View Portfolio
      </Button> */}
    </div>
  );

  return (
    <div className={styles.categoryTableContainer}>
      {isMobile ? renderMobileLayout() : renderDesktopLayout()}
    </div>
  );
};

export default CategoryTable;