import React from 'react';
import companiesData from '../data/companies.json';
import styles from '../landing page styles/companies.module.css';
import Button from './button';

const CompanyTable = () => {
  return (
    <div className={styles.companyTableContainer}>
      <div className={styles.sidebar}>
        <p className={styles.sidebarText}>
          Our team's prior investments span a range of startups in the deep tech domain, some of which have made it to
          public markets in India.
        </p>
        <Button href="/learn-more" color="black">Know More</Button>
      </div>
      <table className={styles.companyTable}>
        <tbody>
          {[0, 1].map(row => (
            <tr key={row}>
              {companiesData.companies.slice(row * 5, (row + 1) * 5).map((company, index) => (
                <td key={index} className={styles.companyCell}>
                  <div className={styles.companyNumber}><h2>{String(row * 5 + index + 1).padStart(2, '0')}</h2></div>
                  <h4 className={styles.companyTitle}>{company.name}</h4>
                  <p className={styles.companyCategory}>{company.category}</p>
                  <small>{company.oneLiner}</small>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyTable;