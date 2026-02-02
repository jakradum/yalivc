'use client';
import React, { useState } from 'react';
import styles from '../landing page styles/faqsection.module.css';

const AccordionItem = ({ question, answer, isOpen, onToggle }) => {
  return (
    <div className={`${styles.accordionItem} ${isOpen ? styles.open : ''}`}>
      <button
        className={styles.accordionHeader}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className={styles.question}>{question}</span>
        <span className={styles.icon}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      <div className={`${styles.accordionContent} ${isOpen ? styles.contentOpen : ''}`}>
        <div className={styles.answer}>
          {answer}
        </div>
      </div>
    </div>
  );
};

export default function FAQSection({ faqs = [] }) {
  const [openIndex, setOpenIndex] = useState(null);

  if (!faqs || faqs.length === 0) {
    return null;
  }

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={styles.faqSection} id="faqs">
      <div className={styles.accordionContainer}>
        {faqs.map((faq, index) => (
          <AccordionItem
            key={faq._id || index}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === index}
            onToggle={() => handleToggle(index)}
          />
        ))}
      </div>
    </div>
  );
}
