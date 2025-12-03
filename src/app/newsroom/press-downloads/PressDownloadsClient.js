'use client';

import { useState } from 'react';
import styles from './press-downloads.module.css';
import Image from 'next/image';

function CopyIcon({ copied }) {
  if (copied) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  );
}

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button onClick={handleCopy} className={styles.copyButton} title={copied ? 'Copied!' : `Copy ${label}`}>
      <CopyIcon copied={copied} />
      <span>{copied ? 'Copied!' : 'Copy'}</span>
    </button>
  );
}

function CopyImageButton() {
  const [copied, setCopied] = useState(false);

  const handleCopyImage = async () => {
    try {
      const response = await fetch('/yali-logo.png');
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy image:', err);
      // Fallback: copy the URL
      try {
        await navigator.clipboard.writeText(window.location.origin + '/yali-logo.png');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error('Fallback failed:', e);
      }
    }
  };

  return (
    <button onClick={handleCopyImage} className={styles.copyButton} title={copied ? 'Copied!' : 'Copy logo'}>
      <CopyIcon copied={copied} />
      <span>{copied ? 'Copied!' : 'Copy'}</span>
    </button>
  );
}

export default function PressDownloadsClient({ categories, teamMembers }) {
  // Format category names for boilerplate
  const categoryNames = categories?.map(c => c.name.toLowerCase()).join(', ') ||
    'artificial intelligence, robotics, life sciences, semiconductors, aerospace and defence, and advanced manufacturing';

  const boilerplateText = `Yali Capital is an early-stage deep tech venture capital fund based in Bangalore, India. The fund focuses on backing innovative startups across ${categoryNames}.

With a corpus of ₹810 crore (approximately $100 million), Yali Capital invests in companies that are building deep, technologically superior products with strong intellectual property and the potential to create global impact from India.

The team at Yali Capital brings over 60 years of combined experience in deep tech investing, having previously backed several successful companies that have gone public in Indian markets.`;

  return (
    <>
      {/* Logo and About side by side */}
      <div className={styles.twoColumnSection}>
        {/* Logo Section */}
        <div className={styles.logoSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Logo</h2>
            <CopyImageButton />
          </div>
          <div className={styles.logoContainer}>
            <Image
              src="/yali-logo.png"
              alt="Yali Capital Logo"
              width={300}
              height={120}
              className={styles.logo}
              style={{ objectFit: 'contain' }}
            />
          </div>
          <p className={styles.logoNote}>Right-click to save. PNG with transparent background.</p>
        </div>

        {/* Boilerplate Section */}
        <div className={styles.aboutSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>About Yali Capital</h2>
            <CopyButton text={boilerplateText} label="boilerplate" />
          </div>
          <div className={styles.boilerplate}>
            <p>
              Yali Capital is an early-stage deep tech venture capital fund based in Bangalore, India.
              The fund focuses on backing innovative startups across {categoryNames}.
            </p>
            <p>
              With a corpus of ₹810 crore (approximately $100 million), Yali Capital invests
              in companies that are building deep, technologically superior products with strong intellectual
              property and the potential to create global impact from India.
            </p>
            <p>
              The team at Yali Capital brings over 60 years of combined experience in deep tech
              investing, having previously backed several successful companies that have gone
              public in Indian markets.
            </p>
          </div>
        </div>
      </div>

      {/* Team Bios Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Team Bios</h2>
        <p className={styles.sectionNote}>For media use only. High-resolution photos available on request.</p>
        <div className={styles.teamBios}>
          {teamMembers?.map((member, index) => (
            <div key={index} className={styles.teamBio}>
              <div className={styles.teamBioHeader}>
                <div>
                  <h3>{member.name}</h3>
                  <p className={styles.role}>{member.role}</p>
                </div>
                <CopyButton
                  text={`${member.name}, ${member.role}\n${member.oneLiner || ''}`}
                  label="bio"
                />
              </div>
              <p className={styles.oneLiner}>{member.oneLiner}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className={styles.contactSection}>
        <h3>Media Inquiries</h3>
        <p>For high-resolution images, interview requests, or additional information, please email <a href="mailto:pranav@yali.vc">pranav@yali.vc</a>.</p>
      </div>
    </>
  );
}
