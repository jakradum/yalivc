'use client';

import styles from './contact.module.css';
import AirtableForm from './AirtableForm';
import FAQ from '../components/FAQ';

export default function Contact() {
  return (
    <div className={styles.pageContainer}>
      {/* Header Section */}
      <section className={styles.headerSection}>
        {/* <h1 className={styles.pageTitle}>Get in Touch</h1> */}
        {/* <p className={styles.pageDescription}>
          Whether you're looking to pitch your startup, discuss partnerships, or have media
          inquiries, reach out to us using the appropriate contact below for the fastest response.
        </p> */}
      </section>

      {/* Form Section */}
      <section className={styles.formSection}>
        <AirtableForm />
      </section>
      <section className={styles.dividerSection}>
        <p>
          For press and media inquiries, visit our <a href="/newsroom">Newsroom</a> for the latest updates and press
          releases.
        </p>
      </section>

      {/* FAQ */}
      <section id="faq" className={styles.faqSection}>
        <FAQ />
      </section>

      {/* Email Disclaimer */}
      <section className={styles.dividerSection}>
        <p>
          Prefer email? You can reach us directly at <a href="mailto:pitch@yali.vc">pitch@yali.vc</a>, though we
          recommend using the form above as our team is typically inundated with email pitches.
        </p>
      </section>

      {/* Address Section - UNCHANGED */}
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