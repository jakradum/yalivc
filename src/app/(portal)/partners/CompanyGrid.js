'use client';

import Link from 'next/link';
import styles from './partners.module.css';

export default function CompanyGrid({ portfolioData }) {
  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  const formatCurrency = (value, decimals = 0) => {
    if (!value && value !== 0) return '-';
    return `₹${Number(value).toFixed(decimals)} Cr`;
  };

  return (
    <div className={styles.companyGrid}>
      {portfolioData.map((item, index) => (
        <Link
          key={item.company?._id || index}
          href={`/partners/company/${item.company?.slug || item.company?._id}`}
          className={styles.companyCard}
          style={{ textDecoration: 'none' }}
        >
          {item.company?.logo ? (
            <img
              src={item.company.logo}
              alt={item.company.name}
              className={styles.companyLogo}
            />
          ) : (
            <div className={styles.companyLogoPlaceholder}>
              {getInitial(item.company?.name)}
            </div>
          )}
          <div className={styles.companyInfo}>
            <h3 className={styles.companyName}>{item.company?.name || 'Company'}</h3>
            <p className={styles.companyOneLiner}>{item.company?.oneLiner || item.company?.sector}</p>
            <div className={styles.companyMeta}>
              <span className={styles.companyMetaItem}>
                Invested: <span className={styles.companyMetaValue}>{formatCurrency(item.investment?.yaliInvestmentAmount, 1)}</span>
              </span>
              <span className={styles.companyMetaItem}>
                FMV: <span className={styles.companyMetaValue}>{formatCurrency(item.currentFMV, 1)}</span>
              </span>
              <span className={styles.companyMetaItem}>
                Multiple: <span className={styles.companyMetaValue}>{item.multipleOfInvestment?.toFixed(2)}x</span>
              </span>
            </div>
            {item.updates?.length > 0 && (
              <ul className={styles.companyUpdates}>
                {item.updates.slice(0, 2).map((update, i) => (
                  <li key={i}>{update}</li>
                ))}
              </ul>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
