'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../data/fetch component';
import styles from './company inner comp.module.css';
import categoriesData from '../data/categories.json';
import Image from 'next/image';
import Button from '../components/button';
import { companyLogoMap } from '../components/companygrid';
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

export const CompaniesInnerComponent = () => {
  const windowWidth = useWindowWidth();
  const { data, loading, error } = useData();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isUsingLocalData, setIsUsingLocalData] = useState(true);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData.emergingTechnologies || [];
  const toggleCategoryDropdown = () => {
    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
  };

  const activeCategories = useMemo(() => {
    const activeCats = new Set();
    companies.forEach(company => {
      activeCats.add(company.category.toLowerCase());
    });
    return Array.from(activeCats);
  }, [companies]);

  
  useEffect(() => {
    console.log('useData hook output:', { data, loading, error });

    if (loading) {
      console.log('Currently loading, no action taken');
      return;
    }

    if (error) {
      console.log('Error fetching data, using local data:', error);
      setIsUsingLocalData(true);
      return;
    }

    if (data && data.status === 'success' && data.data && Array.isArray(data.data['companies-csv (1)'])) {
      console.log('Fetched data successfully, updating companies');
      setCompanies(data.data['companies-csv (1)']);
      setIsUsingLocalData(false);
    } else if (data && data.companies && Array.isArray(data.companies.data)) {
      console.log('Using local data');
      setCompanies(data.companies.data);
      setIsUsingLocalData(true);
    } else {
      console.log('Data not in expected format, using local data. Data:', data);
      setIsUsingLocalData(true);
    }
  }, [data, loading, error]);

  console.log('Current companies data:', companies);

  const toggleCategory = (category) => {
    console.log('Toggling category:', category);
    setSelectedCategories((prev) => {
      const lowercaseCategory = category.toLowerCase();
      if (prev.includes(lowercaseCategory)) {
        return prev.filter((c) => c !== lowercaseCategory);
      } else {
        return [...prev, lowercaseCategory];
      }
    });
    // Close the dropdown after selecting a category
    setIsCategoryDropdownOpen(false);
  };

  const filteredCompanies = companies.filter(
    (company) => selectedCategories.length === 0 || selectedCategories.includes(company.category.toLowerCase())
  );
  const isLinkedInLink = (url) => {
    return url && url.toLowerCase().includes('linkedin.com');
  };


  return (
    <div className={styles.container}>
      <div className={`${styles.categoriesWrapper} ${isCategoryDropdownOpen ? styles.expanded : ''}`}>
        <div className={styles.categoryDropdown}>
          <button className={styles.dropdownToggle} onClick={toggleCategoryDropdown}>
            CATEGORIES
            <ExpandIcon className={`${styles.expandIcon} ${isCategoryDropdownOpen ? styles.expanded : ''}`} />
          </button>
          <div className={`${styles.dropdownContent} ${isCategoryDropdownOpen ? styles.show : ''}`}>
            {categories.filter(category => activeCategories.includes(category.toLowerCase())).map((category, index) => (
              <button
                key={index}
                className={`${styles.categoryItem} ${
                  selectedCategories.includes(category.toLowerCase()) ? styles.selectedCategory : ''
                }`}
                onClick={() => toggleCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.categoriesContainer}>
          {categories.filter(category => activeCategories.includes(category.toLowerCase())).map((category, index) => (
            <button
              key={index}
              className={`${styles.categoryItem} ${
                selectedCategories.includes(category.toLowerCase()) ? styles.selectedCategory : ''
              }`}
              onClick={() => toggleCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.companiesContainer}>
        {filteredCompanies.map((company, index) => (
          <div key={index} className={styles.companyCard}>
            <div className={styles.companyInfo}>
              <div className={styles.logoContainer}>
                <Image
                  src={`/${companyLogoMap[company.name]}`}
                  alt={company.name}
                  width={150}
                  height={150}
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <div className={styles.nameAndLink}>
                <p className={styles.companyName}>{company.name}</p>
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
