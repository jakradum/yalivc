'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '../data/fetch component';
import styles from './company inner comp.module.css';
import categoriesData from '../data/categories.json';
import Image from 'next/image';
import Button from '../components/button';
import { companyLogoMap } from '../components/companygrid';


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

  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData.emergingTechnologies || [];

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
  };

  const filteredCompanies = companies.filter(
    (company) => selectedCategories.length === 0 || selectedCategories.includes(company.category.toLowerCase())
  );
  const isLinkedInLink = (url) => {
    return url && url.toLowerCase().includes('linkedin.com');
  };

  return (
    <div className={styles.container}>
      {/* <p>Select one or more categories to filter</p> */}
      <div className={styles.categoriesWrapper}>
        <div className={styles.categoriesContainer}>
          {categories.map((category, index) => (
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
            <div className={styles.logoContainer}>
              <Image
                src={companyLogoMap[company.name] || '/logos/placeholder.png'}
                alt={`${company.name} logo`}
                width={150}
                height={150}
                style={{ objectFit: 'contain' }}
              />
            </div>
            <div className={styles.companyInfo}>
              <p className={styles.companyName}>{company.name}</p>
              {company.link && (
                <Button href={company.link} className={styles.viewLink} target="_blank" rel="noopener noreferrer">
                  {isLinkedInLink(company.link) ? 'VIEW ON LINKEDIN' : 'VIEW SITE'}
                </Button>
              )}
            </div>
            <div>
              <p className={styles.companyDetail}>{company.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};