'use client';

import React, { useState, useEffect } from 'react';
import companiesData from '../data/companies.json';
import styles from '../landing page styles/companies.module.css';
import Button from './button';

const CompanyTable = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const dummyImg = 'https://img.freepik.com/free-vector/business-logo_23-2147503133.jpg';
  const buttonText = 'view all companies';

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };

    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderDesktopLayout = () => (
    <>
      <div className={styles.sidebar}>
        <p className={styles.sidebarText}>
          Our team's prior investments span a range of startups in the deep tech domain, some of which have made it to
          public markets in India.
        </p>
        <Button href="/investments" color="black">
          {buttonText}
        </Button>
      </div>
      <table className={styles.companyTable}>
        <tbody>
          {[0, 1].map((row) => (
            <tr key={row}>
              {companiesData.companies.slice(row * 5, (row + 1) * 5).map((company, index) => (
                <td key={index} className={styles.companyCell}>
                  <article className={styles.companyContent}>
                    <div className={styles.companyNumber}>
                      <h2>{String(row * 5 + index + 1).padStart(2, '0')}</h2>
                    </div>
                    <h4 className={styles.companyTitle}>{company.name}</h4>
                    <p className={styles.companyCategory}>{company.category}</p>
                    <img src={dummyImg} className={styles.imagePlaceholder} alt={company.name} />
                    <small className={styles.companyOneLiner}>{company.oneLiner}</small>
                  </article>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  const renderMobileLayout = () => (
    <div
      className={styles.mobileCompanyGrid}
      onClick={() => setCurrentCard((prev) => (prev + 1) % companiesData.companies.length)}
    >
      <section className={styles.carouselContainer}>
        {companiesData.companies.map((company, index) => {
          const isVisible = index >= currentCard && index < currentCard + 4;
          const cardStyle = isVisible
            ? {
                zIndex: companiesData.companies.length - (index - currentCard),
                transform: `translateX(${(index - currentCard) * 20}px) scale(${1 - (index - currentCard) * 0.05})`,
                opacity: 1 - (index - currentCard) * 0.2,
              }
            : { display: 'none' };

          return (
            <aside
              key={index}
              className={`${styles.mobileCompanyCard} ${index === currentCard ? styles.activeCard : ''}`}
              style={cardStyle}
            >
              <article className={styles.keyDetails}>
                <div className={styles.cardHeader}>
                  <span className={styles.companyNumber}>
                    <h2>{String(index + 1).padStart(2, '0')}</h2>
                  </span>
                  <span className={styles.totalCount}>
                    <h3>/{companiesData.companies.length}</h3>
                  </span>
                </div>
                <h4 className={styles.companyTitle}>{company.name}</h4>
                <p className={styles.companyCategory}>{company.category}</p>
              </article>
              <img src={dummyImg} className={styles.mobileImagePlaceholder} alt={company.name} />
              <small>{company.oneLiner}</small>
            </aside>
          );
        })}
      </section>
      <Button href="/investments" color="black">
        {buttonText}
      </Button>
    </div>
  );

  return <div className={styles.companyTableContainer}>{isMobile ? renderMobileLayout() : renderDesktopLayout()}</div>;
};

export default CompanyTable;
