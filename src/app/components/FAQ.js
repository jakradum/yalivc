'use client';

import { useState } from 'react';
import styles from './FAQ.module.css';
import titleStyles from '../contact/ContactForm.module.css';
import HeaderFlex from '../components/icons/headerflex';
import { ExpandIcon } from '../components/icons/small icons/expandIcon';

export default function FAQ({ title, description, faqs }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={titleStyles.formContainer}>
      <div className={titleStyles.leftPanel}>
        <HeaderFlex title={title} color="black" desktopMaxWidth={'80%'} mobileMinHeight={'8rem'}/>
        <div className={titleStyles.infoText}>
          <p>{description}</p>
        </div>
      </div>

      <div className={titleStyles.rightPanel}>
        {faqs.map((faq, index) => (
          <div key={index} className={titleStyles.faqItem}>
            <button
              className={styles.faqQuestion}
              onClick={() => toggleFAQ(index)}
              aria-expanded={openIndex === index}
            >
              <span>{faq.question}</span>
              <ExpandIcon isExpanded={openIndex === index} />
            </button>
            
            <div className={`${styles.faqAnswer} ${openIndex === index ? styles.open : ''}`}>
              <p>{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}