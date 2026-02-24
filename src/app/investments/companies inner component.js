'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import styles from './company inner comp.module.css';
import Image from 'next/image';
import { ExpandIcon } from '../components/icons/small icons/expandIcon';

function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}

function isLinkedInLink(url) {
  return url && url.toLowerCase().includes('linkedin.com');
}

/**
 * Resolve the CSS variable name for a given category slug.
 * Falls back to --sector-color-default for unrecognised slugs.
 * The actual hex values live in globals.css (:root).
 */
function sectorBandStyle(categorySlug) {
  if (!categorySlug) return { backgroundColor: 'var(--sector-color-default)' };
  return {
    backgroundColor: `var(--sector-color-${categorySlug}, var(--sector-color-default))`,
  };
}

/**
 * Compute how many card columns fit at the current window width.
 * Thresholds account for the page wrapper's ~2rem side margins.
 */
function getColumnCount(windowWidth) {
  if (windowWidth >= 1450) return 5;
  if (windowWidth >= 1150) return 4;
  if (windowWidth >= 850)  return 3;
  if (windowWidth >= 540)  return 2;
  return 1;
}

export const CompaniesInnerComponent = ({ companies, categories: sanityCategories = [] }) => {
  const windowWidth = useWindowWidth();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const categories = sanityCategories;

  const toggleCategoryDropdown = () => setIsCategoryDropdownOpen((prev) => !prev);

  const activeCategories = useMemo(() => {
    const activeCats = new Set();
    companies.forEach((company) => {
      activeCats.add(company.category?.name?.toLowerCase());
    });
    return Array.from(activeCats);
  }, [companies]);

  const toggleCategory = (categoryName) => {
    setSelectedCategories((prev) => {
      const lower = categoryName.toLowerCase();
      return prev.includes(lower) ? prev.filter((c) => c !== lower) : [...prev, lower];
    });
    setIsCategoryDropdownOpen(false);
  };

  const filteredCompanies = companies.filter(
    (company) =>
      selectedCategories.length === 0 ||
      selectedCategories.includes(company.category?.name?.toLowerCase())
  );

  const selectedEmptyCategories = useMemo(() => {
    return selectedCategories.filter((cat) => !activeCategories.includes(cat));
  }, [selectedCategories, activeCategories]);

  const renderCategoriesSection = categories.length > 0 && (
    <>
      <p>Select one or more categories to filter the list below</p>
      <div className={`${styles.categoriesWrapper} ${isCategoryDropdownOpen ? styles.expanded : ''}`}>
        {/* mobile dropdown */}
        <div className={styles.categoryDropdown}>
          <button className={styles.dropdownToggle} onClick={toggleCategoryDropdown}>
            CATEGORIES
            <ExpandIcon className={`${styles.expandIcon} ${isCategoryDropdownOpen ? styles.expanded : ''}`} />
          </button>
          <div className={`${styles.dropdownContent} ${isCategoryDropdownOpen ? styles.show : ''}`}>
            {categories.map((category) => (
              <button
                key={category._id || category.slug}
                className={`${styles.categoryItem} ${
                  selectedCategories.includes(category.name?.toLowerCase()) ? styles.selectedCategory : ''
                }`}
                onClick={() => toggleCategory(category.name)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
        {/* desktop pill row */}
        <div className={styles.categoriesContainer}>
          {categories.map((category) => (
            <button
              key={category._id || category.slug}
              className={`${styles.categoryItem} ${
                selectedCategories.includes(category.name?.toLowerCase()) ? styles.selectedCategory : ''
              }`}
              onClick={() => toggleCategory(category.name)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const renderEmptyCategoryPlaceholder = (categoryName) => (
    <div key={categoryName} className={styles.emptyCategoryPlaceholder}>
      <p className={styles.emptyCategoryTitle}>{categoryName}</p>
      <p className={styles.emptyCategoryMessage}>
        We are actively looking to invest in startups operating in this sector.
      </p>
    </div>
  );

  return (
    <div className={styles.container}>
      {renderCategoriesSection}

      {selectedEmptyCategories.length > 0 && (
        <div className={styles.emptyCategories}>
          {selectedEmptyCategories.map((catName) => {
            const originalCat = categories.find((c) => c.name?.toLowerCase() === catName);
            return renderEmptyCategoryPlaceholder(originalCat?.name || catName);
          })}
        </div>
      )}

      <div
        className={styles.companiesContainer}
        style={{ gridTemplateColumns: `repeat(${windowWidth > 0 ? getColumnCount(windowWidth) : 4}, 1fr)` }}
      >
        {filteredCompanies.map((company, index) => {
          const categorySlug = company.category?.slug?.current;
          const companySlug = company.slug?.current;
          const href =
            categorySlug && companySlug
              ? `/investments/${categorySlug}/${companySlug}/`
              : null;

          return (
            <div key={company._id || index} className={styles.companyCard}>
              {/* Stretched overlay link — covers the full card */}
              {href && company.enableCompanyPage && (
                <Link href={href} className={styles.cardOverlayLink} aria-label={`View ${company.name}`} />
              )}

              {/* Logo area */}
              <div className={styles.logoArea}>
                <div className={styles.logoBox}>
                  {company.logo ? (
                    <Image
                      src={company.logo}
                      alt={`${company.name} logo`}
                      width={98}
                      height={98}
                      style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                      sizes="98px"
                    />
                  ) : (
                    <span className={styles.logoPlaceholder}>
                      {company.name?.charAt(0) ?? '?'}
                    </span>
                  )}
                </div>
              </div>

              {/* Sector colour band — colour resolved from --sector-color-<slug> in globals.css */}
              <div className={styles.sectorBand} style={sectorBandStyle(categorySlug)} />

              {/* Info body */}
              <div className={styles.cardBody}>
                {/* External link icons (above the overlay, z-index: 1) */}
                {company.link && (
                  <div className={styles.cardIcons}>
                    <a
                      href={company.link}
                      className={styles.iconLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={isLinkedInLink(company.link) ? 'LinkedIn' : 'Visit website'}
                    >
                      {isLinkedInLink(company.link) ? 'in' : '↗'}
                    </a>
                  </div>
                )}

                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Company Name</span>
                  <span className={styles.cardValue}>{company.name}</span>
                </div>

                {company.category?.name && (
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Sector</span>
                    <span className={styles.cardValue}>{company.category.name}</span>
                  </div>
                )}

                {company.detail && (
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Description</span>
                    <span className={`${styles.cardValue} ${styles.cardDescription}`}>
                      {company.detail}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
