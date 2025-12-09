'use client';

import React, { useState, useEffect } from 'react';
import localCompaniesData from '../data/companies.json';
import styles from '../landing page styles/companies.module.css';
import Button from './button';
import { useData } from '../data/fetch component';
import Image from 'next/image';
import { DefenceVector } from './icons/background svgs/category svgs/defence vector';
import { GenericVector } from './icons/background svgs/category svgs/generic vector';
import { LifeSciencesVector } from './icons/background svgs/category svgs/life sciennces vector';
import { RoboticsVector } from './icons/background svgs/category svgs/robotics vector';
import { GenomicsVector } from './icons/background svgs/category svgs/genomics vector';
import { SemiconVector } from './icons/background svgs/category svgs/semicon vector';
import { ArtificialIntelligenceVector } from './icons/background svgs/category svgs/artificial intelligence vector';
import { AdvancedManufacturingVector } from './icons/background svgs/category svgs/advanced manufacturing vector';
import { GenerativeAIVector } from './icons/background svgs/category svgs/generative AI vector';
import { urlFor } from '@/sanity/client';

export const vectorUsageMap = {
  // New 6 categories
  'artificial intelligence': <ArtificialIntelligenceVector/>,
  'aerospace and surveillance': <DefenceVector/>,
  'life sciences': <LifeSciencesVector/>,
  'robotics': <RoboticsVector/>,
  'fabless semiconductor': <SemiconVector/>,
  'smart manufacturing': <AdvancedManufacturingVector/>,
  // Legacy mappings (for backward compatibility during migration)
  'genomics': <LifeSciencesVector/>,
  'semiconductors': <SemiconVector/>,
  'aerospace': <DefenceVector/>,
  'defence': <DefenceVector/>,
  'fabless chip design': <SemiconVector/>,
  'advanced manufacturing': <AdvancedManufacturingVector/>,
  'generative ai': <ArtificialIntelligenceVector/>,
  'strategic tech': <DefenceVector/>,
};

const CompanyTable = ({ companies }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const buttonText = 'view more details';
 const minSwipeDistance = 50;
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
      setCurrentCard((prev) => (prev + 1) % companiesData.data.length);
    }
    if (isRightSwipe) {
      setCurrentCard((prev) => (prev - 1 + companiesData.data.length) % companiesData.data.length);
    }
  };

   const companiesData = { data: companies || localCompaniesData.data };
    // ? { data: data.data['companies-csv (1)'] }
    // : localCompaniesData;

  const numberOfCompanies = companiesData.data.length;
  const currentDate = new Date();
  const monthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const numberToWords = (num) => {
    const words = [
      'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
      'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 
      'eighteen', 'nineteen', 'twenty'
    ];
    if (num <= 20) {
      return words[num - 1];
    }
    return num.toString();
  };

  const getUpdatedText = () => {
    return `Our team's prior investments span a range of startups in the deep tech domain, some of which have made it to public markets in India. As of ${monthYear}, our investments include ${numberToWords(numberOfCompanies)} ${numberOfCompanies === 1 ? 'company' : 'companies'}.`;
  };

  const updatedText = getUpdatedText();

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
        <p className={styles.sidebarText}>{updatedText}</p>
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
                      <p className={styles.companyCategory}>{company.category?.name}</p>

                      <div className={styles.vector}>{vectorUsageMap[company.category?.name?.toLowerCase()]}</div>
                      {company.logo && (
                        <div className={styles.imagePlaceholder}>
                          <Image
                            src={urlFor(company.logo).width(100).url()}
                            alt={company.name}
                            width={100}
                            height={100}
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                      )}
                      <p className={styles.companyOneLiner}>{company.oneLiner}</p>
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
      <p className={styles.sidebarText}>{updatedText}</p>
      <section 
        className={styles.carouselContainer}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
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
                  <p className={styles.companyCategory}>{company.category?.name}</p>

                  <div className={styles.mobileVector}>
                    {vectorUsageMap[company.category?.name?.toLowerCase()] || <GenericVector />}
                  </div>

                  <small>{company.oneLiner}</small>
                  <p>Swipe to view next</p>
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