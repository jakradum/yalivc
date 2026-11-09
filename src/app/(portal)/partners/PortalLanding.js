'use client';

import { useState, useEffect, useRef } from 'react';
import { Lightlogo } from '../../components/icons/lightlogo';
import styles from './partners.module.css';

const SESSION_KEY = 'yali-portal-entered';

export default function PortalLanding({ children }) {
  const [entered, setEntered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef(null);

  // The grid's light follows the mouse (desktop only; touch keeps the slow sweep).
  // Written straight to CSS variables so moving the mouse doesn't re-render.
  const handlePointerMove = (e) => {
    if (e.pointerType !== 'mouse' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    containerRef.current.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    containerRef.current.style.setProperty('--my', `${e.clientY - rect.top}px`);
    containerRef.current.classList.add(styles.landingPointer);
  };
  const handlePointerLeave = () => {
    containerRef.current?.classList.remove(styles.landingPointer);
  };

  // Check sessionStorage on mount
  useEffect(() => {
    const hasEntered = sessionStorage.getItem(SESSION_KEY) === 'true';
    if (hasEntered) {
      setEntered(true);
    }
    setIsLoading(false);
  }, []);

  // Handle agree button click
  const handleAgree = () => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setEntered(true);
  };

  // Handle exit button click
  const handleExit = () => {
    window.location.href = 'https://yali.vc';
  };

  // Show minimal loading state while checking session (prevents flash of landing page)
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#efefef' }} />
    );
  }

  if (entered) {
    return children;
  }

  return (
    <div
      ref={containerRef}
      className={styles.landingContainer}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* Logo at top */}
      <div className={styles.landingLogo}>
        <Lightlogo />
      </div>

      {/* Center content */}
      <div className={styles.landingContent}>
        {/* Title */}
        <h1 className={styles.landingTitle}>Quarterly Report</h1>

        {/* Subtitle */}
        <p className={styles.landingSubtitle}>
          Yali Partners LLP | Investment Manager - Deep Tech Focus
        </p>

        {/* Disclaimer in white box */}
        <div className={styles.landingDisclaimerBox}>
          <p className={styles.landingDisclaimer}>
            Dear Limited Partner, This report is for your eyes only, and is not meant to be shared, printed or reproduced in any manner, as the data you are about to read is strictly confidential. We appreciate your discretion in this matter.
          </p>
        </div>

        {/* Action buttons */}
        <div className={styles.landingActions}>
          <button
            className={styles.landingAgreeButton}
            onClick={handleAgree}
          >
            Agree
          </button>
          <button
            className={styles.landingExitButton}
            onClick={handleExit}
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
