import React from 'react';
import companiesData from '../data/companies.json';
import styles from '../landing page styles/companies.module.css';

const CompanyGrid = () => {
  return (
    <div className={styles.companyGridContainer}>
      <div className={styles.sidebar}>
        <p className={styles.sidebarText}>
          Our team's prior investments span a range of startups in the deep tech domain, some of which have made it to
          public markets in India.
        </p>
        <button className={styles.knowMoreButton}>KNOW MORE</button>
      </div>
      <div className={styles.companyGrid}>
        {companiesData.companies.slice(0, 10).map((company, index) => (
          <div key={index} className={styles.companyCard}>
            <div className={styles.companyNumber}><h2>{String(index + 1).padStart(2, '0')}</h2></div>
            <h4 className={styles.companyTitle}>{company.name}</h4>
            <p className={styles.companyCategory}>{company.category}</p>
            <small>{company.oneLiner}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanyGrid;