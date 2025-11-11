'use client';

import styles from './ContactForm.module.css';
import HeaderFlex from '../components/icons/headerflex';

export default function AirtableForm() {
  return (
    <div className={styles.formContainer}>
      {/* Left Panel */}
      <div className={styles.leftPanel}>
        <HeaderFlex 
          title="Get in touch" 
          color="black" 
          desktopMaxWidth={'65%'} 
          mobileMinHeight={'8rem'} 
        />
        <div className={styles.infoText}>
          <p>Looking to pitch to us? Fill the form out and we'll get back.</p>
          <p>Check our FAQs to know more about our process.</p>
        </div>

        <a href="#faq" className={styles.faqLink}>
          Jump to FAQ
          <span className={styles.arrow}>↓</span>
        </a>
      </div>

      {/* Right Panel - Airtable Embed */}
      <div className={styles.rightPanelAirtable}>
        <iframe 
          className="airtable-embed" 
          src="https://airtable.com/embed/appdPCHhYBcojFkH2/pagYMMvu3Pkxi1QY4/form" 
          frameBorder="0" 
          width="100%" 
          height="900"
          style={{ 
            background: 'transparent', 
            border: 'none',
            display: 'block'
          }}
        />
      </div>
    </div>
  );
}