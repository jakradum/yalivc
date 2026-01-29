'use client';

import { useState } from 'react';
import { Lightlogo } from '../../components/icons/lightlogo';
import { Graphicfg } from '../../components/icons/background svgs/graphicfg';
import styles from './partners.module.css';

export default function PortalLanding({ children }) {
  const [entered, setEntered] = useState(false);

  if (entered) {
    return children;
  }

  return (
    <div className={styles.landingContainer}>
      {/* Logo at top */}
      <div className={styles.landingLogo}>
        <Lightlogo />
      </div>

      {/* Center content */}
      <div className={styles.landingContent}>
        {/* Yali logo - dotted outline, fills on hover */}
        <div className={styles.landingGraphic}>
          <Graphicfg />
        </div>

        {/* Title */}
        <h1 className={styles.landingTitle}>Quarterly Report</h1>

        {/* Subtitle */}
        <p className={styles.landingSubtitle}>
          Yali Partners LLP | Investment Manager - Deep Tech Focus
        </p>

        {/* Disclaimer */}
        <p className={styles.landingDisclaimer}>
          Dear Limited Partner, This report is for your eyes only, and is not meant to be shared, printed or reproduced in any manner, as the data you are about to read is strictly confidential. We appreciate your discretion in this matter.
        </p>

        {/* Enter button */}
        <button
          className={styles.landingButton}
          onClick={() => setEntered(true)}
        >
          Click to Enter
        </button>
      </div>
    </div>
  );
}
