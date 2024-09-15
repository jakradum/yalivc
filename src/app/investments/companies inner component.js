"use client"

import React, { useState, useEffect } from 'react';
import { useData } from '../data/fetch component';
import styles from './company inner comp.module.css';
import categoriesData from '../data/categories.json';
import Button from '../components/button';

export const CompaniesInnerComponent = () => {
  const { data, loading, error } = useData();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isUsingLocalData, setIsUsingLocalData] = useState(true);

  const categories = Array.isArray(categoriesData) 
    ? categoriesData 
    : categoriesData.emergingTechnologies || [];

  useEffect(() => {
    console.log("useData hook output:", { data, loading, error });

    if (loading) {
      console.log("Currently loading, no action taken");
      return;
    }

    if (error) {
      console.log("Error fetching data, using local data:", error);
      setIsUsingLocalData(true);
      return;
    }

    if (data && data.status === "success" && data.data && Array.isArray(data.data['companies-csv (1)'])) {
      console.log("Fetched data successfully, updating companies");
      setCompanies(data.data['companies-csv (1)']);
      setIsUsingLocalData(false);
    } else if (data && data.companies && Array.isArray(data.companies.data)) {
      console.log("Using local data");
      setCompanies(data.companies.data);
      setIsUsingLocalData(true);
    } else {
      console.log("Data not in expected format, using local data. Data:", data);
      setIsUsingLocalData(true);
    }
  }, [data, loading, error]);

  console.log("Current companies data:", companies);
  

  const toggleCategory = (category) => {
    
    console.log("Toggling category:", category);
    setSelectedCategories(prev => {
      const lowercaseCategory = category.toLowerCase();
      if (prev.includes(lowercaseCategory)) {
        return prev.filter(c => c !== lowercaseCategory);
      } else {
        return [...prev, lowercaseCategory];
      }
    });
  };

  const filteredCompanies = companies.filter(company => 
    selectedCategories.length === 0 || selectedCategories.includes(company.category.toLowerCase())
  );
  const isLinkedInLink = (url) => {
    return url && url.toLowerCase().includes('linkedin.com');
  };

  return (
    <div className={styles.container}>
      <h2>Categories ({categories.length})</h2>
      <div className={styles.categoriesContainer}>
        {categories.map((category, index) => (
          <button
            key={index}
            className={`${styles.categoryItem} ${selectedCategories.includes(category.toLowerCase()) ? styles.selectedCategory : ''}`}
            onClick={() => toggleCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <h2>Companies ({filteredCompanies.length})</h2>
      {isUsingLocalData && <p className={styles.dataSource}>Using local data</p>}
      {loading && <p className={styles.loading}>Loading updated data...</p>}
      <div className={styles.companiesContainer}>
        {filteredCompanies.map((company, index) => (
          <div key={index} className={styles.companyCard}>
            <h3 className={styles.companyName}>{company.name}</h3>
            <p className={styles.companyCategory}>{company.category}</p>
            <p className={styles.companyOneLiner}>{company.oneLiner}</p>
            <p className={styles.companyDetail}>{company.detail}</p>
            {company.link && (
              <Button 
                color="black" 
                href={company.link} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {isLinkedInLink(company.link) ? 'View on LinkedIn' : 'View site'}
              </Button>
            )}
          </div>
        ))}
      </div>

      <div>
        <h3>Debug Information</h3>
        <p>Selected Categories: {selectedCategories.join(', ')}</p>
        <p>Total Companies: {companies.length}</p>
        <p>Filtered Companies: {filteredCompanies.length}</p>
        <p>Data Source: {isUsingLocalData ? 'Local' : 'Fetched'}</p>
      </div>
    </div>
  );
};