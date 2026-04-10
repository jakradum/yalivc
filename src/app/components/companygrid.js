'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import localCompaniesData from '../data/companies.json';
import styles from '../landing-page-styles/companies.module.css';
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
import { darkVectorBank } from './icons/background svgs/category svgs/dark-vector-bank';

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

const CompanyTable = ({ companies, companyCount }) => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [FillerVector, setFillerVector] = useState(() => darkVectorBank[0]);

  const buttonText = 'view more details';
 const minSwipeDistance = 50;
   const onTouchStart = (e) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (totalCards) => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setCurrentCard((prev) => (prev + 1) % totalCards);
    }
    if (isRightSwipe) {
      setCurrentCard((prev) => (prev - 1 + totalCards) % totalCards);
    }
  };

  const rawCompanies = companies || localCompaniesData.data;
  const companiesData = {
    data: [
      ...rawCompanies.filter(c => c.isFeatured),
      ...rawCompanies.filter(c => !c.isFeatured),
    ],
  };
    // ? { data: data.data['companies-csv (1)'] }
    // : localCompaniesData;

  const numberOfCompanies = companyCount ?? companiesData.data.length;
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

  useEffect(() => {
    const pick = darkVectorBank[Math.floor(Math.random() * darkVectorBank.length)];
    setFillerVector(() => pick);
  }, []);

  const getCompanyHref = (company) => {
    const categorySlug = company.category?.slug?.current;
    const companySlug = company.slug?.current;
    return categorySlug && companySlug && company.enableCompanyPage
      ? `/investments/${categorySlug}/${companySlug}/`
      : null;
  };

  const renderDesktopLayout = () => {
    const featuredCompany = companiesData.data.find(c => c.isFeatured);
    const regularCompanies = companiesData.data;
    const featuredHref = featuredCompany ? getCompanyHref(featuredCompany) : null;

    return (
      <>
        <div className={styles.sidebar}>
          <p className={styles.sidebarText}>{updatedText}</p>
          <Button href="/investments" color="black">
            {buttonText}
          </Button>
        </div>
        <div className={styles.portfolioArea}>
          {featuredCompany && (
            <div className={styles.featuredRow}>
              <div className={styles.featuredIdentity}>
                {featuredCompany.logo && (
                  <div className={styles.featuredLogo}>
                    <Image
                      src={urlFor(featuredCompany.logo).width(134).url()}
                      alt={featuredCompany.name}
                      width={67}
                      height={67}
                      className={styles.featuredLogoImg}
                    />
                  </div>
                )}
                <div>
                  <div className={styles.featuredName}>{featuredCompany.name}</div>
                  <div className={styles.featuredSector}>{featuredCompany.category?.name}</div>
                </div>
              </div>
              <div className={styles.featuredDescCol}>
              <div className={styles.featuredLabel}>Featured Portfolio Company</div>
              <p className={styles.featuredDesc}>{featuredCompany.oneLiner}</p>
            </div>
              {featuredHref && (
                <Link href={featuredHref} className={styles.featuredViewLink}>View ↗</Link>
              )}
            </div>
          )}
          <div className={styles.companyGrid}>
            {regularCompanies.map((company, index) => {
              const href = getCompanyHref(company);
              const cellContent = (
                <>
                  <div className={styles.cellIdentity}>
                    {company.logo && (
                      <div className={styles.cellLogo}>
                        <Image
                          src={urlFor(company.logo).width(56).url()}
                          alt={company.name}
                          width={28}
                          height={28}
                          className={styles.cellLogoImg}
                        />
                      </div>
                    )}
                    <div>
                      <div className={styles.cellName}>{company.name}</div>
                      <div className={styles.cellSector}>{company.category?.name}</div>
                    </div>
                  </div>
                  <p className={styles.cellDesc}>{company.oneLiner}</p>
                </>
              );

              return href ? (
                <Link key={index} href={href} className={`${styles.gridCell} ${styles.gridCellLink}`}>
                  {cellContent}
                </Link>
              ) : (
                <div key={index} className={styles.gridCell}>
                  {cellContent}
                </div>
              );
            })}
            <Link href="/contact" className={`${styles.gridCell} ${styles.pitchCell}`}>
              <div className={styles.cellIdentity}>
                <div className={styles.cellLogo} />
                <div>
                  <div className={styles.pitchName}>YourStartup</div>
                </div>
              </div>
              <p className={styles.pitchDesc}>See yourself being a part of our portfolio? We&rsquo;re looking for the next big idea too.</p>
              <span className={styles.pitchCta}>Pitch to us →</span>
            </Link>
          </div>
        </div>
      </>
    );
  };

   const renderMobileLayout = () => {
    const totalCards = companiesData.data.length + 1;
    const pitchIndex = companiesData.data.length;
    const pitchVisible = pitchIndex >= currentCard && pitchIndex < currentCard + 4;
    const pitchCardStyle = pitchVisible
      ? {
          zIndex: totalCards - (pitchIndex - currentCard),
          transform: `translateX(${(pitchIndex - currentCard) * 20}px) scale(${1 - (pitchIndex - currentCard) * 0.05})`,
          opacity: 1 - (pitchIndex - currentCard) * 0.2,
        }
      : { display: 'none' };

    return (
    <div className={styles.mobileCompanyGrid}>
      <p className={styles.sidebarText}>{updatedText}</p>
      <section
        className={styles.carouselContainer}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => onTouchEnd(totalCards)}
      >
        {companiesData.data.map((company, index) => {
          const isVisible = index >= currentCard && index < currentCard + 4;
          const cardStyle = isVisible
            ? {
                zIndex: totalCards - (index - currentCard),
                transform: `translateX(${(index - currentCard) * 20}px) scale(${1 - (index - currentCard) * 0.05})`,
                opacity: 1 - (index - currentCard) * 0.2,
              }
            : { display: 'none' };

          const href = getCompanyHref(company);
          const cardInner = (
            <article className={styles.keyDetails}>
              {company.isFeatured && (
                <div className={styles.mobileFeaturedLabel}>Featured</div>
              )}
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

              <small>{company.oneLiner?.length > 100 ? `${company.oneLiner.substring(0, 100)}...` : company.oneLiner}</small>
              <p className={styles.mobileCardHint}>
                {href ? 'Tap for more' : ''}{href ? ' · ' : ''}Swipe for next
              </p>
            </article>
          );

          return href ? (
            <Link
              key={index}
              href={href}
              className={`${styles.mobileCompanyCard} ${index === currentCard ? styles.activeCard : ''} ${company.isFeatured ? styles.mobileCompanyCardFeatured : ''}`}
              style={cardStyle}
            >
              {cardInner}
            </Link>
          ) : (
            <aside
              key={index}
              className={`${styles.mobileCompanyCard} ${index === currentCard ? styles.activeCard : ''} ${company.isFeatured ? styles.mobileCompanyCardFeatured : ''}`}
              style={cardStyle}
            >
              {cardInner}
            </aside>
          );
        })}
        <Link
          href="/contact"
          className={`${styles.mobileCompanyCard} ${styles.mobilePitchCard} ${pitchIndex === currentCard ? styles.activeCard : ''}`}
          style={pitchCardStyle}
        >
          <article className={styles.keyDetails}>
            <div className={styles.mobilePitchLogoBox} />
            <h4 className={styles.companyTitle} style={{ fontStyle: 'italic', color: 'rgba(54,54,54,0.45)' }}>YourStartup</h4>
            <p className={styles.companyCategory} style={{ color: 'rgba(54,54,54,0.3)' }}>&nbsp;</p>
            <p className={styles.mobilePitchDesc}>See yourself being a part of our portfolio? We&rsquo;re looking for the next big idea too.</p>
            <p className={styles.mobileCardHint}>Tap to pitch · Swipe for next</p>
          </article>
        </Link>
      </section>
      <Button href="/investments" color="black">
        {buttonText}
      </Button>
    </div>
    );
  };

  return (
    <div className={styles.companyTableContainer}>
      {isMobile ? renderMobileLayout() : renderDesktopLayout()}
    </div>
  );
};

export default CompanyTable;