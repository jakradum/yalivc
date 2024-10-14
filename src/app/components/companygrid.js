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

export const vectorUsageMap = {
  'robotics': <RoboticsVector/>,
  'artificial intelligence': <ArtificialIntelligenceVector/>,
  'genomics': <GenomicsVector/>,
  'semiconductors': <SemiconVector/>,
  'aerospace': <GenericVector/>,
  'defence': <DefenceVector/>,
  'fabless chip design': <SemiconVector/>,
  'advanced manufacturing': <AdvancedManufacturingVector/>,
  'generative AI': <GenerativeAIVector/>,
  'life sciences': <LifeSciencesVector/>,
};

export const companyLogoMap = {
  'Aurasemi': 'logos/aura semi.png',
  'BluArmor': 'logos/bluarmor.png',
  'Cadence': 'logos/cadence-1.png',
  'Cirel Systems': 'logos/cirel-systems-1.png',
  'Cosmic Circuits': 'logos/cosmic circuits.png',
  'Data Patterns': 'logos/data-pattens-1.png',
  'Ethereal Machines': 'logos/ethereal-machines-1.png',
  'GalaxEye': 'logos/galaxeye-1.png',
  'Greenstone Biosciences': 'logos/greenstone.png',
  'Kyulux': 'logos/kyulux-1.png',
  'Artera':'logos/artera.png',
  'MTAR Technologies': 'logos/mtar.png',
  'NanoSemi': 'logos/nanosemi-inc-1.png',
  'SambaNova Systems': 'logos/SambaNova-dark-logo-1.png',
  'Tonbo Imaging': 'logos/tonbo.png',
  'Haystack Analytics': 'logos/haystack.svg',
  'Walden International': 'logos/walden.jpeg',
  'ideaForge': 'logos/ideaforge.png',
  '4baseCare': 'logos/4basecare.png',
  'Perceptyne': 'https://cdn.prod.website-files.com/65f80c8d989211966d577295/6607243203bf77dcc16f7f69_perceptyne%20logo.svg',
};

const CompanyTable = () => {
  const { data } = useData();
  const [isMobile, setIsMobile] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);

  const buttonText = 'view more details';

  const companiesData = (data && data.status === 'success' && data.data && data.data['companies-csv (1)']) 
    ? { data: data.data['companies-csv (1)'] }
    : localCompaniesData;

  const numberOfCompanies = companiesData.data.length;
  const currentDate = new Date();
  const monthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const numberToWords = (num) => {
    const words = ['one', 'two', 'three', 'four', 'five'];
    return words[num - 1] || num.toString();
  };

  const getUpdatedText = () => {
    if (numberOfCompanies > 5) {
      return "Our team's prior investments span a range of startups in the deep tech domain, some of which have made it to public markets in India.";
    } else {
      return `Our team's prior investments span a range of startups in the deep tech domain, some of which have made it to public markets in India. As of ${monthYear}, our investments include ${numberToWords(numberOfCompanies)} ${numberOfCompanies === 1 ? 'company' : 'companies'}.`;
    }
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
                    <p className={styles.companyCategory}>{company.category}</p>

                    <div className={styles.vector}>{vectorUsageMap[company.category]}</div>
                    {companyLogoMap[company.name] && (
                      <div className={styles.imagePlaceholder}>
                        <Image
                          src={companyLogoMap[company.name]}
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
    <div
      className={styles.mobileCompanyGrid}
      onClick={() => setCurrentCard((prev) => (prev + 1) % companiesData.data.length)}
    >
      <p className={styles.sidebarText}>{updatedText}</p>
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

                <div className={styles.mobileVector}>
                  {vectorUsageMap[company.category] || <GenericVector />}
                </div>

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