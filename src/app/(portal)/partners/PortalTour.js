'use client';

import { useState, useEffect } from 'react';
import styles from './partners.module.css';

const TOUR_STORAGE_KEY = 'portal-tour-completed';

export default function PortalTour() {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Check if tour was already completed
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!tourCompleted) {
      // Small delay to let the page render first
      const showTimer = setTimeout(() => setShowTour(true), 500);
      return () => clearTimeout(showTimer);
    }
  }, []);

  useEffect(() => {
    if (showTour) {
      // Auto-dismiss after 5 seconds
      const dismissTimer = setTimeout(() => {
        handleDismiss();
      }, 5000);
      return () => clearTimeout(dismissTimer);
    }
  }, [showTour]);

  const handleDismiss = () => {
    setShowTour(false);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  };

  if (!showTour) return null;

  return (
    <div className={styles.tourOverlay}>
      {/* Sidebar callout */}
      <div className={`${styles.tourCallout} ${styles.tourCalloutSidebar}`}>
        <div className={styles.tourArrow} />
        <p>Collapse or expand the sidebar to navigate through the report</p>
      </div>

      {/* Quarter selector callout */}
      <div className={`${styles.tourCallout} ${styles.tourCalloutQuarter}`}>
        <div className={styles.tourArrow} />
        <p>Select from previous reports here</p>
      </div>

      {/* Portfolio updates callout */}
      <div className={`${styles.tourCallout} ${styles.tourCalloutPortfolio}`}>
        <div className={styles.tourArrow} />
        <p>Click on a company to view quarterly performance in detail</p>
      </div>

      {/* Dismiss button */}
      <button className={styles.tourDismissBtn} onClick={handleDismiss}>
        Got it
      </button>
    </div>
  );
}
