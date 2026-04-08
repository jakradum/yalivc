'use client';
import React, { useState } from 'react';
import styles from '../landing-page-styles/faqsection.module.css';

const AccordionItem = ({ question, answer, index, isOpen, onToggle }) => {
  const num = String(index + 1).padStart(2, '0');
  return (
    <div
      className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}
      onClick={onToggle}
    >
      <div className={styles.faqIndex}>{num}</div>
      <div className={styles.faqContent}>
        <div className={styles.faqQuestionCol}>
          <span className={styles.faqQuestion}>{question}</span>
          <span className={styles.faqToggle} aria-hidden="true">{isOpen ? '−' : '+'}</span>
        </div>
        <div className={`${styles.faqAnswerCol} ${isOpen ? styles.faqAnswerColOpen : ''}`}>
          <div className={styles.faqAnswer}>{answer}</div>
        </div>
      </div>
    </div>
  );
};

export default function FAQSection({ faqs = [] }) {
  const [openIndex, setOpenIndex] = useState(0);

  if (!faqs || faqs.length === 0) return null;

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={styles.faqSection} id="faqs">
      <div className={styles.faqList}>
        {faqs.map((faq, index) => (
          <AccordionItem
            key={faq._id || index}
            question={faq.question}
            answer={faq.answer}
            index={index}
            isOpen={openIndex === index}
            onToggle={() => handleToggle(index)}
          />
        ))}
      </div>
    </div>
  );
}
