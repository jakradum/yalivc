"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import styles from '../styles/page.module.css';

const companyData = [
  { name: 'Logo 1', details: 'Details about Logo 1', fundedYear: '2020' },
  { name: 'Logo 2', details: 'Details about Logo 2', fundedYear: '2021' },
  { name: 'Logo 3', details: 'Details about Logo 3', fundedYear: '2022' },
  { name: 'Logo 4', details: 'Details about Logo 4', fundedYear: '2023' },
  { name: 'Logo 5', details: 'Details about Logo 5', fundedYear: '2024' },
  { name: 'Logo 6', details: 'Details about Logo 6', fundedYear: '2025' },
];

export default function CompanyShowcase() {
  const [selectedCompany, setSelectedCompany] = useState(null);

  return (
    <section className={`${styles.section} ${styles.companies}`}>
      <h2 className={styles.sectionTitle}>OUR COMPANIES MAKE US PROUD</h2>
      <p className={styles.sectionDescription}>
        Our investments span a range of startups in the deep tech domain, some
        of which have made it to public markets in India.
      </p>
      
      {/* Desktop Layout */}
      <div className={styles.desktopLayout}>
        <div className={styles.companyDetails}>
          {selectedCompany ? (
            <>
              <div className={styles.companyImage}>
                <Image
                  src={`/path/to/${selectedCompany.name.toLowerCase()}-image.jpg`}
                  alt={selectedCompany.name}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <div className={styles.companyInfo}>
                <h3>{selectedCompany.name}</h3>
                <p>FUNDED {selectedCompany.fundedYear}</p>
                <p>{selectedCompany.details}</p>
              </div>
            </>
          ) : (
            <p>Select a company to view details</p>
          )}
        </div>
        <div className={styles.companyCarouselTrack}>
          {companyData.map((company, index) => (
            <div
              key={index}
              className={styles.companyLogo}
              onClick={() => setSelectedCompany(company)}
            >
              {company.name}
            </div>
          ))}
        </div>
      </div>
      
      {/* Mobile Layout */}
      <div className={styles.mobileLayout}>
        <div className={styles.companyCarousel}>
          <div className={styles.companyCarouselTrack}>
            {companyData.map((company, index) => (
              <div
                key={index}
                className={styles.companyLogo}
                onClick={() => setSelectedCompany(company)}
              >
                {company.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}