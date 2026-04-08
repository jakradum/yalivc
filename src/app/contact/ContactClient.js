'use client';

import styles from './contact.module.css';
import ApplicationForm from '../components/ApplicationForm';
import { isFeatureEnabled } from '@/config/features';

export default function ContactClient() {
  const showApplicationForm = isFeatureEnabled('applicationForm');

  return (
    <div className={styles.pageContainer}>

      {/* Show ApplicationForm if feature flag is ON */}
      {showApplicationForm && (
        <section className={styles.formSection}>
          <ApplicationForm />
        </section>
      )}

      {/* New contact UI */}
      {!showApplicationForm && (
        <section className={styles.contactWrapper}>

          {/* Hero band */}
          <div className={styles.heroBand}>
            <div className={styles.heroTag}>CONTACT</div>
            <h2 className={styles.heroTitle}>Get in touch.</h2>
            <div className={styles.heroSubhead}>Write to us directly. We read every message.</div>
          </div>

          {/* Contact rows */}
          <div className={styles.contactRows}>

            <div className={styles.contactRow}>
              <div className={styles.rowLabel}>INVESTMENT OPPORTUNITIES</div>
              <p className={styles.rowDesc}>
                Looking to pitch? Write to us. Our AI analyst scans your pitch and routes it to the right team member.
              </p>
              <a href="mailto:pitch@yali.vc" className={styles.rowEmail}>
                pitch@yali.vc ↗
              </a>
            </div>

            <div className={`${styles.contactRow} ${styles.contactRowBorder}`}>
              <div className={styles.rowLabel}>PRESS &amp; GENERAL</div>
              <p className={styles.rowDesc}>
                Media inquiries, press releases, interview requests, investor relations, and all other correspondence.
              </p>
              <a href="mailto:press@yali.vc" className={styles.rowEmail}>
                press@yali.vc ↗
              </a>
            </div>

          </div>
        </section>
      )}

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
