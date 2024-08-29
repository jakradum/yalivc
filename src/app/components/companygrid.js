'use client';

import React, { useState, useEffect } from 'react';
import companiesData from '../data/companies.json';
import styles from '../landing page styles/companies.module.css';
import Button from './button';

const CompanyTable = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const dummyImg = 'https://img.freepik.com/free-vector/business-logo_23-2147503133.jpg';

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
          View more companies
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
    <div className={styles.mobileCompanyGrid}>
      <div className={styles.carouselContainer}>
        {companiesData.companies.slice(0, 10).map((company, index) => {
          let cardClass = '';
          if (index === currentCard) cardClass = styles.activeCard;
          else if (index === (currentCard + 1) % 10) cardClass = styles.nextCard;
          else if (index === (currentCard - 1 + 10) % 10) cardClass = styles.prevCard;

          return (
            <div key={index} className={`${styles.mobileCompanyCard} ${cardClass}`} style={{ zIndex: 10 - index }}>
              <div className={styles.cardHeader}>
                <span className={styles.companyNumber}>{String(index + 1).padStart(2, '0')}</span>
                <span className={styles.totalCount}>/10</span>
              </div>
              <h4 className={styles.companyTitle}>{company.name}</h4>
              <p className={styles.companyCategory}>{company.category}</p>
              <img src={dummyImg} className={styles.mobileImagePlaceholder} alt={company.name} />
            </div>
          );
        })}
      </div>
      <div className={styles.navigationButtons}>
        <button onClick={() => setCurrentCard((prev) => (prev > 0 ? prev - 1 : 9))} className={styles.navButton}>
          Previous
        </button>
        <button onClick={() => setCurrentCard((prev) => (prev < 9 ? prev + 1 : 0))} className={styles.navButton}>
          Next
        </button>
      </div>
      <Button href="/investments" color="black">
        View more companies
      </Button>
    </div>
  );

  return <div className={styles.companyTableContainer}>{isMobile ? renderMobileLayout() : renderDesktopLayout()}</div>;
};

export default CompanyTable;
