'use client';

import React, { useState, useEffect } from 'react';
import localCompaniesData from '../data/companies.json';
import styles from '../landing page styles/companies.module.css';
import Button from './button';

const API_URL = 'https://script.googleusercontent.com/macros/echo?user_content_key=rsI5aJreCH3UVDj6WtAFcGxkjZkcOofgCkOvInVxGyNrkZ1NZ-QNpfC0oin9EqEmmnmm7QzuPM3UnyBZcC2TggzaYndVheE0m5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnDU7zD5nrkmclF5j850JDRYBlfuhWT3Cj-E-49cRxK-qlmd6_1NOqA6n2lAH5jfLZU7JUIUzOJcR4MX7KV-QZyuKNqivHFDEKA&lib=MmHDKL-d2iWmU93zHCQ7t4_c2JwAnkCxa';

const CompanyTable = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [companiesData, setCompaniesData] = useState(localCompaniesData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const dummyImg = 'https://img.freepik.com/free-vector/business-logo_23-2147503133.jpg';
  const buttonText = 'view all companies';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setCompaniesData(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error);
        // We're not setting companiesData here, as we're already using localCompaniesData as fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (error) {
    console.warn('Using local data due to fetch error:', error.message);
  }

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
              {companiesData.data.slice(row * 5, (row + 1) * 5).map((company, index) => (
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
      onClick={() => setCurrentCard((prev) => (prev + 1) % companiesData.data.length)}
    >
      <p className={styles.sidebarText}>
        Our team's prior investments span a range of startups in the deep tech domain, some of which have made it to
        public markets in India.
      </p>
      <section className={styles.carouselContainer}>
        {companiesData.data.map((company, index) => {
          const isVisible = index >= currentCard && index < currentCard + 4;
          const cardStyle = isVisible
            ? {
                zIndex: companiesData.data.length - (index - currentCard),
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
                    <h3>/{companiesData.data.length}</h3>
                  </span>
                </div>
                <h4 className={styles.companyTitle}>{company.name}</h4>
                <p className={styles.companyCategory}>{company.category}</p>
              </article>
              <img src={dummyImg} className={styles.mobileImagePlaceholder} alt={company.name} />
              <small>{company.oneLiner}</small>
              <p>Tap to view next</p>
            </aside>
          );
        })}
      </section>
      <Button href="/investments" color="black">
        {buttonText}
      </Button>
    </div>
  );

  return (
    <div className={styles.companyTableContainer}>
      {isLoading && <div>Updating...</div>}
      {isMobile ? renderMobileLayout() : renderDesktopLayout()}
    </div>
  );
};

export default CompanyTable;