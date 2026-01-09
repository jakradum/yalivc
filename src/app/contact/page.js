'use client';

import { useState } from 'react';
import styles from './contact.module.css';
import ApplicationForm from '../components/ApplicationForm';

export default function Contact() {
  const [copiedEmails, setCopiedEmails] = useState({});

  const copyToClipboard = async (email, index) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmails((prev) => ({ ...prev, [index]: true }));

      // Reset after 10 seconds
      setTimeout(() => {
        setCopiedEmails((prev) => ({ ...prev, [index]: false }));
      }, 10000);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  const contactCategories = [
    {
      title: 'Investment Opportunities',
      description:
        'Submit your startup pitch, discuss investment opportunities, and funding inquiries.',
      email: 'pitch@yali.vc',
    },
    {
      title: 'Press, Media & General Inquiries',
      description:
        'Media inquiries, press releases, interview requests, investor relations, and all other correspondence.',
      email: 'investor.relations@yali.vc',
    },
  ];

  return (
    <div className={styles.pageContainer}>
      {/* Header Section */}
      <section className={styles.headerSection}>
        <h1 className={styles.pageTitle}>Get in Touch</h1>
        <p className={styles.pageDescription}>
          Whether you're looking to pitch your startup, discuss partnerships, or have media
          inquiries, reach out to us using the form below or email addresses provided.
        </p>
      </section>

      {/* Application Form - Always visible */}
      <section className={styles.formSection}>
        <ApplicationForm />
      </section>

      {/* Email Contact Section */}
      <section className={styles.contactSection}>
        <p className={styles.sectionSubtitle}>
          Or write to us directly using one of these specialized contact addresses based on your
          inquiry type.
        </p>

        <div className={styles.contactGrid}>
            {contactCategories.map((category, index) => (
              <div key={index} className={styles.contactCard}>
                <h3 className={styles.cardTitle}>{category.title}</h3>
                <p className={styles.cardDescription}>{category.description}</p>
                <div className={styles.buttonGroup}>
                  <a href={`mailto:${category.email}`} className={styles.emailButton}>
                    Email {category.email}
                  </a>
                  <button
                    onClick={() => copyToClipboard(category.email, index)}
                    className={`${styles.copyButton} ${
                      copiedEmails[index] ? styles.copied : ''
                    }`}
                    title="Copy email address"
                  >
                    {copiedEmails[index] ? (
                      <>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                        <span className={styles.buttonText}>Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <span className={styles.buttonText}>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
      </section>

      {/* Address Section — always visible */}
      <section className={styles.addressSection}>
        <div className={styles.addressInfo}>
          <h3 className={styles.addressTitle}>Registered Address</h3>
          <address className={styles.addressText}>
            No. 505, B Block, 3rd Cross, AECS Layout,
            <br />
            Kundalahalli, Bengaluru - 560037,
            <br />
            Karnataka, India
          </address>
        </div>
        <div className={styles.mapContainer}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.094536859481!2d77.71412677542135!3d12.965802187349034!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1312799583c3%3A0x25472ff5dce8fbcf!2sYALI%20CAPITAL!5e0!3m2!1sen!2sin!4v1755756637918!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className={styles.mapEmbed}
          ></iframe>
        </div>
      </section>
    </div>
  );
}
