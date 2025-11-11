'use client';

import { useState } from 'react';
import styles from './FAQ.module.css';
import titleStyles from '../contact/ContactForm.module.css';
import HeaderFlex from '../components/icons/headerflex';
import { ExpandIcon } from '../components/icons/small icons/expandIcon';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "What sectors do you invest in?",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
    },
    {
      question: "What funding rounds do you participate in?",
      answer: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    },
    {
      question: "Can companies at any stage apply?",
      answer: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo."
    },
    {
      question: "How long does the review process take?",
      answer: "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est."
    },
    {
      question: "What is your typical investment process?",
      answer: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident."
    },
    {
      question: "What do you look for in a pitch?",
      answer: "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus."
    },
    {
      question: "Do you provide follow-on funding?",
      answer: "Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus."
    },
    {
      question: "What geographies do you invest in?",
      answer: "Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur. Ut enim ad minima veniam."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    
    <div className={titleStyles.formContainer}>
      {/* Left Panel */}
      <div className={titleStyles.leftPanel}>
        <HeaderFlex title="Frequently Asked Questions" color="black" desktopMaxWidth={'80%'} mobileMinHeight={'8rem'}/>
        <div className={titleStyles.infoText}>
          <p>Got more questions? Feel free to contact us for more information by clicking the link provided below.</p>
        </div>
      </div>

      {/* Right Panel - FAQ Items */}
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
            
            <div 
              className={`${styles.faqAnswer} ${openIndex === index ? styles.open : ''}`}
            >
              <p>{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
