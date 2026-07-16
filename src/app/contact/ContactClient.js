'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './contact.module.css';
import ApplicationForm from '../components/ApplicationForm';
import { isFeatureEnabled } from '@/config/features';

function ContactForm() {
  const [fields, setFields] = useState({ name: '', email: '', inquiry: '', message: '', _hp: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const set = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact-form/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong.');
        setStatus('error');
      } else {
        setStatus('success');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className={styles.formSuccess}>
        <div className={styles.formSuccessIcon}>✓</div>
        <p className={styles.formSuccessText}>Message received. We&rsquo;ll be in touch.</p>
      </div>
    );
  }

  const isPitch = fields.inquiry === 'pitch';

  return (
    <form className={styles.contactForm} onSubmit={handleSubmit} noValidate>
      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        name="_hp"
        value={fields._hp}
        onChange={set('_hp')}
        tabIndex={-1}
        aria-hidden="true"
        style={{ display: 'none' }}
      />

      <div className={styles.formRow}>
        <label className={styles.formLabel} htmlFor="cf-inquiry">Inquiry type</label>
        <select
          id="cf-inquiry"
          className={styles.formSelect}
          value={fields.inquiry}
          onChange={set('inquiry')}
          required
        >
          <option value="" disabled>Select...</option>
          <option value="press">Press / media inquiry</option>
          <option value="partnership">Partnership</option>
          <option value="pitch">Pitch</option>
        </select>
      </div>

      {isPitch ? (
        <div className={styles.pitchRedirect}>
          <p className={styles.pitchRedirectNote}>
            For investment pitches, write to us directly. Our AI analyst scans your pitch and routes it to the right team member.
          </p>
          <a href="mailto:pitch@yali.vc" className={styles.pitchRedirectEmail}>
            pitch@yali.vc ↗
          </a>
        </div>
      ) : (
        <>
          <div className={styles.formRow}>
            <label className={styles.formLabel} htmlFor="cf-name">Name</label>
            <input
              id="cf-name"
              type="text"
              className={styles.formInput}
              value={fields.name}
              onChange={set('name')}
              required
              autoComplete="name"
            />
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel} htmlFor="cf-email">Email</label>
            <input
              id="cf-email"
              type="email"
              className={styles.formInput}
              value={fields.email}
              onChange={set('email')}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel} htmlFor="cf-message">Message</label>
            <textarea
              id="cf-message"
              className={styles.formTextarea}
              value={fields.message}
              onChange={set('message')}
              required
              rows={4}
            />
          </div>

          {status === 'error' && (
            <p className={styles.formError}>{errorMsg}</p>
          )}

          {fields.inquiry && (
            <button type="submit" className={styles.formSubmit} disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending...' : 'Send message'}
            </button>
          )}
        </>
      )}
    </form>
  );
}

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
              <div className={styles.rowActions}>
                <a href="mailto:pitch@yali.vc" className={styles.rowEmail}>
                  pitch@yali.vc ↗
                </a>
                <Link href="/pitch" className={styles.rowPitchLink} aria-label="For Founders">
                  What we look for ↗
                </Link>
              </div>
            </div>

            <div className={`${styles.contactRow} ${styles.contactRowBorder}`}>
              <div className={styles.rowLabel}>PRESS &amp; GENERAL</div>
              <p className={styles.rowDesc}>
                Press, media, and partnership enquiries.
              </p>
              <ContactForm />
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
            title="Yali Capital office location map"
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
