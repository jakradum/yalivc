'use client';

import React, { useState, useEffect } from 'react';
import localCompaniesData from '../data/companies.json';
import styles from '../landing page styles/companies.module.css';
import Button from './button';
import { useData } from '../data/fetch component';
import { DefenceVector } from './icons/background svgs/category svgs/defence vector';
import { GenericVector } from './icons/background svgs/category svgs/generic vector';
import { LifeSciencesVector } from './icons/background svgs/category svgs/life sciennces vector';
import { RoboticsVector } from './icons/background svgs/category svgs/robotics vector';
import { GenomicsVector } from './icons/background svgs/category svgs/genomics vector';
import { SemiconVector } from './icons/background svgs/category svgs/semicon vector';

export const vectorUsageMap = {
  'robotics': <RoboticsVector/>,
  'artificial intelligence': <GenericVector/>,
  'genomics': <GenomicsVector/>,
  'semiconductors': <SemiconVector/>,
  'aerospace': <GenericVector/>,
  'defence': <DefenceVector/>,
  'fabless chip design': <SemiconVector/>,
  'advanced manufacturing': <RoboticsVector/>,
  'generative AI': <GenericVector/>,
  'life sciences': <LifeSciencesVector/>,
};


const CompanyTable = () => {
  const { data } = useData();
  const [isMobile, setIsMobile] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);

  const dummyImg = 'https://img.freepik.com/free-vector/business-logo_23-2147503133.jpg';
  const buttonText = 'view all companies';

  const companiesData = (data && data.status === 'success' && data.data && data.data['companies-csv (1)']) 
    ? { data: data.data['companies-csv (1)'] }
    : localCompaniesData;

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
                    
                    {/* Vector usage based on category */}
                    <div className={styles.vector}>
                    {vectorUsageMap[company.category] }
                    </div>
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
  
                {/* Vector usage based on category */}
                {vectorUsageMap[company.category] && (
                  <img
                    src={vectorUsageMap[company.category]}
                    className={styles.categoryVector}
                  />
                )}
  
                <img src={dummyImg} className={styles.mobileImagePlaceholder} alt={company.name} />
                <small>{company.oneLiner}</small>
                <p>Tap to view next</p>
              </article>
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
      {isMobile ? renderMobileLayout() : renderDesktopLayout()}
    </div>
  );
};

export default CompanyTable;