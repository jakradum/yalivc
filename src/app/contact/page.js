'use client';

import { useState, useEffect } from 'react';
import styles from './contact.module.css';

const ContactPage = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 800);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const addressData = {
    title: "Registered Address",
    fullAddress: "No. 505, B Block, 3rd Cross, AECS Layout, Kundalahalli, Bengaluru - 560037, Karnataka, India",
    coordinates: "12.965802,77.7141267" // Exact coordinates from the Google Maps embed
  };

  // Google Maps URLs - using the place ID for more accurate mobile linking
  const mapsSearchUrl = `https://www.google.com/maps/place/YALI+CAPITAL/@12.965802,77.7141267,17z/data=!3m1!4b1!4m6!3m5!1s0x3bae1312799583c3:0x25472ff5dce8fbcf!8m2!3d12.965802!4d77.7167016!16s%2Fg%2F11qpw8n8kw?entry=ttu`;
  
  // Real Google Maps embed URL for Yali Capital office
  const embedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.0945368594817!2d77.71412677542132!3d12.965802187349023!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1312799583c3%3A0x25472ff5dce8fbcf!2sYALI%20CAPITAL!5e0!3m2!1sen!2sin!4v1749358917990!5m2!1sen!2sin`;

  const MapIcon = () => (
    <svg
      className={styles.mapIcon}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  );

  return (
    <section className={styles.sectionLevel}>
      {/* Microsoft Forms Container */}
      <div className={styles.formContainer}>
        <iframe
          src="https://forms.office.com/Pages/ResponsePage.aspx?id=DQSIkWdsW0yxEjajBLZtrQAAAAAAAAAAAAMAAAdeau5UOEJaUjNKOFU2RVNPRFlYUUhNWkNLR0NKTC4u&embed=true"
          className={styles.formIframe}
          frameBorder="0"
          marginWidth="0"
          marginHeight="0"
          allowFullScreen
          webkitallowfullscreen="true"
          mozallowfullscreen="true"
          msallowfullscreen="true"
          title="Contact Form"
        />
      </div>
      
      {/* Address and Map Section */}
      <div className={styles.addressSection}>
        <div className={styles.addressInfo}>
          <h3 className={styles.addressTitle}>{addressData.title}</h3>
          <p className={styles.addressText}>{addressData.fullAddress}</p>
        </div>
        
        <div className={styles.mapContainer}>
          {!isMobile ? (
            // Desktop: Embedded Google Map
            <iframe
              src={embedUrl}
              width="100%"
              height="190"
              className={styles.mapEmbed}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Yali Capital Office Location"
            />
          ) : (
            // Mobile: Clickable Link to Google Maps
            <a
              href={mapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.mapLink}
              aria-label="Open location in Google Maps"
            >
              <MapIcon />
              View on Maps
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

export default ContactPage;