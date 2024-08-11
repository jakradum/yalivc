"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import styles from '../styles/page.module.css';

const companyData = [
  { name: 'Idea Forge', details: 'Details about Idea Forge', fundedYear: '2020' },
  { name: 'Company2', details: 'Details about Company2', fundedYear: '2021' },
  { name: 'Company3', details: 'Details about Company3', fundedYear: '2019' },
  { name: 'Company4', details: 'Details about Company4', fundedYear: '2022' },
  { name: 'Company5', details: 'Details about Company5', fundedYear: '2018' },
  { name: 'Company6', details: 'Details about Company6', fundedYear: '2023' },
  { name: 'Company7', details: 'Details about Company7', fundedYear: '2020' },
  { name: 'Company8', details: 'Details about Company8', fundedYear: '2021' },
  { name: 'Company9', details: 'Details about Company9', fundedYear: '2022' },
  { name: 'Company10', details: 'Details about Company10', fundedYear: '2023' },
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
        <div className={styles.companyGrid}>
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
        {selectedCompany && (
          <div className={styles.mobileCompanyDetails}>
            <h3>{selectedCompany.name}</h3>
            <p>FUNDED {selectedCompany.fundedYear}</p>
            <p>{selectedCompany.details}</p>
          </div>
        )}
      </div>
    </section>
  );
}