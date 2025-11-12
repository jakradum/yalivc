'use client';

import { useState } from 'react';
import styles from './ContactForm.module.css';
import HeaderFlex from '../components/icons/headerflex';

export default function AirtableForm() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={styles.formContainer}>
      <div className={styles.leftPanel}>
        <HeaderFlex title="Get in touch" color="black" desktopMaxWidth={'65%'} mobileMinHeight={'8rem'} />
        <div className={styles.infoText}>
          <p>Looking to pitch to us? Fill the form out and we'll get back.</p>
          <p>Check our FAQs to know more about our process.</p>
        </div>

        <a href="#faq" className={styles.faqLink}>
          Jump to FAQ
          <span className={styles.arrow}>↓</span>
        </a>
      </div>

      <div className={styles.rightPanelAirtable}>
        {isLoading && (
          <div className={styles.shimmer}>
            <div className={styles.shimmerHeader}></div>
            <div className={styles.shimmerField}>
              <div className={styles.shimmerLabel}></div>
              <div className={styles.shimmerInput}></div>
            </div>
            <div className={styles.shimmerField}>
              <div className={styles.shimmerLabel}></div>
              <div className={styles.shimmerInput}></div>
            </div>
            <div className={styles.shimmerField}>
              <div className={styles.shimmerLabel}></div>
              <div className={styles.shimmerInput}></div>
            </div>
            <div className={styles.shimmerField}>
              <div className={styles.shimmerLabel}></div>
              <div className={styles.shimmerInputLarge}></div>
            </div>
          </div>
        )}
        <iframe
  className="airtable-embed"
  src="https://airtable.com/embed/appdPCHhYBcojFkH2/pagYMMvu3Pkxi1QY4/form"
  frameBorder="0"
  width="100%"
  height="1200"

  style={{
    background: 'transparent',
    border: 'none',
    display: isLoading ? 'none' : 'block',
  }}
  onLoad={() => setIsLoading(false)}
/>
      </div>
    </div>
  );
}