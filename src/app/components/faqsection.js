'use client';
import React, { useState } from 'react';
import styles from '../landing-page-styles/faqsection.module.css';

const AccordionItem = ({ question, answer, index, isOpen, onToggle }) => {
  const num = String(index + 1).padStart(2, '0');
  const answerId = `faq-answer-${index}`;
  const buttonId = `faq-btn-${index}`;
  return (
    <div className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}>
      <div className={styles.faqIndex} aria-hidden="true">{num}</div>
      <div className={styles.faqContent}>
        <button
          id={buttonId}
          className={styles.faqQuestionCol}
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={answerId}
        >
          <span className={styles.faqQuestion}>{question}</span>
          <span className={styles.faqToggle} aria-hidden="true">{isOpen ? '−' : '+'}</span>
        </button>
        <div
          id={answerId}
          role="region"
          aria-labelledby={buttonId}
          className={`${styles.faqAnswerCol} ${isOpen ? styles.faqAnswerColOpen : ''}`}
        >
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
