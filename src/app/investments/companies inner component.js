'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

export const CompaniesInnerComponent = ({companies, categories: sanityCategories = []}) => {
  const windowWidth = useWindowWidth();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  // Use categories from Sanity (already sorted by order)
  const categories = sanityCategories;

  const toggleCategoryDropdown = () => {
    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
  };

  const activeCategories = useMemo(() => {
    const activeCats = new Set();
    companies.forEach(company => {
      activeCats.add(company.category?.name?.toLowerCase());
    });
    return Array.from(activeCats);
  }, [companies]);

  // All category names lowercased (for matching)
  const allCategoryNames = useMemo(() => {
    return categories.map(cat => cat.name?.toLowerCase()).filter(Boolean);
  }, [categories]);

  // useEffect(() => {
  //   console.log('useData hook output:', { data, loading, error });

  //   if (loading) {
  //     console.log('Currently loading, no action taken');
  //     return;
  //   }

  //   if (error) {
  //     console.log('Error fetching data, using local data:', error);
  //     setIsUsingLocalData(true);
  //     return;
  //   }

  //   if (data && data.status === 'success' && data.data && Array.isArray(data.data['companies-csv (1)'])) {
  //     console.log('Fetched data successfully, updating companies');
  //     setCompanies(data.data['companies-csv (1)']);
  //     setIsUsingLocalData(false);
  //   } else if (data && data.companies && Array.isArray(data.companies.data)) {
  //     console.log('Using local data');
  //     setCompanies(data.companies.data);
  //     setIsUsingLocalData(true);
  //   } else {
  //     console.log('Data not in expected format, using local data. Data:', data);
  //     setIsUsingLocalData(true);
  //   }
  // }, [data, loading, error]);

  console.log('Current companies data:', companies);

  const toggleCategory = (categoryName) => {
    console.log('Toggling category:', categoryName);
    setSelectedCategories((prev) => {
      const lowercaseName = categoryName.toLowerCase();
      if (prev.includes(lowercaseName)) {
        return prev.filter((c) => c !== lowercaseName);
      } else {
        return [...prev, lowercaseName];
      }
    });
    // Close the dropdown after selecting a category
    setIsCategoryDropdownOpen(false);
  };

  const filteredCompanies = companies.filter(
    (company) => selectedCategories.length === 0 || selectedCategories.includes(company.category?.name?.toLowerCase())
  );

  const isLinkedInLink = (url) => {
    return url && url.toLowerCase().includes('linkedin.com');
  };

  // Check if selected categories include any empty ones (no companies)
  const selectedEmptyCategories = useMemo(() => {
    return selectedCategories.filter(cat => !activeCategories.includes(cat));
  }, [selectedCategories, activeCategories]);

  const renderCategoriesSection = categories.length > 0 && (
    <>
      <p>Select one or more categories to filter the list below</p>
      <div className={`${styles.categoriesWrapper} ${isCategoryDropdownOpen ? styles.expanded : ''}`}>
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

  // Render placeholder for empty categories
  const renderEmptyCategoryPlaceholder = (categoryName) => (
    <div key={categoryName} className={styles.emptyCategoryPlaceholder}>
      <p className={styles.emptyCategoryTitle}>{categoryName}</p>
      <p className={styles.emptyCategoryMessage}>
        We are actively looking to invest in startups operating in the sector.
      </p>
    </div>
  );

  return (
    <div className={styles.container}>
      {renderCategoriesSection}
      {/* Show placeholders for selected empty categories */}
      {selectedEmptyCategories.length > 0 && (
        <div className={styles.emptyCategories}>
          {selectedEmptyCategories.map(catName => {
            const originalCat = categories.find(c => c.name?.toLowerCase() === catName);
            return renderEmptyCategoryPlaceholder(originalCat?.name || catName);
          })}
        </div>
      )}
      <div className={styles.companiesContainer}>
        {filteredCompanies.map((company, index) => (
          <div key={index} className={styles.companyCard}>
            <div className={styles.companyInfo}>
              <div className={styles.logoContainer}>
                <Image
                  src={company.logo || '/placeholder-logo.png'}
                  alt={company.name}
                  width={150}
                  height={150}
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <div className={styles.nameAndLink}>
                <p className={styles.companyName}>{company.name}</p>
                <p style={{textTransform:'uppercase',fontSize:'0.9rem'}}>{company.category?.name}</p>
                {company.link && (
                  <a href={company.link} className={styles.viewLink} target="_blank" rel="noopener noreferrer">
                    {isLinkedInLink(company.link) ? 'VIEW ON LINKEDIN' : 'VIEW SITE'}
                  </a>
                )}
              </div>
            </div>
            <div className={styles.companyDetail}>
              <p>{company.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};